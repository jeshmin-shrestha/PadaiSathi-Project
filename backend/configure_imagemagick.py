# configure_imagemagick.py
import os
from pathlib import Path

# Your actual ImageMagick path (based on your directory listing)
imagemagick_path = r"C:\Program Files\ImageMagick-7.1.2-Q16-HDRI\magick.exe"

print("=" * 50)
print("ImageMagick Configuration")
print("=" * 50)

# Verify the file exists
if os.path.exists(imagemagick_path):
    print(f"✅ Found ImageMagick at: {imagemagick_path}")
else:
    print(f"❌ File not found at: {imagemagick_path}")
    # Try without .exe
    alt_path = r"C:\Program Files\ImageMagick-7.1.2-Q16-HDRI\magick"
    if os.path.exists(alt_path):
        imagemagick_path = alt_path
        print(f"✅ Found at alternative path: {imagemagick_path}")
    else:
        print("❌ Please check the installation path")
        exit(1)

# Create .moviepy folder in user's home directory
config_dir = Path.home() / ".moviepy"
config_dir.mkdir(exist_ok=True)
print(f"✅ Config directory: {config_dir}")

# Create config.py file
config_file = config_dir / "config.py"
with open(config_file, "w") as f:
    f.write(f'IMAGEMAGICK_BINARY = r"{imagemagick_path}"\n')

print(f"✅ Created config at: {config_file}")

# Also set environment variable for current session
os.environ['IMAGEMAGICK_BINARY'] = imagemagick_path
print("✅ Set IMAGEMAGICK_BINARY environment variable")

# Display the config file content
print("\n📄 Config file content:")
with open(config_file, "r") as f:
    print(f.read())

# Test if MoviePy can find it
try:
    from moviepy.config import get_setting
    im_path = get_setting("IMAGEMAGICK_BINARY")
    print(f"\n✅ MoviePy can find ImageMagick at: {im_path}")
except Exception as e:
    print(f"\n❌ MoviePy config error: {e}")

print("\n" + "=" * 50)
print("Configuration complete! Now run test_imagemagick.py")
print("=" * 50)