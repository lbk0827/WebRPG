"""AI 도트 원본을 투명 24×24 게임 아이콘으로 만든다 (2026-09-14 제로식 규격으로 개정, docs/14 §1).

제로식 실측(24×24 · 1배 표시 · 약 9색)에 맞춘다. 순서가 중요하다:
  1. 알파 경계로 잘라 낸다
  2. **면적 평균**으로 22px 안에 맞춰 줄인다.
     최근접은 매끄러운 AI 원본(장당 약 7만 색)에서 픽셀을 제각각 집어 잡티가 된다 —
     전에 이 방식으로 만든 87종이 색 중앙 236 · 외톨이 픽셀 78% 였다
  3. 알파를 0/255 로 가른다 (반투명 금지)
  4. **불투명 픽셀만으로 뽑은 팔레트로 10색 이하**로 줄인다 (디더링 없음)
  5. 외톨이 픽셀(상하좌우 셋 이상이 같은 다른 색으로 둘러싸인 점)을 그 색으로 메운다

외곽선은 여기서 만들지 않는다. 필터로 두르면 가는 물체(검·지팡이)와 복합 아이콘이 덩어리가 되고,
어두운 바탕에서는 보이지도 않는다 (2026-09-14 시험). 테두리는 원본 그림에 그려져 있어야 한다.

사용:
  python tools/process-jrpg-icon.py <원본> <출력>
  python tools/process-jrpg-icon.py --all [그룹 ...]
      manifest 의 그룹(기본: skills items status traits)을 전부 원본에서 다시 만든다.
      원본은 art-source/icons/<그룹>/<id>-source.png, 없으면 art-source/<그룹>/<id>-source.png
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
N4 = ((1, 0), (-1, 0), (0, 1), (0, -1))
DEFAULT_GROUPS = ("skills", "items", "status", "traits")


def _fit(source: Path, canvas: int, fit: int, alpha_cut: int) -> Image.Image:
    image = Image.open(source).convert("RGBA")
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError(f"투명하지 않은 픽셀이 없습니다: {source}")
    cropped = image.crop(bbox)
    scale = min(fit / cropped.width, fit / cropped.height)
    size = (max(1, round(cropped.width * scale)), max(1, round(cropped.height * scale)))
    sprite = cropped.resize(size, Image.Resampling.BOX)  # 면적 평균 — 잡티를 만들지 않는다
    px = sprite.load()
    for y in range(sprite.height):
        for x in range(sprite.width):
            r, g, b, a = px[x, y]
            px[x, y] = (r, g, b, 255 if a >= alpha_cut else 0)
    out = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    out.alpha_composite(sprite, ((canvas - sprite.width) // 2, (canvas - sprite.height) // 2))
    return out


def _reduce_colors(image: Image.Image, colors: int) -> Image.Image:
    mask = image.getchannel("A")
    rgb = Image.new("RGB", image.size)
    rgb.paste(image.convert("RGB"), mask=mask)
    # 팔레트는 불투명 픽셀로만 뽑는다 — 투명 배경이 한 칸을 차지하지 않게
    opaque = [rgb.getpixel((x, y)) for y in range(image.height) for x in range(image.width) if mask.getpixel((x, y))]
    sample = Image.new("RGB", (len(opaque), 1))
    sample.putdata(opaque)
    palette = sample.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    reduced = rgb.quantize(palette=palette, dither=Image.Dither.NONE).convert("RGBA")
    reduced.putalpha(mask)
    return reduced


def _despeckle(image: Image.Image) -> Image.Image:
    px = image.load()
    src = image.copy().load()
    w, h = image.size
    for y in range(h):
        for x in range(w):
            if src[x, y][3] == 0:
                continue
            color = src[x, y][:3]
            around = [src[x + dx, y + dy][:3] for dx, dy in N4 if 0 <= x + dx < w and 0 <= y + dy < h and src[x + dx, y + dy][3] > 0]
            if len(around) >= 3 and color not in around:
                best = max(set(around), key=around.count)
                if around.count(best) >= 3:
                    px[x, y] = best + (255,)
    return image


def process(source: Path, output: Path, canvas: int = 24, fit: int = 22, colors: int = 10, alpha_cut: int = 96) -> None:
    icon = _despeckle(_reduce_colors(_fit(source, canvas, fit, alpha_cut), colors))
    output.parent.mkdir(parents=True, exist_ok=True)
    icon.save(output, optimize=True)


def _source_for(group: str, icon_id: str) -> Path:
    first = ROOT / "art-source" / "icons" / group / f"{icon_id}-source.png"
    return first if first.exists() else ROOT / "art-source" / group / f"{icon_id}-source.png"


def process_all(groups: list[str], **kw) -> int:
    manifest = json.loads((ROOT / "assets" / "manifest.json").read_text(encoding="utf-8"))
    done, missing = 0, []
    for group in groups:
        for icon_id, entry in manifest.get(group, {}).items():
            if icon_id.startswith("$") or not str(entry.get("icon", "")).endswith(".png"):
                continue
            source = _source_for(group, icon_id)
            if not source.exists():
                missing.append(f"{group}/{icon_id}")
                continue
            process(source, ROOT / "assets" / entry["icon"], **kw)
            done += 1
    print(f"변환 {done}종 (24×24 · 면적 평균 · {kw.get('colors', 10)}색 이하 · 외톨이 정리)")
    if missing:
        print("원본이 없어 건너뜀:", ", ".join(missing))
    return 1 if missing else 0


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")  # 한국어 Windows 콘솔(cp949) 대비 — check-icons.py 와 같다
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path, nargs="?")
    parser.add_argument("output", type=Path, nargs="?")
    parser.add_argument("--all", nargs="*", metavar="GROUP", help="manifest 그룹 전부를 원본에서 다시 만든다")
    parser.add_argument("--canvas", type=int, default=24)
    parser.add_argument("--fit", type=int, default=22)
    parser.add_argument("--colors", type=int, default=10)
    args = parser.parse_args()
    kw = dict(canvas=args.canvas, fit=args.fit, colors=args.colors)
    if args.all is not None:
        raise SystemExit(process_all(args.all or list(DEFAULT_GROUPS), **kw))
    if not args.source or not args.output:
        parser.error("<원본> <출력> 또는 --all")
    process(args.source, args.output, **kw)


if __name__ == "__main__":
    main()
