"""AI 도트 원본을 투명 32×32 게임 아이콘으로 축소한다.

원본은 이미 계단형 픽셀 덩어리로 생성되므로 최근접 보간만 사용한다.
색 재양자화나 벡터 변환은 하지 않는다.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def process(source: Path, output: Path, canvas: int, fit: int) -> None:
    image = Image.open(source).convert("RGBA")
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError(f"투명하지 않은 픽셀이 없습니다: {source}")

    cropped = image.crop(bbox)
    scale = min(fit / cropped.width, fit / cropped.height)
    size = (
        max(1, round(cropped.width * scale)),
        max(1, round(cropped.height * scale)),
    )
    sprite = cropped.resize(size, Image.Resampling.NEAREST)

    pixels = sprite.load()
    for y in range(sprite.height):
        for x in range(sprite.width):
            red, green, blue, alpha = pixels[x, y]
            pixels[x, y] = (red, green, blue, 255 if alpha >= 96 else 0)

    result = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    result.alpha_composite(
        sprite,
        ((canvas - sprite.width) // 2, (canvas - sprite.height) // 2),
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    result.save(output, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--canvas", type=int, default=32)
    parser.add_argument("--fit", type=int, default=30)
    args = parser.parse_args()
    process(args.source, args.output, args.canvas, args.fit)


if __name__ == "__main__":
    main()
