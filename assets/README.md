# assets — 리소스 원장 (License Ledger)

이 디렉토리의 **모든 파일은 출처와 라이선스가 여기에 기록되어야 한다.**
기록되지 않은 파일은 커밋하지 않는다. 상용화 시 이 표가 곧 법무 검토 자료가 된다.

## 허용되는 출처

| 출처 | 조건 |
|---|---|
| 자체 제작 (코드로 생성한 SVG 포함) | 이 저장소 소유. 별도 조건 없음 |
| CC0 / Public Domain | 링크와 취득일 기록 |
| 상업 이용 허용 라이선스 (CC-BY, SIL OFL, 유료 팩 등) | 라이선스 전문 또는 영수증 보관, 표기 의무 이행 |
| 외주 제작 | 계약서에 저작재산권 양도 조항 확인 |

## 금지

- 원본 `Hall of Fame` 및 그 소재 사이트(Rド, Whitecat 등)의 이미지 — **참고·변형 포함 전부 금지**
  (그림은 코드보다 유사성 판단이 엄격하다. "보고 그린 것"도 2차적 저작물이 될 수 있다)
- 출처 불명 이미지, 검색해서 받은 이미지
- 라이선스에 "non-commercial" 이 포함된 모든 소재
- AI 생성 이미지 — 사용 시 생성 도구의 상업 이용 약관과 학습 데이터 정책을 확인하고 여기에 기록

## AI 원본 보관 (2026-09-13 단장 결정)

- AI 가 만든 원본(`../art-source/`)은 **저장소에 커밋한다.** 게임에는 실리지 않는다 — 배포되는 것은 Vite publicDir 인 `assets/` 뿐이고 `art-source/` 는 그 바깥이다.
- 원본은 보관물이 아니라 **빌드 입력**이다. `process-jrpg-icon.py` 로 원본에서 다시 뽑으면 아이콘 87종이 픽셀 하나까지 같게 나온다 (2026-09-13 검증). 축소본으로는 재현되지 않는다 — 256px 로 줄인 원본에서는 실루엣이 평균 8% 어긋났다. 그래서 줄이거나 다시 압축하지 않고 원본 그대로 넣는다.
- **채택된 원본만 넣는다.** 버려진 시안, 다시 뽑기 전의 초안은 넣지 않는다. 몬스터·2차 직업 원본이 계속 쌓여도 저장소가 불필요하게 무거워지지 않게 하기 위해서다.
  스타일을 정한 시험본처럼 **이 원장에 근거로 기록된 자료**는 채택본으로 본다 (`icon-drafts/` — JRPG 화풍을 고른 파일럿 2종).
- 원본을 넣을 때는 이 원장에 **원본 줄과 변환본 줄을 함께** 적는다.

## 원장

