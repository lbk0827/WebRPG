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

## 원장

| 파일 | 종류 | 출처 | 라이선스 | 기록일 |
|---|---|---|---|---|
| `jobs/warrior.svg` | 직업 아이콘 | 자체 제작 (수작업 SVG) | 저장소 소유 | 2026-09-10 |
| `jobs/rogue.svg` | 직업 아이콘 | 자체 제작 (수작업 SVG) | 저장소 소유 | 2026-09-10 |
| `jobs/mage.svg` | 직업 아이콘 | 자체 제작 (수작업 SVG) | 저장소 소유 | 2026-09-10 |
| `jobs/priest.svg` | 직업 아이콘 | 자체 제작 (수작업 SVG) | 저장소 소유 | 2026-09-10 |
| `jobs/elf.svg` | 직업 아이콘 | 자체 제작 (수작업 SVG) | 저장소 소유 | 2026-09-10 |
| `monsters/goblin.svg` | 몬스터 아이콘 (잡몹) | 자체 제작 (수작업 SVG) | 저장소 소유 | 2026-09-11 |
| `monsters/beast.svg` | 몬스터 아이콘 (돌격) | 자체 제작 (수작업 SVG) | 저장소 소유 | 2026-09-11 |
| `monsters/turtle.svg` | 몬스터 아이콘 (방벽) | 자체 제작 (수작업 SVG) | 저장소 소유 | 2026-09-11 |
| `monsters/harpy.svg` | 몬스터 아이콘 (사격) | 자체 제작 (수작업 SVG) | 저장소 소유 | 2026-09-11 |
| `monsters/shaman.svg` | 몬스터 아이콘 (주술) | 자체 제작 (수작업 SVG) | 저장소 소유 | 2026-09-11 |
| `monsters/spider.svg` | 몬스터 아이콘 (독) | 자체 제작 (수작업 SVG) | 저장소 소유 | 2026-09-11 |
| `monsters/swarm.svg` | 몬스터 아이콘 (다수) | 자체 제작 (수작업 SVG) | 저장소 소유 | 2026-09-11 |
| `monsters/ogre.svg` | 몬스터 아이콘 (보스) | 자체 제작 (수작업 SVG) | 저장소 소유 | 2026-09-11 |
| `../art-source/units/warrior-source.png` | AI 생성 도트 시트 초안 (전사, 검+방패 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `rogue-source.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-11 |
| `units/warrior.px` | **도트 전투 스프라이트 원본** (전사, AI 초안 변환 후 검수) | `warrior-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-11 |
| `units/warrior.svg` | 생성물 (`node assets/build-units.mjs`) | `warrior.px`에서 생성 | 원본과 동일 | 2026-09-11 |
| `build-units.mjs` | 도구 (`.px` → `.svg` 컴파일러) | 자체 제작 | 저장소 소유 | 2026-09-11 |
| `png-to-px.mjs` | 도구 (AI 가 그린 PNG 시트 → `.px` 초안) | 자체 제작 | 저장소 소유 | 2026-09-11 |
| `px-to-png.mjs` | 도구 (`.px` → PNG 시트. AI 에게 올릴 레퍼런스) | 자체 제작 | 저장소 소유 | 2026-09-11 |
| `units/warrior-sheet.png` | 검수용 생성물 (`node assets/px-to-png.mjs warrior 10`) | `warrior.px`에서 생성 | 원본과 동일 | 2026-09-11 |
| `../art-source/units/rogue-source.png` | AI 생성 도트 시트 초안 (도적, 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `warrior-sheet.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-11 |
| `units/rogue.px` | 도트 전투 스프라이트 원본 (도적, AI 초안 변환 후 검수) | `rogue-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-11 |
| `units/rogue.svg` | 생성물 (`node assets/build-units.mjs`) | `rogue.px`에서 생성 | 원본과 동일 | 2026-09-11 |
| `units/rogue-sheet.png` | 검수용 생성물 (`node assets/px-to-png.mjs rogue 10`) | `rogue.px`에서 생성 | 원본과 동일 | 2026-09-11 |
| `../art-source/units/mage-source.png` | AI 생성 도트 시트 초안 (마법사, 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `warrior-sheet.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-11 |
| `units/mage.px` | 도트 전투 스프라이트 원본 (마법사, AI 초안 변환 후 검수) | `mage-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-11 |
| `units/mage.svg` | 생성물 (`node assets/build-units.mjs`) | `mage.px`에서 생성 | 원본과 동일 | 2026-09-11 |
| `units/mage-sheet.png` | 검수용 생성물 (`node assets/px-to-png.mjs mage 10`) | `mage.px`에서 생성 | 원본과 동일 | 2026-09-11 |
| `../art-source/units/priest-source.png` | AI 생성 도트 시트 초안 (프리스트, 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `warrior-sheet.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-11 |
| `units/priest.px` | 도트 전투 스프라이트 원본 (프리스트, AI 초안 변환 후 검수) | `priest-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-11 |
| `units/priest.svg` | 생성물 (`node assets/build-units.mjs`) | `priest.px`에서 생성 | 원본과 동일 | 2026-09-11 |
| `units/priest-sheet.png` | 검수용 생성물 (`node assets/px-to-png.mjs priest 10`) | `priest.px`에서 생성 | 원본과 동일 | 2026-09-11 |
| `../art-source/units/elf-source.png` | AI 생성 도트 시트 초안 (엘프, 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `warrior-sheet.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-11 |
| `units/elf.px` | 도트 전투 스프라이트 원본 (엘프, AI 초안 변환 후 검수) | `elf-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-11 |
| `units/elf.svg` | 생성물 (`node assets/build-units.mjs`) | `elf.px`에서 생성 | 원본과 동일 | 2026-09-11 |
| `units/elf-sheet.png` | 검수용 생성물 (`node assets/px-to-png.mjs elf 10`) | `elf.px`에서 생성 | 원본과 동일 | 2026-09-11 |
| `manifest.json` | 매니페스트 | 자체 제작 | 저장소 소유 | 2026-09-10 |
| `build-icons.mjs` | 도구 (요청서 87종 SVG 생성·매니페스트·원장 동기화) | 자체 제작 | 저장소 소유 | 2026-09-12 |
| `build-preview.mjs` | 도구 (SVG 인라인 프리뷰 생성) | 자체 제작 | 저장소 소유 | 2026-09-10 |
| `preview.html` | 생성물 (`node assets/build-preview.mjs`) | 자체 제작 | 저장소 소유 | 2026-09-10 |

<!-- generated-monster-units:start -->
| `../art-source/units/goblin-source.png` | AI 생성 도트 시트 초안 (고블린, 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `warrior-sheet.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/goblin.px` | 도트 전투 스프라이트 원본 (고블린, AI 초안 변환 후 검수) | `goblin-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/goblin.svg` | 생성물 (`node assets/build-units.mjs`) | `goblin.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `units/goblin-sheet.png` | 검수용 생성물 (`node assets/px-to-png.mjs goblin 10`) | `goblin.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `../art-source/units/beast-source.png` | AI 생성 도트 시트 초안 (들개, 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `warrior-sheet.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/beast.px` | 도트 전투 스프라이트 원본 (들개, AI 초안 변환 후 검수) | `beast-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/beast.svg` | 생성물 (`node assets/build-units.mjs`) | `beast.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `units/beast-sheet.png` | 검수용 생성물 (`node assets/px-to-png.mjs beast 10`) | `beast.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `../art-source/units/turtle-source.png` | AI 생성 도트 시트 초안 (바위 거북, 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `warrior-sheet.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/turtle.px` | 도트 전투 스프라이트 원본 (바위 거북, AI 초안 변환 후 검수) | `turtle-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/turtle.svg` | 생성물 (`node assets/build-units.mjs`) | `turtle.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `units/turtle-sheet.png` | 검수용 생성물 (`node assets/px-to-png.mjs turtle 10`) | `turtle.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `../art-source/units/harpy-source.png` | AI 생성 도트 시트 초안 (하피, 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `warrior-sheet.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/harpy.px` | 도트 전투 스프라이트 원본 (하피, AI 초안 변환 후 검수) | `harpy-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/harpy.svg` | 생성물 (`node assets/build-units.mjs`) | `harpy.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `units/harpy-sheet.png` | 검수용 생성물 (`node assets/px-to-png.mjs harpy 10`) | `harpy.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `../art-source/units/shaman-source.png` | AI 생성 도트 시트 초안 (주술사, 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `warrior-sheet.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/shaman.px` | 도트 전투 스프라이트 원본 (주술사, AI 초안 변환 후 검수) | `shaman-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/shaman.svg` | 생성물 (`node assets/build-units.mjs`) | `shaman.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `units/shaman-sheet.png` | 검수용 생성물 (`node assets/px-to-png.mjs shaman 10`) | `shaman.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `../art-source/units/spider-source.png` | AI 생성 도트 시트 초안 (독거미, 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `warrior-sheet.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/spider.px` | 도트 전투 스프라이트 원본 (독거미, AI 초안 변환 후 검수) | `spider-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/spider.svg` | 생성물 (`node assets/build-units.mjs`) | `spider.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `units/spider-sheet.png` | 검수용 생성물 (`node assets/px-to-png.mjs spider 10`) | `spider.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `../art-source/units/swarm-source.png` | AI 생성 도트 시트 초안 (박쥐 떼, 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `warrior-sheet.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/swarm.px` | 도트 전투 스프라이트 원본 (박쥐 떼, AI 초안 변환 후 검수) | `swarm-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/swarm.svg` | 생성물 (`node assets/build-units.mjs`) | `swarm.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `units/swarm-sheet.png` | 검수용 생성물 (`node assets/px-to-png.mjs swarm 10`) | `swarm.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `../art-source/units/ogre-source.png` | AI 생성 도트 시트 초안 (오우거, 3포즈) | OpenAI 내장 ImageGen — 입력은 자체 제작 `warrior-sheet.png`만 사용 | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/ogre.px` | 도트 전투 스프라이트 원본 (오우거, AI 초안 변환 후 검수) | `ogre-source.png` → `png-to-px.mjs` | OpenAI 이용 약관 적용 · 최종 사용 전 법무 검토 | 2026-09-12 |
| `units/ogre.svg` | 생성물 (`node assets/build-units.mjs`) | `ogre.px`에서 생성 | 원본과 동일 | 2026-09-12 |
| `units/ogre-sheet.png` | 검수용 생성물 (`node assets/px-to-png.mjs ogre 10`) | `ogre.px`에서 생성 | 원본과 동일 | 2026-09-12 |
<!-- generated-monster-units:end -->

<!-- generated-icons:start -->
| `skills/strike.svg` | 기본 공격 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/heavyBlow.svg` | 강타 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/flurry.svg` | 연타 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/sweep.svg` | 휩쓸기 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/pierceShot.svg` | 관통 사격 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/sunder.svg` | 갑주 파쇄 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/shieldBash.svg` | 방패 밀치기 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/ambush.svg` | 급습 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/snipe.svg` | 저격 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/venom.svg` | 독 바르기 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/venomStrong.svg` | 맹독 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/poisonArrow.svg` | 독화살 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/stagger.svg` | 흔들기 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/bolt.svg` | 마력탄 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/fireball.svg` | 화염구 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/inferno.svg` | 대화염 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/smite.svg` | 응징 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/frostbind.svg` | 얼음 결박 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/manaBurn.svg` | 마력 소진 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/mend.svg` | 치유 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/prayer.svg` | 기원 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/resurrect.svg` | 소생 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/ward.svg` | 보호막 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/cleanse.svg` | 정화 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/bless.svg` | 축복 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/warCry.svg` | 전의 고양 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/meditate.svg` | 명상 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/catchBreath.svg` | 숨 고르기 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/guardStance.svg` | 방어 자세 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/ironSkin.svg` | 굳히기 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/backstep.svg` | 물러서기 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `skills/hush.svg` | 침묵 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/swordTraining.svg` | 훈련용 검 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/swordSteel.svg` | 강철 검 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/swordLong.svg` | 장검 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/daggerPlain.svg` | 단도 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/daggerCurved.svg` | 곡도 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/daggerAssassin.svg` | 비수 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/staffOak.svg` | 참나무 지팡이 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/staffRune.svg` | 룬 지팡이 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/staffSage.svg` | 현자의 지팡이 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/relicWood.svg` | 목제 성표 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/relicSilver.svg` | 은 성표 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/relicHoly.svg` | 성유물 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/bowHunting.svg` | 사냥활 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/bowLong.svg` | 장궁 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/bowHorn.svg` | 각궁 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/armorLeather.svg` | 가죽 조끼 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/armorChain.svg` | 사슬 갑옷 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/armorPlate.svg` | 판금 갑옷 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/robeCloth.svg` | 천 로브 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/robeEnchanted.svg` | 마법 로브 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/robeArch.svg` | 대마법사 로브 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/ringSwift.svg` | 신속의 반지 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/charmGuard.svg` | 수호의 부적 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/hornVanguard.svg` | 선봉의 뿔피리 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/amuletIron.svg` | 철의 의지 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/coinLucky.svg` | 행운의 동전 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/braceletVigor.svg` | 활력 팔찌 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/necklaceMemory.svg` | 기억의 목걸이 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/pendantRegen.svg` | 재생의 펜던트 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/ironScrap.svg` | 철 조각 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/leather.svg` | 가죽 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/feather.svg` | 깃털 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/manaCrystal.svg` | 마력 결정 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/holyWater.svg` | 성수 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/bossSeal.svg` | 두목의 인장 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/beastFang.svg` | 짐승 송곳니 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/venomSac.svg` | 독주머니 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `items/ogreCore.svg` | 오우거의 핵 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `status/poison.svg` | 중독 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `status/atkUp.svg` | 공격 강화 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `status/atkDown.svg` | 공격 약화 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `status/defUp.svg` | 방어 강화 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `status/defDown.svg` | 방어 약화 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `status/spdUp.svg` | 가속 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `status/spdDown.svg` | 둔화 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `status/silence.svg` | 침묵 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `status/barrier.svg` | 보호막 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `traits/quickCast.svg` | 속영창 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `traits/bulwark.svg` | 방벽 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `traits/sniperEye.svg` | 저격안 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `traits/eager.svg` | 선봉 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `traits/extraPattern.svg` | 암기 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `traits/ironWill.svg` | 굳은 의지 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `traits/secondWind.svg` | 재기 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
| `traits/regen.svg` | 재생 아이콘 | 자체 제작 (`build-icons.mjs` 도형 정의) | 저장소 소유 | 2026-09-12 |
<!-- generated-icons:end -->

## 규약

- 파일명은 영문 소문자 + 하이픈. 엔진 preset id / skill id / status id 와 **동일한 키**를 쓴다
- SVG 는 `viewBox="0 0 128 128"`, 외곽선 `#1d1d24`, 배경 원 반지름 60 — 한 세트로 보이도록
- **AI 가 그린 원본 PNG 는 `assets/` 에 두지 않는다.** `assets/` 는 Vite publicDir 이라 그 안의 모든 파일이 배포에 실린다 (원본 4장 = 5.7MB). 원본은 [`art-source/units/`](../art-source/units/) 에 두고 여기 원장에는 그대로 기록한다
- **도트 전투 스프라이트**(`units/*`)는 규격이 다르다 — 손으로 고치는 원본은 `.px` 문자 격자이고, `.svg` 는 `node assets/build-units.mjs` 가 굽는 생성물이다. `.svg` 를 직접 고치지 말 것. 48×64, 배경 없음, 부위를 `.p-*` 클래스로 나눈다. [docs/15](../docs/15_전투_스프라이트_규격.md) 참조
- 팔레트는 `manifest.json` 의 `palette` 를 따른다
