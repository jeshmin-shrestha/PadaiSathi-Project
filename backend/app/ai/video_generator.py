"""
PadaiSathi AI — Video Generator
Place at:  backend/app/ai/video_generator.py
"""

import os
import re
import math
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
ASSET_DIR = Path("assets/backgrounds")
TEMP_DIR = Path("temp_video")

# Caption style - INCREASED FONT SIZE
CAPTION_FONTSIZE = 90  # Even larger font
CAPTION_COLOR = "white"
CAPTION_STROKE = "black"
CAPTION_STROKE_W = 6  # Thicker stroke
CAPTION_MAX_CHARS = 35  # Slightly fewer chars per line for bigger text
WORDS_PER_SECOND = 2.3

# Keep original video dimensions (don't force vertical)
VIDEO_W = None  # Will be set from background video
VIDEO_H = None


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


def _tts(text: str, out_path: str) -> float:
    """Convert text to MP3 via gTTS."""
    from gtts import gTTS
    from pydub import AudioSegment

    clean = re.sub(r'[^\x00-\x7F]+', '', text)
    clean = re.sub(r'\s+', ' ', clean).strip()

    if len(clean) > 1000:
        clean = clean[:1000]
        print(f"[VideoGen] Truncated text to 1000 characters")

    gTTS(text=clean, lang='en', slow=False).save(out_path)
    
    duration = len(AudioSegment.from_mp3(out_path)) / 1000.0
    return duration


def _background(theme: str, duration: float):
    """Get background video - keep original dimensions."""
    possible_paths = [
        ASSET_DIR / f"{theme}.mp4",
        ASSET_DIR / "*.mp4",
        Path("../frontend/src/assets/backgrounds/videoplayback.mp4"),
    ]

    bg_video = None
    for path_pattern in possible_paths:
        try:
            if isinstance(path_pattern, Path) and path_pattern.exists():
                print(f"[VideoGen] Using background: {path_pattern}")
                bg_video = VideoFileClip(str(path_pattern))
                break
            else:
                candidates = list(ASSET_DIR.glob(str(path_pattern)))
                if candidates:
                    print(f"[VideoGen] Using background: {candidates[0]}")
                    bg_video = VideoFileClip(str(candidates[0]))
                    break
        except:
            continue

    if bg_video:
        # Don't resize - keep original dimensions
        # Just take first 'duration' seconds
        return bg_video.subclip(0, min(duration, bg_video.duration))
    
    # Fallback - create a black screen
    print("[VideoGen] No background found, using black screen")
    return ColorClip(size=(1920, 1080), color=(0, 0, 0)).set_duration(duration)


def _captions(timings: list[dict], video_size: tuple) -> list:
    """Create text caption clips centered in the middle with background."""
    clips = []
    successful = 0
    
    video_w, video_h = video_size
    
    for t in timings:
        dur = t["end"] - t["start"]
        try:
            # Create text clip with larger font
            txt_clip = TextClip(
                txt=t["text"],
                fontsize=CAPTION_FONTSIZE,
                color=CAPTION_COLOR,
                stroke_color=CAPTION_STROKE,
                stroke_width=CAPTION_STROKE_W,
                font='Arial-Bold',
                method='caption',
                size=(video_w - 100, None),  # Leave smaller margins
                align='center'
            )
            
            # Create a semi-transparent background for better readability
            # Make background slightly larger than text
            bg_width = txt_clip.w + 60
            bg_height = txt_clip.h + 40
            
            bg_clip = ColorClip(size=(bg_width, bg_height), color=(0, 0, 0))
            bg_clip = bg_clip.set_opacity(0.6)  # 60% opaque
            bg_clip = bg_clip.set_start(t["start"]).set_duration(dur)
            bg_clip = bg_clip.set_position(('center', 'center'))
            
            # Set timing for text
            txt_clip = txt_clip.set_start(t["start"]).set_duration(dur)
            
            # Position text in the center (on top of background)
            txt_clip = txt_clip.set_position(('center', 'center'))
            
            # Add both background and text
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
    Generate video with background (original size) and centered captions.
    """
    _setup()
    print(f"[VideoGen] 🎬 Starting (theme={theme})")

    # Create unique temp files to avoid conflicts
    import uuid
    unique_id = str(uuid.uuid4())[:8]
    temp_audio = TEMP_DIR / f"narration_{unique_id}.mp3"
    temp_audio_path = str(temp_audio)
    
    try:
        # Generate audio
        audio_duration = _tts(summary_text, temp_audio_path)
        print(f"[VideoGen] Audio duration: {audio_duration:.2f}s")

        # Prepare captions
        chunks = _chunk(summary_text)
        timings = _timings(chunks)
        
        # Adjust timings to match audio duration (with safety margin)
        if timings:
            last_end = timings[-1]["end"]
            if last_end > 0:
                # Use 98% of audio duration to leave a safety margin
                safe_duration = audio_duration * 0.98
                scale = safe_duration / last_end
                for t in timings:
                    t["start"] *= scale
                    t["end"] *= scale

        # Create video (slightly shorter than audio to prevent overflow)
        video_duration = audio_duration * 0.99  # 99% of audio duration
        
        background = _background(theme, video_duration)
        
        # Get video dimensions
        video_size = background.size
        print(f"[VideoGen] Original video dimensions: {video_size}")
        
        # RESIZE 4K VIDEO TO 1080p TO SAVE MEMORY
        if video_size[0] > 1920 or video_size[1] > 1080:
            print(f"[VideoGen] Resizing large video from {video_size} to 1920x1080 to save memory")
            background = background.resize(height=1080)
            video_size = background.size
            print(f"[VideoGen] New video dimensions: {video_size}")
        
        # Create captions (centered with background)
        caption_clips = _captions(timings, video_size)
        
        # Combine all elements
        all_clips = [background] + caption_clips
        final = CompositeVideoClip(all_clips, size=video_size)
        
        # Add audio (with safe subclip)
        try:
            audio = AudioFileClip(temp_audio_path)
            # Only use up to video_duration (with tiny safety margin)
            audio = audio.subclip(0, min(audio_duration, video_duration))
            final = final.set_audio(audio)
        except Exception as e:
            print(f"[VideoGen] Audio error: {e}")

        final = final.set_duration(video_duration)

        # Render
        out_path = str(OUTPUT_DIR / output_filename)
        print(f"[VideoGen] Rendering to: {out_path}")
        
        # Close any open clips before writing
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
        
        # Cleanup - close clips and remove temp files
        try:
            # Close clips to release file handles
            if 'audio' in locals():
                audio.close()
            if 'background' in locals():
                background.close()
            for clip in caption_clips:
                clip.close()
            final.close()
            
            # Give a moment for files to be released
            import time
            time.sleep(0.5)
            
            # Remove temp audio file
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
        
        # Clean up temp files even on error
        try:
            if os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)
        except:
            pass
        raise

# Self-test
if __name__ == "__main__":
    sample = "Testing video generation with larger captions and background."
    try:
        path = generate_video(sample, "test_output.mp4", "subway")
        print(f"✅ Video saved: {path}")
    except Exception as e:
        print(f"❌ Test failed: {e}")