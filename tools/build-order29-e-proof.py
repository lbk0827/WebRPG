"""주문서 29 추가 8종을 기존 구별 대상과 1배/4배로 나란히 배치한다."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "art-source" / "icons"
SKILL_CARDS = (
    ("headKnock", ("skills/headKnock", "skills/heavyBlow", "skills/sweep", "skills/hush")),
    ("rally", ("skills/rally", "skills/heavyBlow", "skills/sweep", "skills/hush")),
    ("wedge", ("skills/wedge", "skills/heavyBlow", "skills/sweep", "skills/hush")),
    ("plunge", ("skills/plunge", "skills/heavyBlow", "skills/sweep", "skills/hush")),
    ("breakingEdge", ("skills/breakingEdge", "skills/heavyBlow", "skills/sweep", "skills/hush")),
    ("darkRelease", ("skills/darkRelease", "skills/heavyBlow", "skills/sweep", "skills/hush")),
)
LINEAGE = (
    "items/woodenClub",
    "items/egoSword",
    "items/egoBlade",
    "items/braveSword",
    "items/darkBlade",
    "items/excalibur",
    "items/apocalypse",
)
BACKGROUNDS = (("LIGHT", "#f3f0ea", "#1d1d24"), ("DARK", "#1d1d24", "#f3f0ea"))


def _paste_icon(canvas: Image.Image, rel: str, x: int, y: int, size: int) -> None:
    icon = Image.open(ROOT / "assets" / f"{rel}.png").convert("RGBA")
    if size != 24:
        icon = icon.resize((size, size), Image.Resampling.NEAREST)
    canvas.paste(icon, (x, y), icon)


def build(scale: int) -> None:
    icon_size = 24 * scale
    gap = 5 if scale == 1 else 10
    font = ImageFont.load_default()
    skill_step = max(icon_size + gap, 58)
    lineage_step = max(icon_size + gap, 86)
    card_w = max(260, 35 + 4 * skill_step)
    band_h = icon_size + 28
    skill_group_h = 17 + band_h * 2
    skill_rows = 2
    lineage_w = max(card_w * 3, 35 + len(LINEAGE) * lineage_step)
    lineage_group_h = 17 + band_h * 2
    width = max(card_w * 3, lineage_w)
    height = 22 + skill_group_h * skill_rows + lineage_group_h
    canvas = Image.new("RGB", (width, height), "#d8d2c8")
    draw = ImageDraw.Draw(canvas)
    draw.text((6, 6), f"ORDER 29 E | {scale}x NEAREST | NEW FIRST, THEN REFERENCES", fill="#1d1d24", font=font)

    for index, (new_id, paths) in enumerate(SKILL_CARDS):
        col, row = index % 3, index // 3
        left, top = col * card_w, 22 + row * skill_group_h
        draw.rectangle((left, top, left + card_w - 1, top + skill_group_h - 1), fill="#d8d2c8")
        draw.text((left + 5, top + 3), new_id, fill="#1d1d24", font=font)
        for band, (band_name, bg, fg) in enumerate(BACKGROUNDS):
            band_top = top + 17 + band * band_h
            draw.rectangle((left, band_top, left + card_w - 1, band_top + band_h - 1), fill=bg)
            draw.text((left + 3, band_top + 2), band_name, fill=fg, font=font)
            x = left + 35
            for pos, rel in enumerate(paths):
                _paste_icon(canvas, rel, x, band_top + 12, icon_size)
                label = "NEW" if pos == 0 else rel.split("/")[-1]
                draw.text((x, band_top + 13 + icon_size), label, fill=fg, font=font)
                x += skill_step

    top = 22 + skill_group_h * skill_rows
    draw.rectangle((0, top, width - 1, top + lineage_group_h - 1), fill="#d8d2c8")
    draw.text((5, top + 3), "LV50 LINEAGE | existing five + NEW excalibur/apocalypse", fill="#1d1d24", font=font)
    for band, (band_name, bg, fg) in enumerate(BACKGROUNDS):
        band_top = top + 17 + band * band_h
        draw.rectangle((0, band_top, width - 1, band_top + band_h - 1), fill=bg)
        draw.text((3, band_top + 2), band_name, fill=fg, font=font)
        x = 35
        for rel in LINEAGE:
            _paste_icon(canvas, rel, x, band_top + 12, icon_size)
            icon_id = rel.split("/")[-1]
            label = f"NEW {icon_id}" if icon_id in {"excalibur", "apocalypse"} else icon_id
            draw.text((x, band_top + 13 + icon_size), label, fill=fg, font=font)
            x += lineage_step

    canvas.save(OUT / f"order29-E-proof-{scale}x.png", optimize=True)


if __name__ == "__main__":
    build(1)
    build(4)
