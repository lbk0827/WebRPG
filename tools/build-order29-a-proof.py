"""주문서 29 A묶음 아이콘을 기존 구별 대상과 1배/4배로 나란히 배치한다."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "art-source" / "icons"
IDS = ("woodenClub", "egoSword", "egoBlade", "braveSword", "darkBlade", "swordLong", "daggerCurved")
LABELS = ("NEW woodenClub", "NEW egoSword", "NEW egoBlade", "NEW braveSword", "NEW darkBlade", "REF swordLong", "REF daggerCurved")
BACKGROUNDS = (("LIGHT", "#f3f0ea", "#1d1d24"), ("DARK", "#1d1d24", "#f3f0ea"))


def build(scale: int) -> None:
    icon_size = 24 * scale
    cell_w = max(icon_size + 12, 112)
    label_h = 15
    header_h = 22
    row_h = icon_size + label_h + 14
    image = Image.new("RGB", (18 + cell_w * len(IDS), header_h + row_h * 2 + 8), "#d8d2c8")
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()
    draw.text((8, 6), f"ORDER 29 A | {scale}x | NEW LINEAGE + DISTINCTION REFERENCES", fill="#1d1d24", font=font)

    for row, (row_name, bg, fg) in enumerate(BACKGROUNDS):
        top = header_h + row * row_h
        draw.rectangle((0, top, image.width - 1, top + row_h - 1), fill=bg)
        draw.text((5, top + 4), row_name, fill=fg, font=font)
        for col, (icon_id, label) in enumerate(zip(IDS, LABELS)):
            left = 18 + col * cell_w
            icon = Image.open(ROOT / "assets" / "items" / f"{icon_id}.png").convert("RGBA")
            if scale != 1:
                icon = icon.resize((icon_size, icon_size), Image.Resampling.NEAREST)
            x = left + (cell_w - icon_size) // 2
            y = top + label_h
            image.paste(icon, (x, y), icon)
            draw.text((left + 2, y + icon_size + 2), label, fill=fg, font=font)

    image.save(OUT / f"order29-A-proof-{scale}x.png", optimize=True)


if __name__ == "__main__":
    build(1)
    build(4)
