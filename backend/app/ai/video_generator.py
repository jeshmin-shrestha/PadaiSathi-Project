"""
PadaiSathi AI — Video Generator  (v6 — Whisper caption sync)
Place at:  backend/app/ai/video_generator.py

How it works
────────────
1. edge-tts generates the MP3  (this already works perfectly)
2. stable-ts (Whisper) listens to that MP3 and returns EXACT word timestamps
3. Captions are built from those timestamps — perfectly synced, no guessing

Install once:
    pip install stable-ts

On first run, Whisper downloads the 'base' model (~140MB) automatically.
Subsequent runs use the cached model — fast.

If you want even more accuracy at the cost of speed, change:
    WHISPER_MODEL = "small"   # ~460MB, noticeably better
    WHISPER_MODEL = "medium"  # ~1.5GB, very accurate
"""

import os
import re
import json
import asyncio
import contextlib
from pathlib import Path

os.environ['IMAGEMAGICK_BINARY'] = r"C:\Program Files\ImageMagick-7.1.2-Q16-HDRI\magick.exe"

from moviepy.editor import *
import PIL.Image
if not hasattr(PIL.Image, 'ANTIALIAS'):
    PIL.Image.ANTIALIAS = PIL.Image.Resampling.LANCZOS

# ── Paths ─────────────────────────────────────────────────────────────────────
# Use absolute paths so these work regardless of which directory uvicorn is started from
_HERE      = Path(__file__).resolve().parent          # backend/app/ai/
_ROOT      = _HERE.parent.parent.parent               # project root
OUTPUT_DIR = _ROOT / "backend" / "generated_videos"
ASSET_DIR  = _ROOT / "frontend" / "src" / "assets" / "backgrounds"
TEMP_DIR   = _ROOT / "backend" / "temp_video"

# ── Caption style ─────────────────────────────────────────────────────────────
BASE_WIDTH       = 1920
CAPTION_FONTSIZE = 120
CAPTION_STROKE_W = 4      # thin clean outline, no box
CAPTION_COLOR    = "white"
CAPTION_STROKE   = "black"
WORDS_PER_CARD   = 2      # max 2 words at a time
CAPTION_Y_RATIO  = 0.50   # dead centre of frame

# ── Whisper model ─────────────────────────────────────────────────────────────
# "base" = fast, ~140MB download, good enough for TTS audio (it's clean speech)
# "small" = better accuracy, ~460MB — upgrade if you want
WHISPER_MODEL = "small"

# ── Voice map ─────────────────────────────────────────────────────────────────
THEME_VOICES = {
    "subway":    "en-US-GuyNeural",
    "minecraft": "en-US-ChristopherNeural",
    "slime":     "en-US-AnaNeural",
}
DEFAULT_VOICE = "en-US-GuyNeural"

# openers 

VIDEO_OPENERS = [
    "Hey besties!", "Okay real talk...", "Here's the tea!",
    "Sup scholars!", "Alright listen up!", "No cap this topic is wild —",
]
VIDEO_CLOSERS = [
    "Now go ace that exam!", "That's the tea fam!", "You got this bestie!",
    "Go slay that paper!", "Stay curious, stay winning!",
]
MAX_TTS_CHARS = 1500

def _ensure_video_script(text: str) -> str:
    import random
    text = text.strip()
    if not text:
        return text
    has_opener = any(text.lower().startswith(o.lower()) or o.lower() in text[:80].lower() for o in VIDEO_OPENERS)
    if not has_opener:
        text = random.choice(VIDEO_OPENERS) + " " + text
    if len(text) > MAX_TTS_CHARS:
        truncated = text[:MAX_TTS_CHARS]
        last_end = max(truncated.rfind('.'), truncated.rfind('!'), truncated.rfind('?'))
        text = truncated[:last_end + 1] if last_end > MAX_TTS_CHARS // 2 else truncated[:truncated.rfind(' ')]
    has_closer = any(c.lower() in text[-100:].lower() for c in VIDEO_CLOSERS)
    if not has_closer:
        if text and text[-1] not in '.!?':
            last_end = max(text.rfind('.'), text.rfind('!'), text.rfind('?'))
            if last_end > len(text) // 2:
                text = text[:last_end + 1]
        text = text + " " + random.choice(VIDEO_CLOSERS)
    return text
# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _setup():
    for d in [OUTPUT_DIR, TEMP_DIR, ASSET_DIR]:
        d.mkdir(parents=True, exist_ok=True)


def _clean_text(text: str) -> str:
    # Remove markdown headers
    text = re.sub(r'^#{1,6}\s*', '', text, flags=re.MULTILINE)
    
    # Remove emoji characters
    text = re.sub(r'[\U00010000-\U0010ffff]', '', text)  # emoji range
    text = re.sub(r'[\U0001F300-\U0001F9FF]', '', text)  # more emojis
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)           # any non-ASCII
    
    # Remove markdown bold/italic
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)  # **bold**
    text = re.sub(r'\*(.+?)\*', r'\1', text)        # *italic*
    
    # Remove bullet points and arrows
    text = re.sub(r'^[\*\-•→]\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'→', '', text)
    
    # Remove leading special characters per line
    text = re.sub(r'^[^\w\s]+\s*', '', text, flags=re.MULTILINE)
    
    # Clean up whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text


# ─────────────────────────────────────────────────────────────────────────────
# TTS  — edge-tts, just audio (no WordBoundary needed anymore)
# ─────────────────────────────────────────────────────────────────────────────

async def _tts_edge_async(text: str, mp3_path: str, voice: str):
    """Generate MP3 via edge-tts. Whisper handles timestamps separately."""
    import edge_tts
    communicate = edge_tts.Communicate(text, voice)
    with open(mp3_path, "wb") as f:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])


def _run_async(coro):
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                pool.submit(asyncio.run, coro).result()
        else:
            loop.run_until_complete(coro)
    except RuntimeError:
        asyncio.run(coro)


def _tts(text: str, mp3_path: str, theme: str = "subway") -> float:
    """Generate MP3, return duration in seconds."""
    clean = _clean_text(text)
    clean = _ensure_video_script(clean)
    print(f"[TTS] Script ({len(clean)} chars): {clean[:80]}…")

    voice = THEME_VOICES.get(theme, DEFAULT_VOICE)
    print(f"[TTS] 🎙️  {voice}")

    try:
        from pydub import AudioSegment
        _run_async(_tts_edge_async(clean, mp3_path, voice))
        duration = len(AudioSegment.from_mp3(mp3_path)) / 1000.0
        print(f"[TTS] ✅ {duration:.3f}s")
        return duration
    except ImportError:
        print("[TTS] ⚠️  edge-tts not installed — falling back to gTTS")
        return _tts_gtts(clean, mp3_path)
    except Exception as e:
        print(f"[TTS] ❌ {e} — falling back to gTTS")
        return _tts_gtts(clean, mp3_path)


def _tts_gtts(text: str, mp3_path: str) -> float:
    from gtts import gTTS
    from pydub import AudioSegment
    gTTS(text=text, lang='en', slow=False).save(mp3_path)
    return len(AudioSegment.from_mp3(mp3_path)) / 1000.0


# ─────────────────────────────────────────────────────────────────────────────
# Whisper transcription — exact word timestamps from the real audio
# ─────────────────────────────────────────────────────────────────────────────

def _transcribe_words(mp3_path: str) -> list:
    """
    Run stable-ts Whisper on the MP3 and extract word-level timestamps.
    Returns [ {"word": str, "start": float, "end": float} ]

    stable-ts is purpose-built for accurate subtitle timing — it refines
    Whisper's segment boundaries down to individual words.
    """
    try:
        import stable_whisper as stable_ts

        print(f"[Whisper] Loading model: {WHISPER_MODEL}")
        model = stable_ts.load_model(WHISPER_MODEL)

        print(f"[Whisper] Transcribing: {mp3_path}")
        result = model.transcribe(
            mp3_path,
            language="en",
            word_timestamps=True,
            vad=False,           # VAD off — TTS audio has no silence gaps to skip
        )

        # Extract all words from all segments
        word_times = []
        for segment in result.segments:
            for word in segment.words:
                w = re.sub(r'[^\w\s\'-]', '', word.word).strip()
                if w:
                    word_times.append({
                        "word":  w,
                        "start": round(word.start, 4),
                        "end":   round(word.end,   4),
                    })

        print(f"[Whisper] ✅ {len(word_times)} words transcribed")
        if word_times:
            print(f"[Whisper] First: '{word_times[0]['word']}' @ {word_times[0]['start']:.3f}s")
            print(f"[Whisper] Last : '{word_times[-1]['word']}' ends @ {word_times[-1]['end']:.3f}s")
        return word_times

    except ImportError:
        print("[Whisper] ⚠️  stable-ts not installed")
        print("[Whisper]    Run:  pip install stable-ts")
        print("[Whisper]    Falling back to proportional caption timing")
        return []
    except Exception as e:
        print(f"[Whisper] ❌ Transcription failed: {e}")
        print("[Whisper]    Falling back to proportional caption timing")
        return []


