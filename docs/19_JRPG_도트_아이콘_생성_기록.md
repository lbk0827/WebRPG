# JRPG 도트 아이콘 생성 기록

작성일: 2026-09-13  
대상: 스킬 32종, 장비·재료 38종, 상태이상 9종, 특성 8종 (총 87종)

## 1. 클린룸 기록

- 생성 도구는 OpenAI 내장 ImageGen이다.
- 사용자 첨부 이미지는 방향을 합의하기 위한 화면상 참고 자료로만 보았으며, 생성 입력이나 편집 입력으로 전달하지 않았다.
- 기존 상용 게임, 제로식, Hall of Fame의 이미지·코드·데이터를 생성 입력으로 사용하지 않았다.
- 모든 항목은 문서 14의 기능 설명을 바탕으로 독립 프롬프트를 사용해 새로 생성했다.

## 2. 공통 프롬프트

각 아이콘은 아래 공통 문장 뒤에 항목별 `Subject` 한 줄을 붙여 한 장씩 생성했다.

> Create one entirely original game icon as true hand-placed pixel art for a classic 16-bit JRPG UI. Transparent background. Centered isolated object or symbol, compact and readable at 32x32, limited cohesive palette of about 6-11 colors, crisp hard pixel clusters, dark selective outline, deliberate highlights. No frame, no badge, no tile, no text, no letters, no watermark, no gradients, no antialiasing, no smooth vector shapes, no shadow outside the object. Do not imitate or reproduce any existing commercial game asset.

종류별로 `game icon`을 `skill icon`, `inventory item icon`, `status-effect icon`, `passive-trait icon`으로 바꾸었다. 스킬은 행동과 궤적, 장비·재료는 물체 실루엣, 상태이상과 특성은 즉시 읽히는 상징을 우선했다. 항목별 소재는 [14_리소스_요청서.md](14_리소스_요청서.md)의 파일 ID와 「그릴 것」 설명을 그대로 대응시켰다.

## 3. 생성 ID

- 스킬: `strike`, `heavyBlow`, `flurry`, `sweep`, `pierceShot`, `sunder`, `shieldBash`, `ambush`, `snipe`, `venom`, `venomStrong`, `poisonArrow`, `stagger`, `bolt`, `fireball`, `inferno`, `smite`, `frostbind`, `manaBurn`, `mend`, `prayer`, `resurrect`, `ward`, `cleanse`, `bless`, `warCry`, `meditate`, `catchBreath`, `guardStance`, `ironSkin`, `backstep`, `hush`
- 장비·재료: `swordTraining`, `swordSteel`, `swordLong`, `daggerPlain`, `daggerCurved`, `daggerAssassin`, `staffOak`, `staffRune`, `staffSage`, `relicWood`, `relicSilver`, `relicHoly`, `bowHunting`, `bowLong`, `bowHorn`, `armorLeather`, `armorChain`, `armorPlate`, `robeCloth`, `robeEnchanted`, `robeArch`, `ringSwift`, `charmGuard`, `hornVanguard`, `amuletIron`, `coinLucky`, `braceletVigor`, `necklaceMemory`, `pendantRegen`, `ironScrap`, `leather`, `feather`, `manaCrystal`, `holyWater`, `bossSeal`, `beastFang`, `venomSac`, `ogreCore`
- 상태이상: `poison`, `atkUp`, `atkDown`, `defUp`, `defDown`, `spdUp`, `spdDown`, `silence`, `barrier`
- 특성: `quickCast`, `bulwark`, `sniperEye`, `eager`, `extraPattern`, `ironWill`, `secondWind`, `regen`

## 4. 변환과 검수

- AI 원본: `art-source/icons/<종류>/<id>-source.png`
- 게임용: `assets/<종류>/<id>.png`
- 변환: `python tools/process-jrpg-icon.py <원본> <출력>`
- 처리는 알파 경계로 자른 뒤 최근접 보간으로 최대 30px 안에 맞추고, 알파 임계값을 적용해 32×32 캔버스 중앙에 놓는다.
- 87종 모두 32×32, 투명 배경, 사방 최소 1px 여백, 매니페스트 경로 존재 여부를 검사했다.
- 전체 검수판은 각 폴더의 `all-*-proof.png`에 있다.

> 이 절은 2026-09-13 납품 당시 방식이다. 2026-09-14 에 24×24 로 재변환했다 → §5.

## 5. 24×24 재변환 (2026-09-14)

단장이 "스킬·장비 도트가 제로식처럼 선명하지 않다"고 지적해 원인을 재고, "제로식 수준까지"로 결정했다. 규격과 근거는 [문서 14 §1](14_리소스_요청서.md).

