"""Generate a custom shield-lock Windows icon at build time, no runtime asset needed."""
from pathlib import Path
from PIL import Image, ImageDraw

S = 512
im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(im)
d.rounded_rectangle((15, 15, 497, 497), radius=115, fill=(27, 19, 66, 255), outline=(139, 105, 255, 255), width=15)
# Three-layer shield: precise vector-like at high resolution.
shield = [(256, 65), (412, 124), (402, 310), (355, 383), (256, 448),
          (157, 383), (110, 310), (100, 124)]
d.polygon(shield, fill=(55, 36, 124, 255))
d.line(shield + [shield[0]], fill=(198, 174, 255, 255), width=21, joint="curve")
d.rounded_rectangle((178, 240, 334, 347), radius=21, fill=(235, 229, 255, 255))
d.arc((204, 151, 308, 292), start=180, end=360, fill=(235, 229, 255, 255), width=22)
d.line((204, 221, 204, 260), fill=(235, 229, 255, 255), width=22)
d.line((308, 221, 308, 260), fill=(235, 229, 255, 255), width=22)
d.ellipse((242, 280, 270, 308), fill=(52, 36, 114, 255))
d.rounded_rectangle((251, 300, 261, 326), radius=4, fill=(52, 36, 114, 255))
path = Path(__file__).resolve().parent / "app.ico"
im.save(path, format="ICO", sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])
print("Built", path)
