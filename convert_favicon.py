from PIL import Image

input_path  = r"padaisathi-frontend\public\logo_main.png"
output_path = r"frontend\public\favicon.ico"

img = Image.open(input_path).convert("RGBA")

# Build each size explicitly to preserve alpha transparency
sizes = [16, 32, 48, 64]
icons = []
for size in sizes:
    resized = img.resize((size, size), Image.LANCZOS)
    icons.append(resized)

# Save using the largest as base — Pillow appends all sizes
icons[0].save(
    output_path,
    format="ICO",
    sizes=[(s, s) for s in sizes],
    append_images=icons[1:]
)

print(f"✅ favicon.ico created with transparency at {output_path}")