- **새로 생성하지 않았다.** §4 의 AI 원본(`art-source/icons/<종류>/<id>-source.png`)을 그대로 입력으로 썼다
- 변환: `python tools/process-jrpg-icon.py --all` (manifest 의 skills · items · status · traits 87종)
  1. 알파 경계로 자른다
  2. **면적 평균(BOX)** 으로 22×22 안에 맞춘다 — 최근접 표본 추출이 잡티의 원인이었다
  3. 알파 0/255 로 가른다 (임계 96)
  4. 불투명 픽셀만으로 **10색** 팔레트를 만든다 (MEDIANCUT, 디더 없음)
  5. 외톨이 픽셀을 이웃 다수 색으로 정리한다
  6. 24×24 캔버스 중앙에 놓는다
- 검사: `python tools/check-icons.py` — 87종 통과

| | 크기 | 색 수 (중앙) | 외톨이 픽셀 (중앙) |
|---|---|---|---|
| 2026-09-13 납품본 | 32×32 | 236 | 78% |
| **2026-09-14 재변환본** | **24×24** | **10** | **25%** |
| 제로식 실측 (규격 참고용) | 24×24 | 9 | 10% |

- 외톨이 경고(35% 초과) 6종: `skills/sweep` 37% · `items/swordTraining` 46% · `items/daggerPlain` 42% · `items/amuletIron` 36% · `items/bossSeal` 36% · `traits/bulwark` 38%
- 화면 표시를 24px(1배)·48px(2배)로 바꿨다 (`apps/web/src/styles.css`). 브라우저에서 상점 아이콘이 24→48px, `image-rendering: pixelated` 로 붙는 것을 확인했다
- 시험했다가 버린 것: 필터 외곽선(바깥 테두리는 가는 대각선을 덩어리로, 안쪽 테두리는 칼날·빛을 어둡게 만든다), 16색(잡티가 돌아온다), 8색(평평해진다)
- 남은 차이(손으로 찍은 외곽선·단순한 형태)는 손그림 재작업으로 채운다 → [문서 14 §9](14_리소스_요청서.md)

세부 파일별 출처와 라이선스 기록은 [assets/README.md](../assets/README.md)를 단일 원장으로 사용한다.

## 6. 1순위 최소 손질 시안 3종 (2026-09-14)

첫 21종 손질 시도는 원래 그림을 지나치게 단순한 기하학 아이콘으로 바꿔 JRPG풍을 잃었으므로 채택하지 않았다. 게임 파일 21종을 모두 §5의 재변환본으로 복원하고, 잘못된 비교판과 제작 스크립트는 작업공간에서 제거했다.

방향을 다시 확인하기 위해 `strike`, `staffOak`, `ironWill` 세 종만 최소 손질했다. `tools/retouch-priority-samples.py`는 보존한 24px 기준본을 불러와 다음 부분만 명시적 좌표로 수정한다.

- `strike`: 기존 불꽃색 검격과 명암을 유지하고 분리된 잡티 여섯 칸을 제거해 끊긴 끝부분만 잇는다.
- `staffOak`: 기존 가지 구도를 유지하고 1px 자루를 선택적으로 2~3px로 보강한다. 청록 구슬처럼 보이던 머리는 참나무 옹이색으로 고친다.
- `ironWill`: 좌우의 금속 사슬과 명암은 유지하고 중앙 금색 막대만 작은 방패·강철 주먹 상징으로 교체한다.

검수판은 실제 24px와 정확한 최근접 4배를 서로 다른 파일로 만들었다. 앞선 긴 세로 검수판처럼 앱이 비정수 축소하지 않도록 두 파일 모두 작은 크기로 제한했다.

- `art-source/icons/priority-3-proof-1x.png`
- `art-source/icons/priority-3-proof-4x.png`

세 시안이 승인되기 전에는 나머지 18종과 2순위 66종을 수정하지 않는다.

## 7. Astra 3종 선명도 보강 및 실제 웹 표시 확인 (2026-09-14)

단장의 추가 요청으로 같은 세 파일을 다시 손질했다. 새 AI 이미지는 생성하지 않았으며, 프로젝트 자체 원화·직전 시안만 사용했다. 제로식 이미지는 열거나 가져오지 않았다. §6은 직전 시안의 이력이고 현재 제작 스크립트와 PNG는 이 절의 결과다.

| ID | 이번 수정 | 불투명 색 | 외톨이 비율: 직전 → 수정 |
| --- | --- | --- | --- |
| `strike` | 기존 검격에 밝은 중심·주황 중간톤·짙은 외곽의 8색 명암 단계 적용 | 8 | 34% → 29% |
| `staffOak` | 기존 휘어진 가지 구도, 옹이·새싹·연결된 나뭇결을 명시적 문자 격자로 재배치 | 7 | 16% → 23% |
| `ironWill` | 겹친 방패/주먹을 금속 장갑 주먹 하나로 정리, 기존 사슬의 청회색 명암 보강 | 8 | 23% → 12% |

