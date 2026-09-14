"""전투 배경 변환 · 검사 (docs/23)

  python tools/process-backdrop.py <원본.png> <키>   AI 원본 → assets/backdrops/<키>.png (480×360, 색 제한)
  python tools/process-backdrop.py --check           assets/backdrops/ 전부 검사 + 등록표와 대조

변환:
  1. 가로 4:3 으로 가운데를 자른다 (위아래가 남으면 **아래를 살린다** — 바닥이 캐릭터 발밑이다)
  2. 480×360 으로 줄인다. 원본이 정수 배(1440×1080 = 3배 등)면 칸마다 평균이라 도트 격자가 그대로 선다
  3. 색을 COLORS 색으로 줄인다 (디더링 없음 — 도트 그림은 같은 색 덩어리로 읽힌다)
  4. 불투명 PNG 로 저장하고, 맨 윗줄의 대표색을 알려 준다 → lib/backdrops.ts 의 BACKDROP_READY 에 적는다

검사 (실패 = 종료 코드 1, 경고는 알리기만):
  실패 — 크기 480×360 아님 · 투명 칸 있음 · 색 MAX_COLORS 초과 · 모르는 키(지역 · 모험 id 가 아님)
        · 등록표(BACKDROP_READY)에는 있는데 파일이 없음
  경고 — 파일은 있는데 등록 전 · 캐릭터가 서는 가운데 띠가 너무 밝거나 어둡거나 요란함
"""
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "assets" / "backdrops"
W, H = 480, 360
COLORS = 48  # 변환이 줄이는 색 수
MAX_COLORS = 64  # 검사 한도 (손으로 다듬어 몇 색 늘어나는 것은 허용)
# 캐릭터가 서는 띠 (그림 좌표). 판의 아래 가운데에 맞추므로 발은 대략 y 200~320 에 온다
BAND = (110, 320)
BAND_LUMA = (0.16, 0.70)  # 평균 밝기가 이 밖이면 경고 — 흰 말풍선 · 어두운 도트가 묻힌다
BAND_BUSY = 0.085  # 이웃 칸 밝기 차 평균이 이보다 크면 경고 — 캐릭터가 배경에 섞인다


def known_keys():
    keys = set()
    for name in ("regions.ts", "adventures.ts"):
        text = (ROOT / "packages" / "engine" / "src" / "data" / name).read_text(encoding="utf-8")
        keys |= set(re.findall(r"\n    id: '(\w+)'", text))
    return keys


def registered_keys():
    text = (ROOT / "apps" / "web" / "src" / "lib" / "backdrops.ts").read_text(encoding="utf-8")
    block = re.search(r"export const BACKDROP_READY[^=]*= \{(.*?)\n\}", text, re.S)
    return set(re.findall(r"^\s*(\w+)\s*:", block.group(1), re.M)) if block else set()


def luma(rgb):
    r, g, b = rgb
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255


def top_color(img):
    row = [img.getpixel((x, 0)) for x in range(img.width)]
    best = max(set(row), key=row.count)
    return "#%02x%02x%02x" % best[:3]


def convert(src, key):
    if key not in known_keys():
        raise SystemExit(f"모르는 키: {key} — 지역 · 모험 id 여야 한다")
    im = Image.open(src).convert("RGB")
    sw, sh = im.size
    if sw * 3 > sh * 4:  # 가로가 길다 → 좌우를 자른다
        cw = sh * 4 // 3
        im = im.crop(((sw - cw) // 2, 0, (sw - cw) // 2 + cw, sh))
    else:  # 세로가 길다 → 위를 자르고 아래(바닥)를 살린다
        ch = sw * 3 // 4
        im = im.crop((0, sh - ch, sw, sh))
    im = im.resize((W, H), Image.BOX)
    im = im.quantize(colors=COLORS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f"{key}.png"
    im.save(out, optimize=True)
    print(f"{out.relative_to(ROOT)}  {W}×{H}  색 {len(im.getcolors(W * H))}")
    print(f"lib/backdrops.ts 의 BACKDROP_READY 에 추가:  {key}: {{ top: '{top_color(im)}' }},")


def band_stats(img):
    y0, y1 = BAND
    px = img.load()
    total = diff = 0.0
    n = m = 0
    for y in range(y0, y1):
        for x in range(img.width):
            l = luma(px[x, y])
            total += l
            n += 1
            if x + 1 < img.width:
                diff += abs(l - luma(px[x + 1, y]))
                m += 1
    return total / n, diff / m


def check():
    keys, reg = known_keys(), registered_keys()
    files = {p.stem: p for p in OUT_DIR.glob("*.png")} if OUT_DIR.exists() else {}
    fails = warns = 0
    for key, path in sorted(files.items()):
        im = Image.open(path)
        problems, notes = [], []
        if im.size != (W, H):
            problems.append(f"크기 {im.size[0]}×{im.size[1]} (480×360 이어야 한다)")
        if im.mode in ("RGBA", "LA") or "transparency" in im.info:
            alpha = im.convert("RGBA").getchannel("A")
            if alpha.getextrema()[0] < 255:
                problems.append("투명 칸이 있다 (배경은 불투명)")
        rgb = im.convert("RGB")
        colors = rgb.getcolors(MAX_COLORS)
        if colors is None:
            problems.append(f"색 {MAX_COLORS}개 초과")
        if key not in keys:
            problems.append("모르는 키 (지역 · 모험 id 가 아니다)")
        if key not in reg:
            notes.append("등록 전 — BACKDROP_READY 에 추가")
        if rgb.size == (W, H):
            mean, busy = band_stats(rgb)
            if not BAND_LUMA[0] <= mean <= BAND_LUMA[1]:
                notes.append(f"가운데 띠 밝기 {mean:.2f} (권장 {BAND_LUMA[0]}~{BAND_LUMA[1]})")
            if busy > BAND_BUSY:
                notes.append(f"가운데 띠가 요란하다 {busy:.3f} (권장 ≤ {BAND_BUSY})")
        status = "실패" if problems else ("경고" if notes else "통과")
        fails += bool(problems)
        warns += bool(notes)
        print(f"{status}  {key:<14} 색 {len(colors) if colors else '>' + str(MAX_COLORS)}  {' · '.join(problems + notes)}")
    for key in sorted(reg - set(files)):
        print(f"실패  {key:<14} 등록표에는 있는데 파일이 없다 (assets/backdrops/{key}.png)")
        fails += 1
    print(f"\n파일 {len(files)} · 등록 {len(reg)} · 실패 {fails} · 경고 {warns} · 전체 키 {len(keys)}")
    return 1 if fails else 0


def main():
    for stream in (sys.stdout, sys.stderr):  # 윈도 콘솔(cp949)에서 한국어 · 대시가 깨지지 않게
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    args = sys.argv[1:]
    if args == ["--check"]:
        sys.exit(check())
    if len(args) != 2:
        print(__doc__)
        sys.exit(2)
    convert(args[0], args[1])


if __name__ == "__main__":
    main()