# ─────────────────────────────────────────────────────────────────────────────
# Caption timing builders
# ─────────────────────────────────────────────────────────────────────────────

def _build_timings_from_words(word_times: list, words_per_card: int = WORDS_PER_CARD) -> list:
    """Group Whisper word timestamps into N-word caption cards."""
    cards = []
    for i in range(0, len(word_times), words_per_card):
        group = word_times[i : i + words_per_card]
        # Card ends when the next card starts (seamless flip)
        card_end = (
            word_times[i + words_per_card]["start"] - 0.02
            if i + words_per_card < len(word_times)
            else group[-1]["end"]
        )
        cards.append({
            "text":  " ".join(w["word"] for w in group),
            "start": group[0]["start"],
            "end":   card_end,
        })
    return cards


def _build_timings_fallback(text: str, audio_duration: float, words_per_card: int = WORDS_PER_CARD) -> list:
    """
    Proportional fallback when Whisper isn't available.
    Still uses real audio duration so pacing matches TTS speed.
    """
    words = _clean_text(text).split()
    n = len(words)
    if n == 0:
        return []

    secs_per_word = audio_duration / n
    cards, t = [], 0.05

    for i in range(0, n, words_per_card):
        group = words[i : i + words_per_card]
        dur   = len(group) * secs_per_word
        cards.append({"text": " ".join(group), "start": t, "end": t + dur})
        t += dur

    return cards


# ─────────────────────────────────────────────────────────────────────────────
# Background
# ─────────────────────────────────────────────────────────────────────────────

def _background(theme: str, duration: float):
    print(f"[VideoGen] Background: {theme}.mp4")

    def _load_and_loop(path: Path):
        clip = VideoFileClip(str(path))
        if clip.duration < duration:
            loops = int(duration / clip.duration) + 1
            clip  = concatenate_videoclips([clip] * loops)
        return clip.subclip(0, duration)

    exact = ASSET_DIR / f"{theme}.mp4"
    if exact.exists():
        return _load_and_loop(exact)
    for f in ASSET_DIR.glob("*.mp4"):
        if f.stem.lower() == theme.lower():
            return _load_and_loop(f)
    candidates = list(ASSET_DIR.glob("*.mp4"))
    if candidates:
        print(f"[VideoGen] ⚠️  Fallback → {candidates[0].name}")
        return _load_and_loop(candidates[0])

    print("[VideoGen] ❌ No background — black screen")
    return ColorClip(size=(1920, 1080), color=(0, 0, 0)).set_duration(duration)


# ─────────────────────────────────────────────────────────────────────────────
# Captions — ALL CAPS, white, thin outline, centred, NO box
# ─────────────────────────────────────────────────────────────────────────────

