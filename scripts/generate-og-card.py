from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
img = Image.new("RGB", (W, H), "#071019")
draw = ImageDraw.Draw(img)
for x in range(0, W, 40):
    draw.line((x, 0, x, H), fill="#10232f", width=1)
for y in range(0, H, 40):
    draw.line((0, y, W, y), fill="#10232f", width=1)

regular = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
bold = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
font = lambda size, weight=regular: ImageFont.truetype(weight, size)

for x, top, height in ((72, 90, 22), (92, 78, 34), (112, 68, 44)):
    draw.rectangle((x, top, x + 12, top + height), fill="#18d6e5")
draw.text((148, 72), "RD", fill="#e9f2f7", font=font(29, bold))
draw.text((205, 72), "DEBT CLOCK", fill="#18d6e5", font=font(29, bold))
draw.text((72, 180), "DEUDA PÚBLICA SPNF · REPÚBLICA DOMINICANA", fill="#91a4af", font=font(23, bold))
draw.text((72, 250), "US$67,649.7 millones", fill="#ff5b62", font=font(74, bold))
draw.text((72, 360), "46.6% del PIB nominal estimado", fill="#e9f2f7", font=font(30))
draw.line((72, 445, 1128, 445), fill="#1c303d", width=2)
draw.text((72, 485), "Corte oficial: 31 de agosto de 2026", fill="#91a4af", font=font(24))
draw.text((72, 535), "DATOS OFICIALES · FUENTES VERIFICABLES · SIN FALSA PRECISIÓN", fill="#42d392", font=font(20, bold))
domain = "rddebtclock.com"
box = draw.textbbox((0, 0), domain, font=font(24, bold))
draw.text((1128 - (box[2] - box[0]), 580), domain, fill="#18d6e5", font=font(24, bold))
img.save("og-card.png", optimize=True)
