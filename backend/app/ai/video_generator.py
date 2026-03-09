"""
PadaiSathi AI — Video Generator  (caption-sync fix v4)
Place at:  backend/app/ai/video_generator.py

Changes in v4
─────────────
- Stroke width reduced: 12 → 4 (was far too thick/dark)
- TTS sync fix: edge-tts WordBoundary offsets include a lead-in silence
  that MP3 encoding adds. We measure the actual first-word delay from the
  JSON and subtract it so captions land exactly on the spoken word.
- Added SYNC_OFFSET_S safety nudge (tweak this if still slightly off).
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
OUTPUT_DIR = Path("generated_videos")
ASSET_DIR  = Path("../frontend/src/assets/backgrounds")
TEMP_DIR   = Path("temp_video")

# ── Caption style ─────────────────────────────────────────────────────────────
BASE_WIDTH       = 1920
CAPTION_FONTSIZE = 110    # scales down automatically with video width
CAPTION_STROKE_W = 4      # thin clean outline — not a heavy border
CAPTION_COLOR    = "white"
CAPTION_STROKE   = "black"
WORDS_PER_CARD   = 4      # words per caption card
CAPTION_Y_RATIO  = 0.50   # 0=top · 1=bottom · 0.50=dead centre

# ── Sync tuning ───────────────────────────────────────────────────────────────
# edge-tts WordBoundary offsets start from 0 but the MP3 has a small
# encoder lead-in silence (~0.05-0.15s). If captions still feel early or
# late after the auto-correction below, nudge this value:
#   positive → captions appear later  (if text shows before speech)
#   negative → captions appear earlier (if text shows after speech)
SYNC_OFFSET_S = 0.0   # start here; try 0.1 or -0.1 if needed

# ── Voice map ─────────────────────────────────────────────────────────────────
THEME_VOICES = {
    "subway":    "en-US-GuyNeural",
    "minecraft": "en-US-ChristopherNeural",
    "slime":     "en-US-AnaNeural",
}
DEFAULT_VOICE = "en-US-GuyNeural"


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _setup():
    for d in [OUTPUT_DIR, TEMP_DIR, ASSET_DIR]:
        d.mkdir(parents=True, exist_ok=True)


def _clean_text(text: str) -> str:
    text = re.sub(r'^[^\w\s]+\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


# ─────────────────────────────────────────────────────────────────────────────
# TTS
# ─────────────────────────────────────────────────────────────────────────────

async def _tts_edge_async(text: str, mp3_path: str, json_path: str, voice: str):
    """
    Stream edge-tts. Saves:
      • audio        → mp3_path
      • word timings → json_path  [{word, start, end}] in seconds

    edge-tts WordBoundary offsets are in 100-nanosecond ticks.
    Dividing by 10_000_000 gives seconds from the START OF THE TTS STREAM,
    which includes a small encoder silence before the first word.
    We save raw ticks here and do the correction in _apply_sync_correction().
    """
    import edge_tts
    communicate = edge_tts.Communicate(text, voice)
    word_times  = []

    with open(mp3_path, "wb") as audio_file:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_file.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start_s = chunk["offset"]   / 10_000_000
                dur_s   = chunk["duration"] / 10_000_000
                word_times.append({
                    "word":  chunk["text"],
                    "start": round(start_s, 4),
                    "end":   round(start_s + dur_s, 4),
                })

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(word_times, f)

    if word_times:
        print(f"[TTS] {len(word_times)} words | "
              f"first='{word_times[0]['word']}' @ {word_times[0]['start']:.3f}s | "
              f"last='{word_times[-1]['word']}' ends @ {word_times[-1]['end']:.3f}s")


def _apply_sync_correction(word_times: list, audio_duration: float) -> list:
    """
    edge-tts timestamps start from 0 but the first spoken word is never
    exactly at 0 — there's always a small lead-in silence baked into the
    stream. This function:

    1. Detects that lead-in from the first word's start time.
    2. Subtracts it so word[0].start → ~0, preserving all relative gaps.
    3. Applies SYNC_OFFSET_S for any remaining manual fine-tuning.
    4. Scales the whole sequence proportionally so the last word ends
       exactly at audio_duration (handles any drift across long clips).

    Returns a corrected copy of word_times.
    """
    if not word_times:
        return word_times

    # Step 1 — remove encoder lead-in silence
    lead_in = word_times[0]["start"]
    corrected = [
        {
            "word":  w["word"],
            "start": round(w["start"] - lead_in + SYNC_OFFSET_S, 4),
            "end":   round(w["end"]   - lead_in + SYNC_OFFSET_S, 4),
        }
        for w in word_times
    ]

    # Step 2 — proportional scale so last word aligns with audio end
    last_end = corrected[-1]["end"]
    if last_end > 0 and abs(last_end - audio_duration) > 0.2:
        scale = (audio_duration - SYNC_OFFSET_S) / last_end
        corrected = [
            {
                "word":  w["word"],
                "start": round(w["start"] * scale, 4),
                "end":   round(w["end"]   * scale, 4),
            }
            for w in corrected
        ]
        print(f"[Sync] Scaled timings by {scale:.4f} "
              f"(last word was {last_end:.3f}s, audio={audio_duration:.3f}s)")

    print(f"[Sync] After correction: "
          f"first word @ {corrected[0]['start']:.3f}s, "
          f"last ends @ {corrected[-1]['end']:.3f}s")
    return corrected


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


def _tts(text: str, mp3_path: str, json_path: str, theme: str = "subway") -> float:
    clean = _clean_text(text)
    if len(clean) > 1500:
        clean = clean[:1500]
        print("[TTS] Truncated to 1500 chars")

    voice = THEME_VOICES.get(theme, DEFAULT_VOICE)
    print(f"[TTS] 🎙️  {voice}")

    try:
        from pydub import AudioSegment
        _run_async(_tts_edge_async(clean, mp3_path, json_path, voice))
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
# Caption timing builders
# ─────────────────────────────────────────────────────────────────────────────

def _build_timings_from_words(word_times: list, words_per_card: int = WORDS_PER_CARD) -> list:
    cards = []
    for i in range(0, len(word_times), words_per_card):
        group = word_times[i : i + words_per_card]
        # End = start of NEXT group's first word (no gap, no overlap)
        # For the last group, use the last word's own end time
        if i + words_per_card < len(word_times):
            card_end = word_times[i + words_per_card]["start"] - 0.02
        else:
            card_end = group[-1]["end"]
        cards.append({
            "text":  " ".join(w["word"] for w in group),
            "start": group[0]["start"],
            "end":   card_end,
        })
    return cards


def _build_timings_fallback(text: str, audio_duration: float, words_per_card: int = WORDS_PER_CARD) -> list:
    """Proportional fallback when no word timestamps available (gTTS path)."""
    words = _clean_text(text).split()
    n = len(words)
    if n == 0:
        return []

    secs_per_word = audio_duration / n
    cards, offset = [], 0.1

    for i in range(0, n, words_per_card):
        group = words[i : i + words_per_card]
        dur = len(group) * secs_per_word
        cards.append({"text": " ".join(group), "start": offset, "end": offset + dur})
        offset += dur

    return cards


# ─────────────────────────────────────────────────────────────────────────────
# Background loader
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
# Caption renderer
# ─────────────────────────────────────────────────────────────────────────────

def _captions(timings: list, video_size: tuple) -> list:
    """
    ALL-CAPS white text, thin clean black outline, no background box.
    Vertically centred in the frame.
    """
    clips = []
    video_w, video_h = video_size

    scale     = video_w / BASE_WIDTH
    fontsize  = max(int(CAPTION_FONTSIZE * scale), 20)
    stroke_w  = max(int(CAPTION_STROKE_W * scale), 1)   # stays thin at any size
    margin    = max(int(140 * scale), 30)
    caption_y = int(video_h * CAPTION_Y_RATIO)

    print(f"[VideoGen] Captions — font={fontsize}px | stroke={stroke_w}px | y={caption_y}px")

    ok = 0
    for t in timings:
        dur = t["end"] - t["start"]
        if dur <= 0:
            continue
        try:
            txt = TextClip(
                txt=t["text"].upper(),
                fontsize=fontsize,
                color=CAPTION_COLOR,
                stroke_color=CAPTION_STROKE,
                stroke_width=stroke_w,
                font="Impact",          # Impact = classic meme font; falls back to Arial-Bold
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

        except Exception:
            # Impact not available — retry with Arial-Bold
            try:
                txt = TextClip(
                    txt=t["text"].upper(),
                    fontsize=fontsize,
                    color=CAPTION_COLOR,
                    stroke_color=CAPTION_STROKE,
                    stroke_width=stroke_w,
                    font="Arial-Bold",
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
            except Exception as e2:
                print(f"[VideoGen] Caption error '{t['text']}': {e2}")

    print(f"[VideoGen] Built {ok}/{len(timings)} caption cards")
    return clips


# ─────────────────────────────────────────────────────────────────────────────
# Main entry point
# ─────────────────────────────────────────────────────────────────────────────

def generate_video(
    summary_text: str,
    output_filename: str = "output.mp4",
    theme: str = "subway",
) -> str:
    _setup()
    print(f"[VideoGen] 🎬 Starting (theme={theme})")

    import uuid, time
    uid       = str(uuid.uuid4())[:8]
    temp_mp3  = str(TEMP_DIR / f"narration_{uid}.mp3")
    temp_json = str(TEMP_DIR / f"words_{uid}.json")
    temp_m4a  = str(TEMP_DIR / f"temp_audio_{uid}.m4a")

    audio, bg, final, cap_clips = None, None, None, []

    try:
        # 1. TTS ──────────────────────────────────────────────────────────────
        audio_duration = _tts(summary_text, temp_mp3, temp_json, theme=theme)
        print(f"[VideoGen] Audio duration: {audio_duration:.3f}s")

        # 2. Caption timings ──────────────────────────────────────────────────
        word_times = []
        if os.path.exists(temp_json):
            with open(temp_json, encoding="utf-8") as f:
                word_times = json.load(f)

        if word_times:
            # Apply sync correction before grouping into cards
            word_times = _apply_sync_correction(word_times, audio_duration)
            timings = _build_timings_from_words(word_times, WORDS_PER_CARD)
            print(f"[VideoGen] ✅ {len(word_times)} word timestamps → {len(timings)} cards")
        else:
            print("[VideoGen] ⚠️  No timestamps — proportional fallback")
            timings = _build_timings_fallback(summary_text, audio_duration, WORDS_PER_CARD)

        # Clamp to audio bounds
        for t in timings:
            t["start"] = max(t["start"], 0.0)
            t["end"]   = min(t["end"],   audio_duration - 0.03)

        # 3. Background ───────────────────────────────────────────────────────
        bg = _background(theme, audio_duration)
        video_size = bg.size
        if video_size[0] > 1920 or video_size[1] > 1080:
            bg = bg.resize(height=1080)
            video_size = bg.size
        print(f"[VideoGen] Video size: {video_size}")

        # 4. Captions ─────────────────────────────────────────────────────────
        cap_clips = _captions(timings, video_size)

        # 5. Composite + audio ────────────────────────────────────────────────
        final = CompositeVideoClip([bg] + cap_clips, size=video_size).set_duration(audio_duration)

        try:
            audio = AudioFileClip(temp_mp3).subclip(0, audio_duration)
            final = final.set_audio(audio)
        except Exception as e:
            print(f"[VideoGen] Audio attach warning: {e}")

        # 6. Render ───────────────────────────────────────────────────────────
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
        for p in [temp_mp3, temp_json]:
            with contextlib.suppress(Exception):
                if os.path.exists(p):
                    os.remove(p)

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