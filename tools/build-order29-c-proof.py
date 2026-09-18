"""주문서 29 C묶음과 구별 대상을 밝은/어두운 바탕에 1배·4배로 배치한다."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "art-source" / "icons"
CARDS = (
    ("aegis", ("traits/aegis", "traits/bulwark")),
    ("bloodRage", ("traits/bloodRage", "traits/ironWill")),
    ("venomcraft", ("traits/venomcraft", "items/venomSac")),
    ("disruptor", ("traits/disruptor", "skills/stagger")),
    ("foresight", ("traits/foresight", "traits/quickCast")),
    ("highLiturgy", ("traits/highLiturgy", "traits/extraPattern")),
    ("zeal", ("traits/zeal", "skills/smite")),
    ("deadeye", ("traits/deadeye", "traits/sniperEye")),
    ("thornward", ("traits/thornward", "skills/entangle", "traits/aegis")),
)
COLS = 3
BACKGROUNDS = (("LIGHT", "#f3f0ea", "#1d1d24"), ("DARK", "#1d1d24", "#f3f0ea"))


def build(scale: int) -> None:
    icon_size = 24 * scale
    gap = 6 if scale == 1 else 12
    card_w = max(220, 3 * (icon_size + gap) + 40)
    band_h = icon_size + 27
    group_h = 17 + band_h * 2
    rows = (len(CARDS) + COLS - 1) // COLS
    image = Image.new("RGB", (card_w * COLS, 20 + group_h * rows), "#d8d2c8")
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()
    draw.text((6, 5), f"ORDER 29 C | {scale}x NEAREST | NEW FIRST, THEN DISTINCTION REFERENCES", fill="#1d1d24", font=font)

    for index, (new_id, paths) in enumerate(CARDS):
        col, row = index % COLS, index // COLS
        left, top = col * card_w, 20 + row * group_h
        draw.text((left + 5, top + 3), new_id, fill="#1d1d24", font=font)
        for band, (band_name, bg, fg) in enumerate(BACKGROUNDS):
            band_top = top + 17 + band * band_h
            draw.rectangle((left, band_top, left + card_w - 1, band_top + band_h - 1), fill=bg)
            draw.text((left + 3, band_top + 2), band_name, fill=fg, font=font)
            x = left + 36
            for pos, rel in enumerate(paths):
                icon = Image.open(ROOT / "assets" / f"{rel}.png").convert("RGBA")
                if scale != 1:
                    icon = icon.resize((icon_size, icon_size), Image.Resampling.NEAREST)
                image.paste(icon, (x, band_top + 12), icon)
                draw.text((x, band_top + 13 + icon_size), "NEW" if pos == 0 else rel.split("/")[-1], fill=fg, font=font)
                x += icon_size + gap

    image.save(OUT / f"order29-C-proof-{scale}x.png", optimize=True)


if __name__ == "__main__":
    build(1)
    build(4)
