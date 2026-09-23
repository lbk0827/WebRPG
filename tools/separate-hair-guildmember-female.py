"""길드원(여) 원본에서 금발과 피부를 떼어 낸다 → art-source/units/guildMember-female-hairsep.png

원본의 애쉬 금발(#e4c09c 부근)은 피부색과 거의 같아 png-to-px 가 둘 다 피부 f 로 스냅했다.
그래서 48×64 에서 얼굴과 머리가 한 덩어리가 됐다 (2026-09-14 검수).
색만으로는 가를 수 없으므로 **위치**로 가른다:

  1. 얼굴 · 치켜든 팔뚝의 뺨/살 한 점에서 밝은 살색을 flood fill — 윤곽선(어두운 선)이 벽이 된다
  2. 채운 영역 안의 구멍(눈 · 입)도 살 영역으로 친다
  3. 머리 상자 안에서 살 영역이 아닌 따뜻한 베이지~갈색을 노란 금발 쪽(색상 46°)으로 옮긴다
     명도는 그대로 두므로 원본의 명암 · 결은 유지된다
  4. 살 영역의 밝은 칸은 공통 피부색(f #e8c39e) 밝기까지 누른다. 원본의 흰 피부는 f 보다 밝아
     흰색 w · 은색 s 로 스냅돼 얼굴이 가면처럼 보였다. 다른 캐릭터와 같은 피부색이 된다

이 파일은 png-to-px 의 입력일 뿐 그림을 새로 그리지 않는다. 다시 돌려도 결과가 같다.

사용 (저장소 루트에서):
  python tools/separate-hair-guildmember-female.py
  node tools/png-to-px.mjs art-source/units/guildMember-female-hairsep.png guildMember-female 3
  node tools/retouch-guildmember-female.mjs
  node tools/build-units.mjs
  node tools/px-to-png.mjs guildMember-female 10
"""
import colorsys
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "art-source" / "units" / "guildMember-female-source.png"
OUT = ROOT / "art-source" / "units" / "guildMember-female-hairsep.png"

# 살 영역의 씨앗 (원본 좌표). 가장 가까운 살색 칸으로 옮겨서 쓴다
SEEDS = [
    (364, 282),  # pose0 뺨
    (1108, 320),  # pose1 뺨
    (1028, 282),  # pose1 치켜든 팔뚝
    (1755, 345),  # pose2 뺨
]
FILL_REACH = 110  # 씨앗에서 이 거리 밖으로는 번지지 않는다
# 머리가 있는 상자 (원본 좌표). 망토 · 갑옷 · 칼은 색 조건에서 걸러진다
# pose1 · pose2 는 뒤로 흩날린 머리끝이 왼쪽으로 길게 나간다
HEADS = [(65, 141, 477, 380), (70, 380, 200, 405), (810, 195, 1248, 434), (1485, 206, 1987, 445)]  # 둘째 상자: pose0 왼쪽 아래 머리끝
# 머리색으로 바꾸지 않을 곳 — pose1 팔목 가죽 보호대
KEEP = [(1000, 290, 1060, 325)]
HAIR_HUE = 46  # 도
# 살 칸의 밝기 · 채도 한계 — 공통 피부색 f (#e8c39e: 명도 0.91, 채도 0.32) 에 맞춘다
SKIN_MAX_V = 0.91
SKIN_MIN_SAT = 0.30


def is_skin_like(p):
    r, g, b, a = p
    return a > 200 and r > 200 and g > 150 and b > 110 and r - b > 30


def snap_seed(px, seed):
    sx, sy = seed
    best = None
    for dy in range(-30, 31):
        for dx in range(-30, 31):
            x, y = sx + dx, sy + dy
            if is_skin_like(px[x, y]) and (best is None or dx * dx + dy * dy < best[0]):
                best = (dx * dx + dy * dy, (x, y))
    if best is None:
        raise SystemExit(f"씨앗 {seed} 근처에 살색이 없다")
    return best[1]


def skin_region(px, seed):
    sx, sy = seed
    x0, y0, x1, y1 = sx - FILL_REACH, sy - FILL_REACH, sx + FILL_REACH, sy + FILL_REACH
    filled = set()
    seen = {seed}
    q = deque([seed])
    while q:
        x, y = q.popleft()
        if not is_skin_like(px[x, y]):
            continue
        filled.add((x, y))
        for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if x0 <= n[0] < x1 and y0 <= n[1] < y1 and n not in seen:
                seen.add(n)
                q.append(n)
    # 구멍 메우기: 상자 가장자리에서 살이 아닌 칸을 따라 들어가지 못한 곳이 구멍(눈 · 입)이다
    bx0 = min(x for x, _ in filled) - 1
    bx1 = max(x for x, _ in filled) + 2
    by0 = min(y for _, y in filled) - 1
    by1 = max(y for _, y in filled) + 2
    outside = set()
    q = deque((x, y) for x in range(bx0, bx1) for y in (by0, by1 - 1))
    q.extend((x, y) for y in range(by0, by1) for x in (bx0, bx1 - 1))
    while q:
        c = q.popleft()
        if c in outside or c in filled or not (bx0 <= c[0] < bx1 and by0 <= c[1] < by1):
            continue
        outside.add(c)
        x, y = c
        q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return {(x, y) for x in range(bx0, bx1) for y in range(by0, by1) if (x, y) not in outside}


def main():
    im = Image.open(SRC).convert("RGBA")
    px = im.load()
    skin = set()
    for seed in SEEDS:
        skin |= skin_region(px, snap_seed(px, seed))

    out = im.copy()
    op = out.load()
    for x, y in skin:
        r, g, b, a = px[x, y]
        if not is_skin_like((r, g, b, a)):
            continue  # 눈 · 입 · 윤곽선은 그대로
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        rr, gg, bb = colorsys.hsv_to_rgb(h, max(s, SKIN_MIN_SAT), min(v, SKIN_MAX_V))
        op[x, y] = (round(rr * 255), round(gg * 255), round(bb * 255), a)
    changed = 0
    for x0, y0, x1, y1 in HEADS:
        for y in range(y0, y1):
            for x in range(x0, x1):
                if (x, y) in skin or any(k[0] <= x < k[2] and k[1] <= y < k[3] for k in KEEP):
                    continue
                r, g, b, a = px[x, y]
                if a < 200:
                    continue
                h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
                if 15 <= h * 360 <= 50 and s >= 0.12 and v >= 0.30:
                    rr, gg, bb = colorsys.hsv_to_rgb(HAIR_HUE / 360, min(1.0, s * 1.05), v)
                    op[x, y] = (round(rr * 255), round(gg * 255), round(bb * 255), a)
                    changed += 1
    out.save(OUT)
    print(f"{OUT.relative_to(ROOT)}  살 {len(skin)}칸 보존 · 머리 {changed}칸 색상 {HAIR_HUE}°")


if __name__ == "__main__":
    main()
