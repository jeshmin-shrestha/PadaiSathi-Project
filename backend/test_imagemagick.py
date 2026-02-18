# test_imagemagick.py
import os
from moviepy.editor import TextClip
from moviepy.config import get_setting

print("=" * 50)
print("ImageMagick Test")
print("=" * 50)

# Check what MoviePy thinks the path is
try:
    im_path = get_setting("IMAGEMAGICK_BINARY")
    print(f"MoviePy ImageMagick path: {im_path}")
    print(f"File exists: {os.path.exists(im_path)}")
except Exception as e:
    print(f"Error getting setting: {e}")

# Try to create a simple text clip
print("\n" + "-" * 30)
print("Attempting to create TextClip...")
print("-" * 30)

try:
    # Simple text clip
    txt_clip = TextClip("Hello World! ✨", 
                        fontsize=70, 
                        color='white',
                        stroke_color='black',
                        stroke_width=2,
                        font='Arial',
                        size=(800, 200))
    print("✅ TextClip created successfully!")
    print(f"Clip size: {txt_clip.size}")
    
    # Save a frame to verify
    txt_clip.save_frame("test_text_frame.png", t=0)
    print("✅ Saved test frame to test_text_frame.png")
    print("   Check this file in your backend directory!")
    
except Exception as e:
    print(f"❌ TextClip failed: {e}")
    
    # Try with explicit path
    print("\n" + "-" * 30)
    print("Trying with explicit ImageMagick path...")
    print("-" * 30)
    try:
        os.environ['IMAGEMAGICK_BINARY'] = r"C:\Program Files\ImageMagick-7.1.2-Q16-HDRI\magick.exe"
        txt_clip = TextClip("Hello World!", 
                            fontsize=70, 
                            color='white',
                            font='Arial')
        print("✅ TextClip created with explicit path!")
    except Exception as e2:
        print(f"❌ Still failed: {e2}")
        
        # Try to diagnose further
        print("\n" + "-" * 30)
        print("Diagnostic Information:")
        print("-" * 30)
        print(f"Current directory: {os.getcwd()}")
        print(f"Environment variable IMAGEMAGICK_BINARY: {os.environ.get('IMAGEMAGICK_BINARY', 'Not set')}")
        
        # Check if ImageMagick is in PATH
        import subprocess
        try:
            result = subprocess.run(['where', 'magick'], capture_output=True, text=True)
            if result.returncode == 0:
                print(f"ImageMagick in PATH: {result.stdout.strip()}")
            else:
                print("ImageMagick NOT found in PATH")
        except:
            print("Could not check PATH")

print("\n" + "=" * 50)
print("Test complete!")
print("=" * 50)