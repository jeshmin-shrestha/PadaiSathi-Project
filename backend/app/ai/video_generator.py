"""
PadaiSathi AI — Video Generator
Place at:  backend/app/ai/video_generator.py
"""

import os
import re
import math
import asyncio
import textwrap
from pathlib import Path

# Set ImageMagick path
os.environ['IMAGEMAGICK_BINARY'] = r"C:\Program Files\ImageMagick-7.1.2-Q16-HDRI\magick.exe"

# Import moviepy
from moviepy.editor import *

# Monkey patch for PIL
import PIL.Image
if not hasattr(PIL.Image, 'ANTIALIAS'):
    PIL.Image.ANTIALIAS = PIL.Image.Resampling.LANCZOS

OUTPUT_DIR = Path("generated_videos")
ASSET_DIR = Path("../frontend/src/assets/backgrounds")
TEMP_DIR = Path("temp_video")

# Base caption style — designed for 1920x1080
# Everything below scales automatically to match any video size
BASE_WIDTH         = 1920
CAPTION_FONTSIZE   = 90    # At 1920px wide
CAPTION_STROKE_W   = 6     # At 1920px wide
CAPTION_COLOR      = "white"
CAPTION_STROKE     = "black"
CAPTION_MAX_CHARS  = 35
WORDS_PER_SECOND   = 2.3

VIDEO_W = None
VIDEO_H = None

# ── Edge TTS Voice assignments per theme ──────────────────────────────────────
# 100% free, no API key, no limits!
# Preview all voices at: https://tts.travisvn.com
THEME_VOICES = {
    "subway":    "en-US-GuyNeural",         # 🛹 Energetic, hype
    "minecraft": "en-US-ChristopherNeural", # 🌲 Deep, chill, calm
    "slime":     "en-US-AnaNeural",         # 🫧 Fun, bubbly, playful
}

DEFAULT_VOICE = "en-US-GuyNeural"


def _setup():
    for d in [OUTPUT_DIR, TEMP_DIR, ASSET_DIR]:
        d.mkdir(parents=True, exist_ok=True)


def _chunk(text: str) -> list[str]:
    """Split summary into short caption lines."""
    clean = re.sub(r'^[^\w\s]+\s*', '', text, flags=re.MULTILINE)
    clean = ' '.join(clean.split())
    sentences = re.split(r'(?<=[.!?])\s+', clean)
    chunks = []
    for s in sentences:
        if len(s) <= CAPTION_MAX_CHARS:
            chunks.append(s.strip())
        else:
            chunks.extend(textwrap.wrap(s, width=CAPTION_MAX_CHARS))
    return [c for c in chunks if c.strip()]


def _timings(chunks: list[str], wps: float = WORDS_PER_SECOND) -> list[dict]:
    """Assign start/end timestamps."""
    result, t = [], 0.5
    for chunk in chunks:
        dur = max(len(chunk.split()) / wps, 1.2)
        result.append({"text": chunk, "start": t, "end": t + dur})
        t += dur + 0.1
    return result


# ── Edge TTS async helper ─────────────────────────────────────────────────────
async def _tts_edge_async(text: str, out_path: str, voice: str):
    """Async Edge TTS call."""
    import edge_tts
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(out_path)


def _tts(text: str, out_path: str, theme: str = "subway") -> float:
    """
    Convert text to MP3 via Edge TTS — different voice per theme.
    100% free, no API key needed!
    Falls back to gTTS if edge-tts is not installed.
    Install: pip install edge-tts
    """
    clean = re.sub(r'[^\x00-\x7F]+', '', text)
    clean = re.sub(r'\s+', ' ', clean).strip()
    if len(clean) > 1000:
        clean = clean[:1000]
        print(f"[VideoGen] Truncated text to 1000 characters")

    voice = THEME_VOICES.get(theme, DEFAULT_VOICE)
    print(f"[TTS] 🎙️  Edge TTS | theme='{theme}' → voice='{voice}'")

    try:
        from pydub import AudioSegment

        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    future = pool.submit(asyncio.run, _tts_edge_async(clean, out_path, voice))
                    future.result()
            else:
                loop.run_until_complete(_tts_edge_async(clean, out_path, voice))
        except RuntimeError:
            asyncio.run(_tts_edge_async(clean, out_path, voice))

        duration = len(AudioSegment.from_mp3(out_path)) / 1000.0
        print(f"[TTS] ✅ Done! ({duration:.2f}s) — {voice}")
        return duration

    except ImportError:
        print("[TTS] ⚠️  edge-tts not installed — run: pip install edge-tts")
        print("[TTS] Falling back to gTTS...")
        return _tts_gtts(clean, out_path)
    except Exception as e:
        print(f"[TTS] ❌ Edge TTS error: {e} — falling back to gTTS")
        return _tts_gtts(clean, out_path)