지팡이는 외톨이 수치보다 실제 크기에서 자루가 이어지고 명암이 보이는지를 우선했다. 수치만으로 그림의 완성도나 타 게임과의 품질 동등성을 판정하지 않는다.

로컬 게임 `http://localhost:5173/`의 실제 상점과 도감을 브라우저로 확인했다. 상점 참나무 지팡이는 원본 24×24 → 표시 48×48, 도감 기본 공격·굳은 의지는 원본/표시 모두 24×24였다. 세 항목 모두 PNG가 로드되고 계산된 `image-rendering`은 `pixelated`였다. 웹 CSS는 이미 이 규격이므로 수정하지 않았다. 원격 배포는 수행하지 않았다.

87종 검사 통과(기존 2순위 경고 6건 유지), 타입 검사 포함 프로덕션 빌드 통과. 이번 단계에서 변경한 게임 PNG는 세 종뿐이다.

- `astra-before/`는 이번 요청 직전 시안이며 수정 전·후 비교판은 `astra-3-proof-24-48.png`, `astra-3-proof-4x.png`이다.
- 기존 `retouch-baseline/`와 `priority-3-proof-*`는 Claude 재변환본과 현재본의 비교를 제공한다.
- 모든 경로는 `art-source/icons/` 아래에 있으며, 검수판은 최근접 정수 배율만 사용한다.

## 8. 주문서 29 우선순위 A — 주인공 전용 무기 5종 (2026-09-17)

