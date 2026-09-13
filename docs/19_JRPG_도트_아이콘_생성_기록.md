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

세부 파일별 출처와 라이선스 기록은 [assets/README.md](../assets/README.md)를 단일 원장으로 사용한다.