def _tts_gtts(text: str, out_path: str) -> float:
    """Fallback: original gTTS Google voice."""
    from gtts import gTTS
    from pydub import AudioSegment

    clean = re.sub(r'[^\x00-\x7F]+', '', text)
    clean = re.sub(r'\s+', ' ', clean).strip()
    if len(clean) > 1000:
        clean = clean[:1000]

    gTTS(text=clean, lang='en', slow=False).save(out_path)
    duration = len(AudioSegment.from_mp3(out_path)) / 1000.0
    return duration


def _background(theme: str, duration: float):
    """Get background video by theme name."""
    print(f"[VideoGen] ASSET_DIR = {ASSET_DIR.resolve()}")
    print(f"[VideoGen] Files in ASSET_DIR: {list(ASSET_DIR.glob('*'))}")
    print(f"[VideoGen] Looking for theme: '{theme}.mp4'")

    # 1. Try exact theme match first
    theme_path = ASSET_DIR / f"{theme}.mp4"
    if theme_path.exists():
        print(f"[VideoGen] ✅ Found: {theme_path}")
        bg = VideoFileClip(str(theme_path))
        return bg.subclip(0, min(duration, bg.duration))

    # 2. Try case-insensitive match
    for f in ASSET_DIR.glob("*.mp4"):
        if f.stem.lower() == theme.lower():
            print(f"[VideoGen] ✅ Found (case-insensitive): {f}")
            bg = VideoFileClip(str(f))
            return bg.subclip(0, min(duration, bg.duration))

    # 3. Fallback to any mp4
    candidates = list(ASSET_DIR.glob("*.mp4"))
    if candidates:
        print(f"[VideoGen] ⚠️ Theme '{theme}.mp4' not found, falling back to: {candidates[0]}")
        bg = VideoFileClip(str(candidates[0]))
        return bg.subclip(0, min(duration, bg.duration))

    # 4. Black screen last resort
    print("[VideoGen] ❌ No background found, using black screen")
    return ColorClip(size=(1920, 1080), color=(0, 0, 0)).set_duration(duration)


def _captions(timings: list[dict], video_size: tuple) -> list:
    """
    Create text caption clips centered in the middle with background.
    Font size, stroke, and padding all scale automatically to video dimensions.
    e.g. 640px wide video → font ~30px | 1920px wide → font 90px
    """
    clips = []
    successful = 0

    video_w, video_h = video_size

    # ── Auto-scale everything based on video width ────────────────────────────
    scale         = video_w / BASE_WIDTH          # e.g. 640/1920 = 0.33
    fontsize      = max(int(CAPTION_FONTSIZE * scale), 16)   # min 16px
    stroke_w      = max(int(CAPTION_STROKE_W * scale), 1)    # min 1px
    pad_x         = max(int(60 * scale), 10)
    pad_y         = max(int(40 * scale), 8)
    margin        = max(int(100 * scale), 20)

    print(f"[VideoGen] Caption scale={scale:.2f} | font={fontsize}px | stroke={stroke_w}px")

    for t in timings:
        dur = t["end"] - t["start"]
        try:
            txt_clip = TextClip(
                txt=t["text"],
                fontsize=fontsize,
                color=CAPTION_COLOR,
                stroke_color=CAPTION_STROKE,
                stroke_width=stroke_w,
                font='Arial-Bold',
                method='caption',
                size=(video_w - margin, None),
                align='center'
            )

            # Semi-transparent background box
            bg_width  = txt_clip.w + pad_x
            bg_height = txt_clip.h + pad_y

            bg_clip = ColorClip(size=(bg_width, bg_height), color=(0, 0, 0))
            bg_clip = bg_clip.set_opacity(0.6)
            bg_clip = bg_clip.set_start(t["start"]).set_duration(dur)
            bg_clip = bg_clip.set_position(('center', 'center'))

            txt_clip = txt_clip.set_start(t["start"]).set_duration(dur)
            txt_clip = txt_clip.set_position(('center', 'center'))

            clips.append(bg_clip)
            clips.append(txt_clip)
            successful += 1

        except Exception as e:
            print(f"[VideoGen] Caption error: {e}")
            continue

    print(f"[VideoGen] Created {successful}/{len(timings)} captions with backgrounds")
    return clips