OpenAI 내장 ImageGen에 [문서 19 §2](#2-공통-프롬프트)의 `inventory item icon` 공통문을 적용하고, [문서 21](21_주인공_캐릭터_아트_주문서.md)의 완성된 남·여 주인공 계보 스프라이트를 각 무기의 디자인 레퍼런스로 입력했다. 외부 게임·검색 이미지·금지 출처는 입력하지 않았다.

- 생성 ID: `woodenClub`, `egoSword`, `egoBlade`, `braveSword`, `darkBlade`
- 계보 표식: 몽둥이 손잡이 끝의 작은 빛이 이후 네 검의 날밑 눈 보석으로 이어진다.
- 실루엣: `egoSword`·`braveSword`는 곧은 한손검, `egoBlade`·`darkBlade`는 넓은 한쪽 날의 곡검으로 분리했다.
- 색: 스프라이트와 같이 에고 소드는 흰 강철·갈색 손잡이·푸른 눈, 에고 블레이드는 흰 강철·주황 별 날밑·푸른 눈, 용사의 검은 흰 날·금빛 날밑·청록 눈, 다크 블레이드는 검붉은 날·주황 별 날밑·붉은 눈을 사용했다.
- 변환: 각 원본에 `python tools/process-jrpg-icon.py <원본> <출력>`을 적용해 24×24, 알파 0/255, 10색 이하로 만들었다. 변환본을 손으로 다시 찍지 않았다.
- 검수판: `art-source/icons/order29-A-proof-1x.png`, `art-source/icons/order29-A-proof-4x.png`. 다섯 신규 아이콘과 기존 `items/swordLong`, `items/daggerCurved`를 밝은·어두운 바탕 두 줄에 배치했다.

## 9. 주문서 29 우선순위 B — 2차 직업·몬스터 스킬 23종 (2026-09-17)

OpenAI 내장 ImageGen에 [문서 19 §2](#2-공통-프롬프트)의 `skill icon` 공통문을 적용하고, 주문서 29 §3의 소재·분류색·구별 대상을 항목별 `Subject`로 사용했다. 기존 프로젝트 아이콘 원본은 같은 세트의 화풍과 구별 기준을 맞추는 참고 입력으로만 사용했으며 외부 게임·검색 이미지·금지 출처는 입력하지 않았다.

- 생성 ID: `bulwark`, `taunt`, `recklessSwing`, `bloodlust`, `toxicBlade`, `markPrey`, `disrupt`, `smokeBomb`, `maelstrom`, `emberfall`, `hasten`, `stasis`, `sanctuary`, `benediction`, `judgment`, `condemn`, `volley`, `entangle`, `windArrow`, `hex`, `mendChant`, `sandstorm`, `tidalWard`
- 분류색: 물리 `#b23a48`, 마법 `#2f6fd6`, 회복·보조 `#3e8e5a`, 방해 `#5b4b8a`를 배경이 아닌 물체·효과의 주조색으로 사용했다.
- 변환: 각 AI 원본에 `python tools/process-jrpg-icon.py <원본> <출력>`을 적용해 24×24, 알파 0/255, 10색 이하로 만들었다. 변환본을 손으로 다시 찍지 않았다.
- 검수판: `art-source/icons/order29-B-proof-1x.png`, `art-source/icons/order29-B-proof-4x.png`. 각 신규 아이콘 뒤에 주문서의 모든 「구별할 것」 아이콘을 놓고 밝은·어두운 바탕에서 비교했다.
- 외톨이 경고: `skills/condemn` 37%, `skills/sandstorm` 36%. 두 항목 모두 1차 후보보다 단순한 연결 면으로 재생성했으며, 1배에서 각각 사슬 감긴 금빛 성표와 모래 회오리 실루엣이 읽혀 채택했다.

## 10. 주문서 29 우선순위 C — 2차 직업 패시브 특성 9종 (2026-09-17)

OpenAI 내장 ImageGen에 [문서 19 §2](#2-공통-프롬프트)의 `passive-trait icon` 공통문을 적용하고, 주문서 29 §4의 소재와 「구별할 것」을 항목별 `Subject`로 사용했다. 기존 프로젝트 아이콘 원본은 화풍·구별 참고로만 입력했으며 외부 게임·검색 이미지·금지 출처는 입력하지 않았다.

- 생성 ID: `aegis`, `bloodRage`, `venomcraft`, `disruptor`, `foresight`, `highLiturgy`, `zeal`, `deadeye`, `thornward`
- 변환: 각 AI 원본에 `python tools/process-jrpg-icon.py <원본> <출력>`을 적용해 24×24, 알파 0/255, 10색 이하로 만들었다. 변환본을 손으로 다시 찍지 않았다.
- 검수판: `art-source/icons/order29-C-proof-1x.png`, `art-source/icons/order29-C-proof-4x.png`. 각 신규 특성과 현재 존재하는 모든 구별 대상을 밝은·어두운 바탕에서 비교했다. `items/pendantSandglass`는 D 묶음 제작 대상이므로 D 검수판에서 `foresight`와 추가 비교한다.
- 신규 9종은 외톨이 픽셀 35% 이하이며 추가 경고가 없다.

## 11. 주문서 29 우선순위 D — 4·5등급 장비·재료·오의 31종 (2026-09-17)

OpenAI 내장 ImageGen에 [문서 19 §2](#2-공통-프롬프트)의 `inventory item icon`·`skill icon` 공통문과 [문서 14 §1](14_리소스_요청서.md)의 JRPG 필수 다섯 요소를 적용했다. 주문서 29 §5의 4등급 재질 표식(태양석·조수·룬), 5등급 별 표식, 오의의 윗단계 짝을 항목별 `Subject`로 사용했다. 기존 프로젝트 원본은 같은 세트의 화풍·등급 상승·구별 참고로만 입력했고 외부 게임·검색 이미지·금지 출처는 입력하지 않았다.

- 장비 생성 ID: `swordRune`, `swordStar`, `daggerSand`, `daggerShadow`, `staffTide`, `staffStar`, `relicTide`, `relicStar`, `bowSand`, `bowStar`, `armorRune`, `armorStar`, `robeTide`, `robeStar`, `pendantSandglass`, `crownStar`
- 재료 생성 ID: `sunstone`, `tideScale`, `warBanner`, `starShard`, `kingSigil`
- 오의 생성 ID: `fortress`, `lastStand`, `plague`, `blackout`, `starfall`, `rewind`, `miracle`, `verdict`, `pinpoint`, `rootbind`
- 변환: 각 AI 원본에 `python tools/process-jrpg-icon.py <원본> <출력>`을 적용해 24×24, 알파 0/255, 10색 이하로 만들었다. 변환본을 손으로 다시 찍지 않았다.
- 검수판: `art-source/icons/order29-D-proof-1x.png`, `art-source/icons/order29-D-proof-4x.png`. 장비는 같은 계열의 3등급·4등급을, 오의는 주문서의 「윗단계 짝」을, `pendantSandglass`와 `kingSigil`은 명시된 구별 대상을 밝은·어두운 바탕에서 비교했다.
- 신규 외톨이 경고(35% 초과): `skills/blackout` 45%, `skills/rootbind` 39%, `items/relicStar` 43%, `items/robeStar` 36%, `items/crownStar` 57%, `items/warBanner` 39%, `items/kingSigil` 38%. 모두 검사 실패 조건은 아니며, 1배 검수판에서 각각 등불·굵은 뿌리·성유물함·별 로브·금관·천 휘장·왕관 인장 실루엣이 구별되어 채택했다.