| 파일 | 종류 | 출처 | 라이선스 | 기록일 |
|---|---|---|---|---|
| `jobs/warrior.svg` | 전사 도트 아이콘 | 자체 제작 벡터 원본 → `pixelate-icons.py` (24×24 격자) | 저장소 소유 | 2026-09-13 |
| `jobs/rogue.svg` | 도적 도트 아이콘 | 자체 제작 벡터 원본 → `pixelate-icons.py` (24×24 격자) | 저장소 소유 | 2026-09-13 |
| `jobs/mage.svg` | 마법사 도트 아이콘 | 자체 제작 벡터 원본 → `pixelate-icons.py` (24×24 격자) | 저장소 소유 | 2026-09-13 |
| `jobs/priest.svg` | 프리스트 도트 아이콘 | 자체 제작 벡터 원본 → `pixelate-icons.py` (24×24 격자) | 저장소 소유 | 2026-09-13 |
| `jobs/elf.svg` | 엘프 도트 아이콘 | 자체 제작 벡터 원본 → `pixelate-icons.py` (24×24 격자) | 저장소 소유 | 2026-09-13 |
| `monsters/goblin.svg` | 고블린 도트 아이콘 | 자체 제작 벡터 원본 → `pixelate-icons.py` (24×24 격자) | 저장소 소유 | 2026-09-13 |
| `monsters/beast.svg` | 들개 도트 아이콘 | 자체 제작 벡터 원본 → `pixelate-icons.py` (24×24 격자) | 저장소 소유 | 2026-09-13 |
| `monsters/turtle.svg` | 바위 거북 도트 아이콘 | 자체 제작 벡터 원본 → `pixelate-icons.py` (24×24 격자) | 저장소 소유 | 2026-09-13 |
| `monsters/harpy.svg` | 하피 도트 아이콘 | 자체 제작 벡터 원본 → `pixelate-icons.py` (24×24 격자) | 저장소 소유 | 2026-09-13 |
| `monsters/shaman.svg` | 주술사 도트 아이콘 | 자체 제작 벡터 원본 → `pixelate-icons.py` (24×24 격자) | 저장소 소유 | 2026-09-13 |
| `monsters/spider.svg` | 독거미 도트 아이콘 | 자체 제작 벡터 원본 → `pixelate-icons.py` (24×24 격자) | 저장소 소유 | 2026-09-13 |
| `monsters/swarm.svg` | 박쥐 떼 도트 아이콘 | 자체 제작 벡터 원본 → `pixelate-icons.py` (24×24 격자) | 저장소 소유 | 2026-09-13 |
| `monsters/ogre.svg` | 오우거 도트 아이콘 | 자체 제작 벡터 원본 → `pixelate-icons.py` (24×24 격자) | 저장소 소유 | 2026-09-13 |
| `../art-source/icon-vectors/jobs/warrior.svg` | 전사 아이콘 벡터 원본 | 기존 자체 제작 수작업 SVG 보존본 | 저장소 소유 | 2026-09-13 |
| `../art-source/icon-vectors/jobs/rogue.svg` | 도적 아이콘 벡터 원본 | 기존 자체 제작 수작업 SVG 보존본 | 저장소 소유 | 2026-09-13 |
| `../art-source/icon-vectors/jobs/mage.svg` | 마법사 아이콘 벡터 원본 | 기존 자체 제작 수작업 SVG 보존본 | 저장소 소유 | 2026-09-13 |
| `../art-source/icon-vectors/jobs/priest.svg` | 프리스트 아이콘 벡터 원본 | 기존 자체 제작 수작업 SVG 보존본 | 저장소 소유 | 2026-09-13 |
| `../art-source/icon-vectors/jobs/elf.svg` | 엘프 아이콘 벡터 원본 | 기존 자체 제작 수작업 SVG 보존본 | 저장소 소유 | 2026-09-13 |
| `../art-source/icon-vectors/monsters/goblin.svg` | 고블린 아이콘 벡터 원본 | 기존 자체 제작 수작업 SVG 보존본 | 저장소 소유 | 2026-09-13 |
| `../art-source/icon-vectors/monsters/beast.svg` | 들개 아이콘 벡터 원본 | 기존 자체 제작 수작업 SVG 보존본 | 저장소 소유 | 2026-09-13 |
| `../art-source/icon-vectors/monsters/turtle.svg` | 바위 거북 아이콘 벡터 원본 | 기존 자체 제작 수작업 SVG 보존본 | 저장소 소유 | 2026-09-13 |
| `../art-source/icon-vectors/monsters/harpy.svg` | 하피 아이콘 벡터 원본 | 기존 자체 제작 수작업 SVG 보존본 | 저장소 소유 | 2026-09-13 |
| `../art-source/icon-vectors/monsters/shaman.svg` | 주술사 아이콘 벡터 원본 | 기존 자체 제작 수작업 SVG 보존본 | 저장소 소유 | 2026-09-13 |
| `../art-source/icon-vectors/monsters/spider.svg` | 독거미 아이콘 벡터 원본 | 기존 자체 제작 수작업 SVG 보존본 | 저장소 소유 | 2026-09-13 |
| `../art-source/icon-vectors/monsters/swarm.svg` | 박쥐 떼 아이콘 벡터 원본 | 기존 자체 제작 수작업 SVG 보존본 | 저장소 소유 | 2026-09-13 |
| `../art-source/icon-vectors/monsters/ogre.svg` | 오우거 아이콘 벡터 원본 | 기존 자체 제작 수작업 SVG 보존본 | 저장소 소유 | 2026-09-13 |
| `../art-source/units/warrior-source.png` | AI 생성 도트 시트 초안 (전사, 검+방패 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `rogue-source.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-11 |
| `units/warrior.px` | **도트 전투 스프라이트 원본** (전사, AI 초안 변환 후 검수) | `warrior-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-11 |
| `units/warrior.svg` | 생성물 (`node tools/build-units.mjs`) | `warrior.px`에서 생성 | 원본과 동일 | 2026-09-11 |
| `../tools/build-units.mjs` | 도구 (`.px` → `.svg` 컴파일러) | 자체 제작 | 저장소 소유 | 2026-09-11 |
| `../tools/png-to-px.mjs` | 도구 (AI 가 그린 PNG 시트 → `.px` 초안) | 자체 제작 | 저장소 소유 | 2026-09-11 |
| `../tools/px-to-png.mjs` | 도구 (`.px` → PNG 시트. AI 에게 올릴 레퍼런스) | 자체 제작 | 저장소 소유 | 2026-09-11 |
| `units/warrior-sheet.png` | 검수용 생성물 (`node tools/px-to-png.mjs warrior 10`) | `warrior.px`에서 생성 | 원본과 동일 | 2026-09-11 |
| `../art-source/units/rogue-source.png` | AI 생성 도트 시트 초안 (도적, 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `warrior-sheet.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-11 |
| `units/rogue.px` | 도트 전투 스프라이트 원본 (도적, AI 초안 변환 후 검수) | `rogue-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-11 |
| `units/rogue.svg` | 생성물 (`node tools/build-units.mjs`) | `rogue.px`에서 생성 | 원본과 동일 | 2026-09-11 |
| `units/rogue-sheet.png` | 검수용 생성물 (`node tools/px-to-png.mjs rogue 10`) | `rogue.px`에서 생성 | 원본과 동일 | 2026-09-11 |
| `../art-source/units/mage-source.png` | AI 생성 도트 시트 초안 (마법사, 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `warrior-sheet.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-11 |
| `units/mage.px` | 도트 전투 스프라이트 원본 (마법사, AI 초안 변환 후 검수) | `mage-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-11 |
| `units/mage.svg` | 생성물 (`node tools/build-units.mjs`) | `mage.px`에서 생성 | 원본과 동일 | 2026-09-11 |
| `units/mage-sheet.png` | 검수용 생성물 (`node tools/px-to-png.mjs mage 10`) | `mage.px`에서 생성 | 원본과 동일 | 2026-09-11 |
| `../art-source/units/priest-source.png` | AI 생성 도트 시트 초안 (프리스트, 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `warrior-sheet.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-11 |
| `units/priest.px` | 도트 전투 스프라이트 원본 (프리스트, AI 초안 변환 후 검수) | `priest-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-11 |
| `units/priest.svg` | 생성물 (`node tools/build-units.mjs`) | `priest.px`에서 생성 | 원본과 동일 | 2026-09-11 |
| `units/priest-sheet.png` | 검수용 생성물 (`node tools/px-to-png.mjs priest 10`) | `priest.px`에서 생성 | 원본과 동일 | 2026-09-11 |
| `../art-source/units/elf-source.png` | AI 생성 도트 시트 초안 (엘프, 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `warrior-sheet.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-11 |
| `units/elf.px` | 도트 전투 스프라이트 원본 (엘프, AI 초안 변환 후 검수) | `elf-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-11 |
| `units/elf.svg` | 생성물 (`node tools/build-units.mjs`) | `elf.px`에서 생성 | 원본과 동일 | 2026-09-11 |
| `units/elf-sheet.png` | 검수용 생성물 (`node tools/px-to-png.mjs elf 10`) | `elf.px`에서 생성 | 원본과 동일 | 2026-09-11 |
| `../art-source/units/adventurer-male-source.png` | AI 생성 도트 시트 초안 (모험가 남, 주황 망토·몽둥이 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `warrior-sheet.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-14 |
| `units/adventurer-male.px` | 도트 전투 스프라이트 원본 (모험가 남) | `adventurer-male-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-14 |
| `units/adventurer-male.svg` | 생성물 (`node tools/build-units.mjs`) | `adventurer-male.px`에서 생성 | 원본과 동일 | 2026-09-14 |
| `units/adventurer-male-sheet.png` | 검수용 생성물 (`node tools/px-to-png.mjs adventurer-male 10`) | `adventurer-male.px`에서 생성 | 원본과 동일 | 2026-09-14 |
| `../art-source/units/adventurer-female-source.png` | AI 생성 도트 시트 초안 (모험가 여, 청록 망토·땋은 머리·몽둥이 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `adventurer-male-source.png`만 사용, 체형·대표색 수정 및 투명 배경 정리 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-14 |
| `units/adventurer-female.px` | 도트 전투 스프라이트 원본 (모험가 여) | `adventurer-female-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-14 |
| `units/adventurer-female.svg` | 생성물 (`node tools/build-units.mjs`) | `adventurer-female.px`에서 생성 | 원본과 동일 | 2026-09-14 |
| `units/adventurer-female-sheet.png` | 검수용 생성물 (`node tools/px-to-png.mjs adventurer-female 10`) | `adventurer-female.px`에서 생성 | 원본과 동일 | 2026-09-14 |
| `../art-source/units/guildMember-male-source.png` | AI 생성 도트 시트 초안 (길드원 남, 남색 망토·에고 소드 3포즈) | OpenAI 내장 ImageGen — 자체 제작 `adventurer-male-source.png` 참조 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-14 |
| `units/guildMember-male.px` | 도트 전투 스프라이트 원본 (길드원 남) | `guildMember-male-source.png` → `png-to-px.mjs` | 원본과 동일 | 2026-09-14 |
| `units/guildMember-male.svg` | 48×64 게임용 생성물 | `guildMember-male.px`에서 생성 | 원본과 동일 | 2026-09-14 |
| `units/guildMember-male-sheet.png` | 10배 검수 시트 | `guildMember-male.px`에서 생성 | 원본과 동일 | 2026-09-14 |
| `../art-source/units/guildMember-female-source.png` | AI 생성 도트 시트 초안 (길드원 여, 긴 애쉬 블론드·남색 망토·에고 소드 3포즈) | OpenAI 내장 ImageGen — 자체 제작 `guildMember-male-source.png` 참조, 투명 배경 정리 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-14 |
| `units/guildMember-female.px` | 도트 전투 스프라이트 원본 (길드원 여) | `guildMember-female-source.png` → `png-to-px.mjs` | 원본과 동일 | 2026-09-14 |
| `units/guildMember-female.svg` | 48×64 게임용 생성물 | `guildMember-female.px`에서 생성 | 원본과 동일 | 2026-09-14 |
| `units/guildMember-female-sheet.png` | 10배 검수 시트 | `guildMember-female.px`에서 생성 | 원본과 동일 | 2026-09-14 |
| `manifest.json` | 매니페스트 | 자체 제작 | 저장소 소유 | 2026-09-10 |
| `../tools/build-icons.mjs` | 도구 (요청서 87종 SVG 생성·매니페스트·원장 동기화) | 자체 제작 | 저장소 소유 | 2026-09-12 |
| `../tools/pixelate-icons.py` | 도구 (도형 SVG → 24×24 제한 팔레트 도트 SVG) | 자체 제작 | 저장소 소유 | 2026-09-13 |
| `../tools/build-preview.mjs` | 도구 (SVG·PNG 인라인 프리뷰 생성) | 자체 제작 | 저장소 소유 | 2026-09-13 |
| `../tools/process-jrpg-icon.py` | 도구 (AI 도트 원본 → 투명 24×24 PNG · 면적 평균 · 10색 이하 · 외톨이 정리. 2026-09-14 제로식 규격으로 개정) | 자체 제작 | 저장소 소유 | 2026-09-14 |
| `../tools/check-icons.py` | 도구 (도트 아이콘 규격 검사 — 24×24 · 반투명 0 · 여백 1px · 12색 이하, 외톨이 픽셀 경고) | 자체 제작 | 저장소 소유 | 2026-09-14 |
| `../tools/preview.html` | 생성물 (`node tools/build-preview.mjs`) | 자체 제작 | 저장소 소유 | 2026-09-10 |

<!-- generated-monster-units:start -->
| `../art-source/units/goblin-source.png` | AI 생성 도트 시트 초안 (고블린, 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `warrior-sheet.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/goblin.px` | 도트 전투 스프라이트 원본 (고블린, AI 초안 변환 후 검수) | `goblin-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/goblin.svg` | 생성물 (`node tools/build-units.mjs`) | `goblin.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `units/goblin-sheet.png` | 검수용 생성물 (`node tools/px-to-png.mjs goblin 10`) | `goblin.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `../art-source/units/beast-source.png` | AI 생성 도트 시트 초안 (들개, 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `warrior-sheet.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/beast.px` | 도트 전투 스프라이트 원본 (들개, AI 초안 변환 후 검수) | `beast-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/beast.svg` | 생성물 (`node tools/build-units.mjs`) | `beast.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `units/beast-sheet.png` | 검수용 생성물 (`node tools/px-to-png.mjs beast 10`) | `beast.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `../art-source/units/turtle-source.png` | AI 생성 도트 시트 초안 (바위 거북, 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `warrior-sheet.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/turtle.px` | 도트 전투 스프라이트 원본 (바위 거북, AI 초안 변환 후 검수) | `turtle-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/turtle.svg` | 생성물 (`node tools/build-units.mjs`) | `turtle.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `units/turtle-sheet.png` | 검수용 생성물 (`node tools/px-to-png.mjs turtle 10`) | `turtle.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `../art-source/units/harpy-source.png` | AI 생성 도트 시트 초안 (하피, 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `warrior-sheet.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/harpy.px` | 도트 전투 스프라이트 원본 (하피, AI 초안 변환 후 검수) | `harpy-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/harpy.svg` | 생성물 (`node tools/build-units.mjs`) | `harpy.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `units/harpy-sheet.png` | 검수용 생성물 (`node tools/px-to-png.mjs harpy 10`) | `harpy.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `../art-source/units/shaman-source.png` | AI 생성 도트 시트 초안 (주술사, 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `warrior-sheet.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/shaman.px` | 도트 전투 스프라이트 원본 (주술사, AI 초안 변환 후 검수) | `shaman-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/shaman.svg` | 생성물 (`node tools/build-units.mjs`) | `shaman.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `units/shaman-sheet.png` | 검수용 생성물 (`node tools/px-to-png.mjs shaman 10`) | `shaman.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `../art-source/units/spider-source.png` | AI 생성 도트 시트 초안 (독거미, 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `warrior-sheet.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/spider.px` | 도트 전투 스프라이트 원본 (독거미, AI 초안 변환 후 검수) | `spider-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/spider.svg` | 생성물 (`node tools/build-units.mjs`) | `spider.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `units/spider-sheet.png` | 검수용 생성물 (`node tools/px-to-png.mjs spider 10`) | `spider.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `../art-source/units/swarm-source.png` | AI 생성 도트 시트 초안 (박쥐 떼, 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `warrior-sheet.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/swarm.px` | 도트 전투 스프라이트 원본 (박쥐 떼, AI 초안 변환 후 검수) | `swarm-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/swarm.svg` | 생성물 (`node tools/build-units.mjs`) | `swarm.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `units/swarm-sheet.png` | 검수용 생성물 (`node tools/px-to-png.mjs swarm 10`) | `swarm.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `../art-source/units/ogre-source.png` | AI 생성 도트 시트 초안 (오우거, 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `warrior-sheet.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/ogre.px` | 도트 전투 스프라이트 원본 (오우거, AI 초안 변환 후 검수) | `ogre-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/ogre.svg` | 생성물 (`node tools/build-units.mjs`) | `ogre.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `units/ogre-sheet.png` | 검수용 생성물 (`node tools/px-to-png.mjs ogre 10`) | `ogre.px`에서 생성 | 원본과 동일 | 2026-09-12 |
<!-- generated-monster-units:end -->

## 기존 기계식 SVG 아이콘 — 런타임 교체 진행 중

아래 SVG는 이전 제작 방식의 기록이다. 스킬 32종은 같은 ID의 PNG로 교체되었으며, 장비·상태·특성도 순차 교체한다.

<!-- generated-icons:start -->
| `skills/strike.svg` | 기본 공격 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/heavyBlow.svg` | 강타 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/flurry.svg` | 연타 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/sweep.svg` | 휩쓸기 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/pierceShot.svg` | 관통 사격 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/sunder.svg` | 갑주 파쇄 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/shieldBash.svg` | 방패 밀치기 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/ambush.svg` | 급습 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/snipe.svg` | 저격 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/venom.svg` | 독 바르기 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/venomStrong.svg` | 맹독 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/poisonArrow.svg` | 독화살 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/stagger.svg` | 흔들기 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/bolt.svg` | 마력탄 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/fireball.svg` | 화염구 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/inferno.svg` | 대화염 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/smite.svg` | 응징 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/frostbind.svg` | 얼음 결박 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/manaBurn.svg` | 마력 소진 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/mend.svg` | 치유 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/prayer.svg` | 기원 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/resurrect.svg` | 소생 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/ward.svg` | 보호막 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/cleanse.svg` | 정화 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/bless.svg` | 축복 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/warCry.svg` | 전의 고양 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/meditate.svg` | 명상 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/catchBreath.svg` | 숨 고르기 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/guardStance.svg` | 방어 자세 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/ironSkin.svg` | 굳히기 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/backstep.svg` | 물러서기 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `skills/hush.svg` | 침묵 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/swordTraining.svg` | 훈련용 검 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/swordSteel.svg` | 강철 검 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/swordLong.svg` | 장검 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/daggerPlain.svg` | 단도 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/daggerCurved.svg` | 곡도 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/daggerAssassin.svg` | 비수 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/staffOak.svg` | 참나무 지팡이 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/staffRune.svg` | 룬 지팡이 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/staffSage.svg` | 현자의 지팡이 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/relicWood.svg` | 목제 성표 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/relicSilver.svg` | 은 성표 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/relicHoly.svg` | 성유물 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/bowHunting.svg` | 사냥활 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/bowLong.svg` | 장궁 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/bowHorn.svg` | 각궁 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/armorLeather.svg` | 가죽 조끼 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/armorChain.svg` | 사슬 갑옷 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/armorPlate.svg` | 판금 갑옷 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/robeCloth.svg` | 천 로브 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/robeEnchanted.svg` | 마법 로브 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/robeArch.svg` | 대마법사 로브 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/ringSwift.svg` | 신속의 반지 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/charmGuard.svg` | 수호의 부적 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/hornVanguard.svg` | 선봉의 뿔피리 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/amuletIron.svg` | 철의 의지 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/coinLucky.svg` | 행운의 동전 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/braceletVigor.svg` | 활력 팔찌 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/necklaceMemory.svg` | 기억의 목걸이 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/pendantRegen.svg` | 재생의 펜던트 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/ironScrap.svg` | 철 조각 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/leather.svg` | 가죽 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/feather.svg` | 깃털 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/manaCrystal.svg` | 마력 결정 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/holyWater.svg` | 성수 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/bossSeal.svg` | 두목의 인장 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/beastFang.svg` | 짐승 송곳니 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/venomSac.svg` | 독주머니 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `items/ogreCore.svg` | 오우거의 핵 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `status/poison.svg` | 중독 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `status/atkUp.svg` | 공격 강화 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `status/atkDown.svg` | 공격 약화 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `status/defUp.svg` | 방어 강화 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `status/defDown.svg` | 방어 약화 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `status/spdUp.svg` | 가속 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `status/spdDown.svg` | 둔화 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `status/silence.svg` | 침묵 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `status/barrier.svg` | 보호막 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `traits/quickCast.svg` | 속영창 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `traits/bulwark.svg` | 방벽 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `traits/sniperEye.svg` | 저격안 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `traits/eager.svg` | 선봉 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `traits/extraPattern.svg` | 암기 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `traits/ironWill.svg` | 굳은 의지 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `traits/secondWind.svg` | 재기 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
| `traits/regen.svg` | 재생 도트 아이콘 | 자체 제작 (`build-icons.mjs` + `pixelate-icons.py`, 24×24 격자) | 저장소 소유 | 2026-09-13 |
<!-- generated-icons:end -->

## JRPG 도트 아이콘 방향 시안

아래 파일은 기존 게임 리소스를 입력으로 사용하지 않고, 일반적인 고전 JRPG 도트 표현만을 목표로 새로 생성한 방향 시안이다. 2026-09-13 단장 승인 후 스킬 32종 제작 기준으로 채택했다.

| 파일 | 용도 | 출처/제작 방식 | 라이선스 | 생성일 |
| --- | --- | --- | --- | --- |
| `../art-source/icon-drafts/fireball-jrpg-source.png` | 파이어볼 원본 시안 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `../art-source/icon-drafts/staffOak-jrpg-source.png` | 초급 지팡이 원본 시안 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `../art-source/icon-drafts/fireball-jrpg-32.png` | 32px 축소 검수본 | 위 원본을 Pillow 최근접 축소·알파 임계 처리 | 원본과 동일 | 2026-09-13 |
| `../art-source/icon-drafts/staffOak-jrpg-32.png` | 32px 축소 검수본 | 위 원본을 Pillow 최근접 축소·알파 임계 처리 | 원본과 동일 | 2026-09-13 |
| `../art-source/icon-drafts/jrpg-style-proof.png` | 8배 확대 비교판 | 32px 검수본 2종을 최근접 확대해 배치 | 원본과 동일 | 2026-09-13 |


<!-- jrpg-skills:start -->
## JRPG 도트 스킬 아이콘 32종

| 파일 | 종류 | 출처·제작 방식 | 라이선스 | 기록일 |
| --- | --- | --- | --- | --- |
| `../art-source/icons/skills/strike-source.png` | 기본 공격 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/strike.png` | 기본 공격 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/heavyBlow-source.png` | 강타 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/heavyBlow.png` | 강타 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/flurry-source.png` | 연타 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/flurry.png` | 연타 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/sweep-source.png` | 휩쓸기 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/sweep.png` | 휩쓸기 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/pierceShot-source.png` | 관통 사격 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/pierceShot.png` | 관통 사격 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/sunder-source.png` | 갑주 파쇄 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/sunder.png` | 갑주 파쇄 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/shieldBash-source.png` | 방패 밀치기 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/shieldBash.png` | 방패 밀치기 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/ambush-source.png` | 급습 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/ambush.png` | 급습 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/snipe-source.png` | 저격 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/snipe.png` | 저격 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/venom-source.png` | 독 바르기 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/venom.png` | 독 바르기 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/venomStrong-source.png` | 맹독 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/venomStrong.png` | 맹독 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/poisonArrow-source.png` | 독화살 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/poisonArrow.png` | 독화살 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/stagger-source.png` | 흔들기 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/stagger.png` | 흔들기 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/bolt-source.png` | 마력탄 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/bolt.png` | 마력탄 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/fireball-source.png` | 화염구 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/fireball.png` | 화염구 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/inferno-source.png` | 대화염 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/inferno.png` | 대화염 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/smite-source.png` | 응징 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/smite.png` | 응징 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/frostbind-source.png` | 얼음 결박 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/frostbind.png` | 얼음 결박 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/manaBurn-source.png` | 마력 소진 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/manaBurn.png` | 마력 소진 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/mend-source.png` | 치유 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/mend.png` | 치유 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/prayer-source.png` | 기원 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/prayer.png` | 기원 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/resurrect-source.png` | 소생 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/resurrect.png` | 소생 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/ward-source.png` | 보호막 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/ward.png` | 보호막 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/cleanse-source.png` | 정화 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/cleanse.png` | 정화 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/bless-source.png` | 축복 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/bless.png` | 축복 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/warCry-source.png` | 전의 고양 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/warCry.png` | 전의 고양 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/meditate-source.png` | 명상 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/meditate.png` | 명상 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/catchBreath-source.png` | 숨 고르기 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/catchBreath.png` | 숨 고르기 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/guardStance-source.png` | 방어 자세 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/guardStance.png` | 방어 자세 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/ironSkin-source.png` | 굳히기 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/ironSkin.png` | 굳히기 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/backstep-source.png` | 물러서기 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/backstep.png` | 물러서기 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/hush-source.png` | 침묵 AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `skills/hush.png` | 침묵 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/skills/all-skills-proof.png` | 스킬 32종 전체 검수판 | 게임용 PNG를 4배 최근접 확대해 배치 | 각 원본과 동일 | 2026-09-13 |
| `../art-source/icons/skills/physical-proof-01.png` | 물리 스킬 초기 검수판 | 게임용 PNG를 4배 최근접 확대해 배치 | 각 원본과 동일 | 2026-09-13 |
<!-- jrpg-skills:end -->
<!-- jrpg-items:start -->
## JRPG 도트 아이템·재료 아이콘

| 파일 | 종류 | 출처·제작 방식 | 라이선스 | 기록일 |
| --- | --- | --- | --- | --- |
| `../art-source/icons/items/amuletIron-source.png` | amuletIron AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/amuletIron.png` | amuletIron 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/armorChain-source.png` | armorChain AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/armorChain.png` | armorChain 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/armorLeather-source.png` | armorLeather AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/armorLeather.png` | armorLeather 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/armorPlate-source.png` | armorPlate AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/armorPlate.png` | armorPlate 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/beastFang-source.png` | beastFang AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/beastFang.png` | beastFang 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/bossSeal-source.png` | bossSeal AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/bossSeal.png` | bossSeal 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/bowHorn-source.png` | bowHorn AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/bowHorn.png` | bowHorn 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/bowHunting-source.png` | bowHunting AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/bowHunting.png` | bowHunting 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/bowLong-source.png` | bowLong AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/bowLong.png` | bowLong 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/braceletVigor-source.png` | braceletVigor AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/braceletVigor.png` | braceletVigor 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/charmGuard-source.png` | charmGuard AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/charmGuard.png` | charmGuard 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/coinLucky-source.png` | coinLucky AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/coinLucky.png` | coinLucky 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/daggerAssassin-source.png` | daggerAssassin AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/daggerAssassin.png` | daggerAssassin 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/daggerCurved-source.png` | daggerCurved AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/daggerCurved.png` | daggerCurved 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/daggerPlain-source.png` | daggerPlain AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/daggerPlain.png` | daggerPlain 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/feather-source.png` | feather AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/feather.png` | feather 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/holyWater-source.png` | holyWater AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/holyWater.png` | holyWater 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/hornVanguard-source.png` | hornVanguard AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/hornVanguard.png` | hornVanguard 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/ironScrap-source.png` | ironScrap AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/ironScrap.png` | ironScrap 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/leather-source.png` | leather AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/leather.png` | leather 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/manaCrystal-source.png` | manaCrystal AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/manaCrystal.png` | manaCrystal 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/necklaceMemory-source.png` | necklaceMemory AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/necklaceMemory.png` | necklaceMemory 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/ogreCore-source.png` | ogreCore AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/ogreCore.png` | ogreCore 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/pendantRegen-source.png` | pendantRegen AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/pendantRegen.png` | pendantRegen 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/relicHoly-source.png` | relicHoly AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/relicHoly.png` | relicHoly 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/relicSilver-source.png` | relicSilver AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/relicSilver.png` | relicSilver 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/relicWood-source.png` | relicWood AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/relicWood.png` | relicWood 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/ringSwift-source.png` | ringSwift AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/ringSwift.png` | ringSwift 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/robeArch-source.png` | robeArch AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/robeArch.png` | robeArch 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/robeCloth-source.png` | robeCloth AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/robeCloth.png` | robeCloth 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/robeEnchanted-source.png` | robeEnchanted AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/robeEnchanted.png` | robeEnchanted 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/staffOak-source.png` | staffOak AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/staffOak.png` | staffOak 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/staffRune-source.png` | staffRune AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/staffRune.png` | staffRune 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/staffSage-source.png` | staffSage AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/staffSage.png` | staffSage 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/swordLong-source.png` | swordLong AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/swordLong.png` | swordLong 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/swordSteel-source.png` | swordSteel AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/swordSteel.png` | swordSteel 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/swordTraining-source.png` | swordTraining AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/swordTraining.png` | swordTraining 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/venomSac-source.png` | venomSac AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `items/venomSac.png` | venomSac 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/items/all-items-proof.png` | 아이템·재료 전체 검수판 | 게임용 PNG를 4배 최근접 확대해 배치 | 각 원본과 동일 | 2026-09-13 |
<!-- jrpg-items:end -->

<!-- jrpg-status:start -->
## JRPG 도트 상태이상 아이콘

| 파일 | 종류 | 출처·제작 방식 | 라이선스 | 기록일 |
| --- | --- | --- | --- | --- |
| `../art-source/icons/status/atkDown-source.png` | atkDown AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `status/atkDown.png` | atkDown 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/status/atkUp-source.png` | atkUp AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `status/atkUp.png` | atkUp 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/status/barrier-source.png` | barrier AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `status/barrier.png` | barrier 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/status/defDown-source.png` | defDown AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `status/defDown.png` | defDown 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/status/defUp-source.png` | defUp AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `status/defUp.png` | defUp 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/status/poison-source.png` | poison AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `status/poison.png` | poison 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/status/silence-source.png` | silence AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `status/silence.png` | silence 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/status/spdDown-source.png` | spdDown AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `status/spdDown.png` | spdDown 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/status/spdUp-source.png` | spdUp AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `status/spdUp.png` | spdUp 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/status/all-status-proof.png` | 상태이상 전체 검수판 | 게임용 PNG를 4배 최근접 확대해 배치 | 각 원본과 동일 | 2026-09-13 |
<!-- jrpg-status:end -->

<!-- jrpg-traits:start -->
## JRPG 도트 특성 아이콘

| 파일 | 종류 | 출처·제작 방식 | 라이선스 | 기록일 |
| --- | --- | --- | --- | --- |
| `../art-source/icons/traits/bulwark-source.png` | bulwark AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `traits/bulwark.png` | bulwark 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/traits/eager-source.png` | eager AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `traits/eager.png` | eager 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/traits/extraPattern-source.png` | extraPattern AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `traits/extraPattern.png` | extraPattern 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/traits/ironWill-source.png` | ironWill AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `traits/ironWill.png` | ironWill 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/traits/quickCast-source.png` | quickCast AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `traits/quickCast.png` | quickCast 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/traits/regen-source.png` | regen AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `traits/regen.png` | regen 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/traits/secondWind-source.png` | secondWind AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `traits/secondWind.png` | secondWind 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/traits/sniperEye-source.png` | sniperEye AI 원본 | OpenAI 내장 ImageGen, 외부 이미지 입력 없음 | OpenAI 생성물 약관 적용·배포 전 법무 검토 | 2026-09-13 |
| `traits/sniperEye.png` | sniperEye 24px 게임 아이콘 | 위 AI 원본을 `tools/process-jrpg-icon.py`로 면적 평균 축소 · 10색 이하 · 외톨이 정리 (2026-09-14 제로식 규격 재변환) | 원본과 동일 | 2026-09-14 |
| `../art-source/icons/traits/all-traits-proof.png` | 특성 전체 검수판 | 게임용 PNG를 4배 최근접 확대해 배치 | 각 원본과 동일 | 2026-09-13 |
<!-- jrpg-traits:end -->
## 규약

- 파일명은 엔진 preset id / skill id / status id 와 **대소문자까지 동일한 키**를 쓴다
- 새 정적 아이콘은 투명 32×32 PNG다. AI 원본은 `art-source/icons/`에 두고 `process-jrpg-icon.py`로 최근접 축소한다
- **AI 가 그린 원본 PNG 는 `assets/` 에 두지 않는다.** `assets/` 는 Vite publicDir 이라 그 안의 모든 파일이 배포에 실린다 (원본 4장 = 5.7MB). 원본은 [`art-source/units/`](../art-source/units/) 에 두고 여기 원장에는 그대로 기록한다
- **도트 전투 스프라이트**(`units/*`)는 규격이 다르다 — 손으로 고치는 원본은 `.px` 문자 격자이고, `.svg` 는 `node tools/build-units.mjs` 가 굽는 생성물이다. `.svg` 를 직접 고치지 말 것. 48×64, 배경 없음, 부위를 `.p-*` 클래스로 나눈다. [docs/15](../docs/15_전투_스프라이트_규격.md) 참조
- 팔레트는 `manifest.json` 의 `palette` 를 따른다
