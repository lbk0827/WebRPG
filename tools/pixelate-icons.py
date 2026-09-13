"""프로젝트 아이콘을 24×24 팔레트 도트 SVG로 굽는다.

브라우저는 입력 도형의 래스터라이저로만 쓴다. 출력은 PNG를 품은 SVG가 아니라
색별 1픽셀 run을 path로 묶은 텍스트 SVG라서 수작업 검수와 버전 비교가 가능하다.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image


# 도구는 tools/ 에, 다루는 파일은 assets/ 에 있다 (2026-09-13 분리)
HERE = Path(__file__).resolve().parent.parent / "assets"
GENERATED_GROUPS = ("skills", "items", "status", "traits")
SOURCE_ROOT = HERE.parent / "art-source" / "icon-vectors"
GRID = 24

PALETTE = tuple(
    bytes.fromhex(value)
    for value in (
        "1d1d24", "34343f", "e9e4d8", "fff5cc", "cfd6e0", "8fa3b8",
        "8a7550", "5e4f36", "6b4b2a", "a06c3b", "8fd3ff", "2f6fd6",
        "d4a017", "7bd389", "2f4a37", "b23a48", "7d2632", "5b4b8a",
        "3a3450", "f7f4ec",
    )
)
INK = PALETTE[0]
LIGHT = {
    PALETTE[1]: INK,
    PALETTE[2]: PALETTE[3], PALETTE[3]: PALETTE[19],
    PALETTE[4]: PALETTE[19], PALETTE[5]: PALETTE[4],
    PALETTE[6]: PALETTE[9], PALETTE[7]: PALETTE[6],
    PALETTE[8]: PALETTE[9], PALETTE[9]: PALETTE[3],
    PALETTE[10]: PALETTE[19], PALETTE[11]: PALETTE[10],
    PALETTE[12]: PALETTE[3], PALETTE[13]: PALETTE[3],
    PALETTE[14]: PALETTE[13], PALETTE[15]: PALETTE[3],
    PALETTE[16]: PALETTE[15], PALETTE[17]: PALETTE[10],
    PALETTE[18]: PALETTE[17], PALETTE[19]: PALETTE[3],
}
DARK = {
    PALETTE[1]: INK,
    PALETTE[2]: PALETTE[5], PALETTE[3]: PALETTE[2],
    PALETTE[4]: PALETTE[5], PALETTE[5]: PALETTE[1],
    PALETTE[6]: PALETTE[7], PALETTE[7]: PALETTE[8],
    PALETTE[8]: PALETTE[7], PALETTE[9]: PALETTE[8],
    PALETTE[10]: PALETTE[11], PALETTE[11]: PALETTE[18],
    PALETTE[12]: PALETTE[8], PALETTE[13]: PALETTE[14],
    PALETTE[14]: PALETTE[1], PALETTE[15]: PALETTE[16],
    PALETTE[16]: PALETTE[1], PALETTE[17]: PALETTE[18],
    PALETTE[18]: PALETTE[1], PALETTE[19]: PALETTE[4],
}


def browser() -> str:
    env = os.environ.get("WEBRPG_BROWSER")
    candidates = [
        env,
        shutil.which("google-chrome"),
        shutil.which("chromium"),
        shutil.which("chrome"),
        shutil.which("msedge"),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return str(candidate)
    raise RuntimeError("Chrome/Chromium/Edge를 찾지 못했습니다. WEBRPG_BROWSER를 지정하세요.")


def nearest(rgb: tuple[int, int, int]) -> bytes:
    return min(PALETTE, key=lambda c: sum((rgb[i] - c[i]) ** 2 for i in range(3)))


def rasterize(exe: str, source: Path, target: Path, profile: Path) -> None:
    # SVG 자체의 width=64를 24px 뷰포트로 곧장 찍으면 우상/하단이 잘린다.
    # 24×24 img로 명시한 래퍼를 거쳐 viewBox 전체를 축소 렌더링한다.
    wrapper = target.with_suffix(".html")
    wrapper.write_text(
        '<!doctype html><style>*{box-sizing:border-box}html,body{margin:0;width:24px;height:24px;'
        'overflow:hidden;background:transparent}img{display:block;width:24px;height:24px}</style>'
        f'<img src="{source.resolve().as_uri()}">',
        encoding="utf-8",
    )
    uri = wrapper.resolve().as_uri()
    command = [
        exe, "--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars",
        "--default-background-color=00000000", f"--user-data-dir={profile}",
        f"--window-size={GRID},{GRID}", f"--screenshot={target}", uri,
    ]
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def pixels(source: Path) -> list[list[bytes | None]]:
    image = Image.open(source).convert("RGBA")
    base: list[list[bytes | None]] = []
    for y in range(GRID):
        row: list[bytes | None] = []
        for x in range(GRID):
            r, g, b, a = image.getpixel((x, y))
            row.append(nearest((r, g, b)) if a >= 96 else None)
        base.append(row)

    # 캐릭터 시트와 같은 좌상단 광원. 색 면의 안쪽 위/왼쪽은 밝히고,
    # 아래/오른쪽은 어둡혀 평면 픽토그램 대신 작은 도트 오브젝트로 읽히게 한다.
    result = [row[:] for row in base]
    for y in range(GRID):
        for x in range(GRID):
            color = base[y][x]
            if color is None or color == INK:
                continue
            above = base[y - 1][x] if y else None
            left = base[y][x - 1] if x else None
            below = base[y + 1][x] if y + 1 < GRID else None
            right = base[y][x + 1] if x + 1 < GRID else None
            if above in (None, INK) or left in (None, INK):
                result[y][x] = LIGHT[color]
            elif below in (None, INK) or right in (None, INK):
                result[y][x] = DARK[color]
            elif x + y > 27 and (x + 2 * y) % 5 == 0:
                result[y][x] = DARK[color]
    return result


def svg(title: str, grid: list[list[bytes | None]]) -> str:
    paths: dict[bytes, list[str]] = {}
    for y, row in enumerate(grid):
        x = 0
        while x < GRID:
            color = row[x]
            if color is None:
                x += 1
                continue
            end = x + 1
            while end < GRID and row[end] == color:
                end += 1
            paths.setdefault(color, []).append(f"M{x} {y}h{end - x}v1H{x}Z")
            x = end
    body = "".join(
        f'<path fill="#{color.hex()}" d="{"".join(parts)}"/>'
        for color, parts in paths.items()
    )
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" '
        'width="64" height="64" shape-rendering="crispEdges">\n'
        f"  <title>{title}</title>\n  {body}\n</svg>\n"
    )


def title_of(source: Path) -> str:
    text = source.read_text(encoding="utf-8")
    start = text.index("<title>") + len("<title>")
    return text[start:text.index("</title>", start)]


def main() -> None:
    exe = browser()
    pairs = [
        *((source, HERE / group / source.name)
          for group in ("jobs", "monsters")
          for source in sorted((SOURCE_ROOT / group).glob("*.svg"))),
        *((path, path)
          for group in GENERATED_GROUPS
          for path in sorted((HERE / group).glob("*.svg"))),
    ]
    with tempfile.TemporaryDirectory(prefix="webrpg-pixel-icons-") as temp:
        temp_dir = Path(temp)
        profile = temp_dir / "profile"
        for index, (source, target) in enumerate(pairs):
            shot = temp_dir / f"{index:03}.png"
            rasterize(exe, source, shot, profile)
            target.write_text(svg(title_of(source), pixels(shot)), encoding="utf-8")
    print(f"pixel icons: {len(pairs)} (24x24 grid SVG)")


if __name__ == "__main__":
    main()