def _captions(timings: list, video_size: tuple) -> list:
    clips = []
    video_w, video_h = video_size

    scale     = video_w / BASE_WIDTH
    fontsize  = max(int(CAPTION_FONTSIZE * scale), 20)
    stroke_w  = max(int(CAPTION_STROKE_W * scale), 1)
    margin    = max(int(140 * scale), 30)
    caption_y = int(video_h * CAPTION_Y_RATIO)

    print(f"[VideoGen] Captions — font={fontsize}px | stroke={stroke_w}px | y={caption_y}px")

    ok = 0
    for t in timings:
        dur = t["end"] - t["start"]
        if dur <= 0:
            continue

        for font in ("Impact", "Arial-Bold"):
            try:
                txt = TextClip(
                    txt=t["text"].upper(),
                    fontsize=fontsize,
                    color=CAPTION_COLOR,
                    stroke_color=CAPTION_STROKE,
                    stroke_width=stroke_w,
                    font=font,
                    method="caption",
                    size=(video_w - margin, None),
                    align="center",
                )
                clips.append(
                    txt
                    .set_start(t["start"])
                    .set_duration(dur)
                    .set_position(("center", caption_y - txt.h // 2))
                )
                ok += 1
                break
            except Exception as e:
                if font == "Arial-Bold":
                    print(f"[VideoGen] Caption failed '{t['text']}': {e}")

    print(f"[VideoGen] Built {ok}/{len(timings)} caption cards")
    return clips


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def generate_video(
    summary_text: str,
    output_filename: str = "output.mp4",
    theme: str = "subway",
) -> str:
    _setup()
    print(f"[VideoGen] 🎬 Starting (theme={theme})")

    import uuid, time
    uid      = str(uuid.uuid4())[:8]
    temp_mp3 = str(TEMP_DIR / f"narration_{uid}.mp3")
    temp_m4a = str(TEMP_DIR / f"temp_audio_{uid}.m4a")

    audio, bg, final, cap_clips = None, None, None, []

    try:
        # 1. Generate audio
        audio_duration = _tts(summary_text, temp_mp3, theme=theme)
        print(f"[VideoGen] Audio: {audio_duration:.3f}s")

        # 2. Get EXACT word timestamps via Whisper
        word_times = _transcribe_words(temp_mp3)

        # 3. Build caption cards
        if word_times:
            timings = _build_timings_from_words(word_times, WORDS_PER_CARD)
            print(f"[VideoGen] ✅ Whisper sync: {len(timings)} cards "
                  f"| first='{timings[0]['text']}' @ {timings[0]['start']:.3f}s")
        else:
            print("[VideoGen] ⚠️  Whisper unavailable — proportional fallback")
            timings = _build_timings_fallback(summary_text, audio_duration, WORDS_PER_CARD)

        for t in timings:
            t["start"] = max(t["start"], 0.0)
            t["end"]   = min(t["end"],   audio_duration - 0.03)

        # 4. Background
        bg = _background(theme, audio_duration)
        video_size = bg.size
        if video_size[0] > 1920 or video_size[1] > 1080:
            bg = bg.resize(height=1080)
            video_size = bg.size
        print(f"[VideoGen] Video size: {video_size}")

        # 5. Captions
        cap_clips = _captions(timings, video_size)

        # 6. Composite
        final = CompositeVideoClip([bg] + cap_clips, size=video_size).set_duration(audio_duration)
        try:
            audio = AudioFileClip(temp_mp3).subclip(0, audio_duration)
            final = final.set_audio(audio)
        except Exception as e:
            print(f"[VideoGen] Audio attach warning: {e}")

        # 7. Render
        out_path = str(OUTPUT_DIR / output_filename)
        print(f"[VideoGen] Rendering → {out_path}")
        final.write_videofile(
            out_path, fps=24, codec="libx264", audio_codec="aac",
            temp_audiofile=temp_m4a, remove_temp=True, verbose=False, logger=None,
        )
        print(f"[VideoGen] ✅ Done: {out_path}")

    finally:
        time.sleep(0.3)
        for clip in [audio, bg, final] + cap_clips:
            with contextlib.suppress(Exception):
                if clip is not None:
                    clip.close()
        with contextlib.suppress(Exception):
            if os.path.exists(temp_mp3):
                os.remove(temp_mp3)

    return os.path.abspath(out_path)


# ── Self-test ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    sample = (
        "Mitosis is when a cell splits into two identical copies. "
        "First the DNA duplicates itself. Then the cell divides. "
        "You end up with two cells that are basically twins. "
        "No cap mitosis is just cell cloning on repeat frfr."
    )
    path = generate_video(sample, "test_output.mp4", "subway")
    print(f"✅ Saved: {path}")