def generate_video(summary_text: str, output_filename: str = "output.mp4", theme: str = "subway") -> str:
    """
    Generate video with background (original size), auto-scaled captions,
    and Edge TTS voice matched to the theme. 100% free!
    """
    _setup()
    print(f"[VideoGen] 🎬 Starting (theme={theme})")
    print(f"[VideoGen] 🎙️  Voice: {THEME_VOICES.get(theme, DEFAULT_VOICE)}")

    import uuid
    unique_id = str(uuid.uuid4())[:8]
    temp_audio = TEMP_DIR / f"narration_{unique_id}.mp3"
    temp_audio_path = str(temp_audio)

    try:
        # Generate audio with theme-matched voice
        audio_duration = _tts(summary_text, temp_audio_path, theme=theme)
        print(f"[VideoGen] Audio duration: {audio_duration:.2f}s")

        # Prepare captions
        chunks = _chunk(summary_text)
        timings = _timings(chunks)

        # Adjust timings to match audio duration (with safety margin)
        if timings:
            last_end = timings[-1]["end"]
            if last_end > 0:
                safe_duration = audio_duration * 0.98
                scale = safe_duration / last_end
                for t in timings:
                    t["start"] *= scale
                    t["end"] *= scale

        # Create video (slightly shorter than audio to prevent overflow)
        video_duration = audio_duration * 0.99

        background = _background(theme, video_duration)

        # Get video dimensions
        video_size = background.size
        print(f"[VideoGen] Original video dimensions: {video_size}")

        # Resize 4K to 1080p to save memory
        if video_size[0] > 1920 or video_size[1] > 1080:
            print(f"[VideoGen] Resizing large video from {video_size} to 1920x1080")
            background = background.resize(height=1080)
            video_size = background.size
            print(f"[VideoGen] New video dimensions: {video_size}")

        # Create captions — auto-scaled to video size
        caption_clips = _captions(timings, video_size)

        # Combine all elements
        all_clips = [background] + caption_clips
        final = CompositeVideoClip(all_clips, size=video_size)

        # Add audio
        try:
            audio = AudioFileClip(temp_audio_path)
            audio = audio.subclip(0, min(audio_duration, video_duration))
            final = final.set_audio(audio)
        except Exception as e:
            print(f"[VideoGen] Audio error: {e}")

        final = final.set_duration(video_duration)

        # Render
        out_path = str(OUTPUT_DIR / output_filename)
        print(f"[VideoGen] Rendering to: {out_path}")

        final.write_videofile(
            out_path,
            fps=24,
            codec='libx264',
            audio_codec='aac',
            temp_audiofile=str(TEMP_DIR / f"temp_audio_{unique_id}.m4a"),
            remove_temp=True,
            verbose=False,
            logger=None
        )

        print(f"[VideoGen] ✅ Done: {out_path}")

        # Cleanup
        try:
            if 'audio' in locals():
                audio.close()
            if 'background' in locals():
                background.close()
            for clip in caption_clips:
                clip.close()
            final.close()

            import time
            time.sleep(0.5)

            if os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)
                print(f"[VideoGen] Cleaned up temp audio: {temp_audio_path}")
        except Exception as cleanup_error:
            print(f"[VideoGen] Cleanup warning: {cleanup_error}")

        return os.path.abspath(out_path)

    except Exception as e:
        print(f"[VideoGen] ❌ Error: {e}")
        import traceback
        traceback.print_exc()

        try:
            if os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)
        except:
            pass
        raise


# Self-test
if __name__ == "__main__":
    sample = "Testing video generation with auto-scaled captions and Edge TTS voices!"
    try:
        path = generate_video(sample, "test_output.mp4", "slime")
        print(f"✅ Video saved: {path}")
    except Exception as e:
        print(f"❌ Test failed: {e}")