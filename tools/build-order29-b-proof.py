"""주문서 29 B묶음과 각 구별 대상을 밝은/어두운 바탕에 1배·4배로 배치한다."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "art-source" / "icons"
CARDS = (
    ("bulwark", ("skills/bulwark", "traits/bulwark", "skills/ward", "items/charmGuard")),
    ("taunt", ("skills/taunt", "skills/shieldBash")),
    ("recklessSwing", ("skills/recklessSwing", "skills/heavyBlow")),
    ("bloodlust", ("skills/bloodlust", "skills/venom")),
    ("toxicBlade", ("skills/toxicBlade", "skills/venom", "skills/venomStrong")),
    ("markPrey", ("skills/markPrey", "skills/snipe")),
    ("disrupt", ("skills/disrupt", "skills/stagger", "skills/hush")),
    ("smokeBomb", ("skills/smokeBomb",)),
    ("maelstrom", ("skills/maelstrom", "skills/inferno")),
    ("emberfall", ("skills/emberfall", "skills/fireball")),
    ("hasten", ("skills/hasten", "status/spdUp", "items/ringSwift")),
    ("stasis", ("skills/stasis", "skills/frostbind", "status/spdDown")),
    ("sanctuary", ("skills/sanctuary", "skills/prayer", "skills/bless")),
    ("benediction", ("skills/benediction", "skills/mend", "skills/cleanse", "items/holyWater")),
    ("judgment", ("skills/judgment", "skills/smite")),
    ("condemn", ("skills/condemn", "status/atkDown")),
    ("volley", ("skills/volley", "skills/pierceShot")),
    ("entangle", ("skills/entangle", "skills/poisonArrow")),
    ("windArrow", ("skills/windArrow", "skills/pierceShot", "skills/volley")),
    ("hex", ("skills/hex", "skills/venom")),
    ("mendChant", ("skills/mendChant", "skills/mend", "skills/prayer")),
    ("sandstorm", ("skills/sandstorm", "skills/maelstrom")),
    ("tidalWard", ("skills/tidalWard", "skills/ward", "skills/bulwark")),
)
COLS = 4
BACKGROUNDS = (("LIGHT", "#f3f0ea", "#1d1d24"), ("DARK", "#1d1d24", "#f3f0ea"))


def build(scale: int) -> None:
    icon_size = 24 * scale
    gap = 5 if scale == 1 else 10
    card_w = max(172, len(max((paths for _, paths in CARDS), key=len)) * (icon_size + gap) + 8)
    band_h = icon_size + 27
    group_h = 17 + band_h * 2
    rows = (len(CARDS) + COLS - 1) // COLS
    canvas = Image.new("RGB", (card_w * COLS, 20 + group_h * rows), "#d8d2c8")
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.load_default()
    draw.text((6, 5), f"ORDER 29 B | {scale}x NEAREST | NEW FIRST, THEN DISTINCTION REFERENCES", fill="#1d1d24", font=font)

    for index, (new_id, paths) in enumerate(CARDS):
        col, row = index % COLS, index // COLS
        left, top = col * card_w, 20 + row * group_h
        draw.rectangle((left, top, left + card_w - 1, top + group_h - 1), fill="#d8d2c8")
        draw.text((left + 5, top + 3), new_id, fill="#1d1d24", font=font)
        for band, (band_name, bg, fg) in enumerate(BACKGROUNDS):
            band_top = top + 17 + band * band_h
            draw.rectangle((left, band_top, left + card_w - 1, band_top + band_h - 1), fill=bg)
            draw.text((left + 3, band_top + 2), band_name, fill=fg, font=font)
            x = left + 35
            for pos, rel in enumerate(paths):
                icon = Image.open(ROOT / "assets" / f"{rel}.png").convert("RGBA")
                if scale != 1:
                    icon = icon.resize((icon_size, icon_size), Image.Resampling.NEAREST)
                canvas.paste(icon, (x, band_top + 12), icon)
                label = "NEW" if pos == 0 else rel.split("/")[-1]
                draw.text((x, band_top + 12 + icon_size + 1), label, fill=fg, font=font)
                x += icon_size + gap

    canvas.save(OUT / f"order29-B-proof-{scale}x.png", optimize=True)


if __name__ == "__main__":
    build(1)
    build(4)
