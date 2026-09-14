"""도트 아이콘 규격 검사 (2026-09-14, docs/14 §1). 납품 전에 돌린다 — 하나라도 어기면 종료 코드 1.

제로식 실측(라이브 서버 19종 · 2026-09-14)을 기준으로 삼는다: 24×24 · 1배 표시 · 색 중앙 9 · 외톨이 중앙 10%.

  반드시 (어기면 실패)
    · 크기 24×24
    · 반투명 픽셀 0 — 알파는 0 또는 255
    · 사방 여백 1px 이상 — 테두리가 캔버스 끝에 붙으면 잘린다
    · 불투명 색 12개 이하 (목표 8~10)
    · 불투명 색 6개 이상 — 그 아래는 재질 명암이 없는 평면 스티커다. JRPG 느낌이 사라진다 (2026-09-14 단장:
      "JRPG 느낌이 사라지면 안됩니다". 1차 손질 27종이 전부 3~5색으로 납작해져 반려됐다, docs/14 §9-1)
  경고 (실패는 아님)
    · 외톨이 픽셀 35% 초과 — 상하좌우 이웃 전부와 색이 다른 픽셀. 많으면 1배에서 흐리게 보인다

사용:
  python tools/check-icons.py                 manifest 의 skills items status traits
  python tools/check-icons.py regions adventures
"""

from __future__ import annotations

import json
import statistics
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SIZE = 24
MAX_COLORS = 12
MIN_COLORS = 6
WARN_LONE_PCT = 35
N4 = ((1, 0), (-1, 0), (0, 1), (0, -1))


def inspect(path: Path) -> dict:
    image = Image.open(path).convert("RGBA")
    w, h = image.size
    px = image.load()
    opaque = [(x, y) for y in range(h) for x in range(w) if px[x, y][3] > 0]
    semi = sum(1 for y in range(h) for x in range(w) if 0 < px[x, y][3] < 255)
    colors = {px[x, y][:3] for x, y in opaque}
    lone = 0
    for x, y in opaque:
        color = px[x, y][:3]
        near = [px[x + dx, y + dy][:3] for dx, dy in N4 if 0 <= x + dx < w and 0 <= y + dy < h and px[x + dx, y + dy][3] > 0]
        lone += len(near) >= 3 and color not in near
    if opaque:
        xs = [x for x, _ in opaque]
        ys = [y for _, y in opaque]
        margin = min(min(xs), min(ys), w - 1 - max(xs), h - 1 - max(ys))
    else:
        margin = -1
    return {"size": (w, h), "semi": semi, "colors": len(colors), "lone": lone * 100 // max(1, len(opaque)), "margin": margin, "empty": not opaque}


def main() -> int:
    # 한국어 Windows 콘솔(cp949)은 "—" 같은 문자에서 죽는다 — 파이프로 넘길 때도 UTF-8 로 쓴다
    sys.stdout.reconfigure(encoding="utf-8")
    groups = sys.argv[1:] or ["skills", "items", "status", "traits"]
    manifest = json.loads((ROOT / "assets" / "manifest.json").read_text(encoding="utf-8"))
    failures, warnings, rows = [], [], []
    for group in groups:
        for icon_id, entry in manifest.get(group, {}).items():
            if icon_id.startswith("$"):
                continue
            icon = str(entry.get("icon", ""))
            path = ROOT / "assets" / icon
            if not icon.endswith(".png") or not path.exists():
                failures.append(f"{group}/{icon_id}: PNG 없음 ({icon})")
                continue
            r = inspect(path)
            rows.append(r)
            name = f"{group}/{icon_id}"
            if r["empty"]:
                failures.append(f"{name}: 빈 그림")
                continue
            if r["size"] != (SIZE, SIZE):
                failures.append(f"{name}: 크기 {r['size'][0]}×{r['size'][1]} (24×24 여야 한다)")
            if r["semi"]:
                failures.append(f"{name}: 반투명 픽셀 {r['semi']}개")
            if r["margin"] < 1:
                failures.append(f"{name}: 여백 {r['margin']}px (1px 이상)")
            if r["colors"] > MAX_COLORS:
                failures.append(f"{name}: {r['colors']}색 ({MAX_COLORS}색 이하)")
            if r["colors"] < MIN_COLORS:
                failures.append(f"{name}: {r['colors']}색 — 평면 스티커. 재질 명암이 없으면 JRPG 느낌이 사라진다 ({MIN_COLORS}색 이상)")
            if r["lone"] > WARN_LONE_PCT:
                warnings.append(f"{name}: 외톨이 픽셀 {r['lone']}%")

    if rows:
        print(f"검사 {len(rows)}종 — 색 중앙 {statistics.median(r['colors'] for r in rows)} · "
              f"외톨이 중앙 {statistics.median(r['lone'] for r in rows)}%  (제로식 실측: 9색 · 10%)")
    for line in warnings:
        print("  경고", line)
    for line in failures:
        print("  실패", line)
    print("통과" if not failures else f"실패 {len(failures)}건")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
