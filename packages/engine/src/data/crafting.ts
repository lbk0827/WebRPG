// 공방 (M2-4b, docs/07 §3.5 강화 · §3.6 제작). 재료는 의뢰 드롭, 강화는 금 + 공통 재료, 제작은 레시피(데이터).
// 제작 시 특성 30% 는 M2 의 유일한 "뽑기" — 유료 재화와 절대 연결하지 않는다 (ADR 3.3).
import type { Rng } from '../rng'
import { ITEMS, type ItemDef } from './items'
import { TRAITS } from './traits'

export interface MaterialDef {
  id: string
  label: string
  blurb: string
}

export const MATERIALS: Record<string, MaterialDef> = {
  ironScrap: { id: 'ironScrap', label: '철 조각', blurb: '부러진 무기, 찌그러진 갑옷. 녹이면 다시 쇠다.' },
  leather: { id: 'leather', label: '가죽', blurb: '누구 것이었는지는 묻지 않는다.' },
  feather: { id: 'feather', label: '깃털', blurb: '화살 깃으로 쓴다. 궁수들이 떨어뜨린다.' },
  manaCrystal: { id: 'manaCrystal', label: '마력 결정', blurb: '마법사가 쓰러질 때 지팡이 끝에 맺힌다.' },
  holyWater: { id: 'holyWater', label: '성수', blurb: '프리스트가 들고 다니던 병. 반쯤 남았다.' },
  bossSeal: { id: 'bossSeal', label: '두목의 인장', blurb: '두목 급이 갖고 있던 것. 도적 두목·고블린 족장·심연의 오우거. 숨은 상대를 만나야 나온다.' },
  // M2-5a 짐승·괴물 지역
  beastFang: { id: 'beastFang', label: '짐승 송곳니', blurb: '들개·박쥐의 이빨, 거미의 독니, 오우거의 어금니. 갈면 날이 선다.' },
  venomSac: { id: 'venomSac', label: '독주머니', blurb: '거미 배에서 터뜨리지 않고 꺼내야 값이 나간다.' },
  ogreCore: { id: 'ogreCore', label: '오우거의 핵', blurb: '심장 자리에 돌처럼 굳은 것. 아직 따뜻하다.' },
  // 만렙 50 확장 (docs/22 §6) — 지역마다 하나, 그리고 숨은 보스의 희귀 재료 하나
  sunstone: { id: 'sunstone', label: '태양석', blurb: '모래바람 황야의 돌. 해가 진 뒤에도 뜨겁다.' },
  tideScale: { id: 'tideScale', label: '조수 비늘', blurb: '가라앉은 신전의 것들이 떨어뜨린다. 마르지 않는다.' },
  warBanner: { id: 'warBanner', label: '전쟁 휘장', blurb: '용병왕의 전장에서 쓰러진 자들의 휘장. 5등급 무기의 손잡이에 감는다.' },
  starShard: { id: 'starShard', label: '별조각', blurb: '별이 떨어진 탑에서 나온다. 손바닥 위에서 희미하게 빛난다.' },
  kingSigil: { id: 'kingSigil', label: '왕의 증표', blurb: '숨은 보스만 지니고 있다. 5등급을 만들 때 하나씩 든다.' },
}

// ───────────────────────────── 강화 (§3.5)

export const REFINE_MAX = 5
/**
 * 현재 단계 → 다음 단계 성공률 %. 실패해도 파괴·하락 없음.
 * +1~+3 은 확정, 운은 +4·+5 에만 — HOF 의 모양이다: 누구나 조금은 강화하고, 욕심낼 때만 운이 걸린다 (2026-09-14 단장 결정)
 */
export const REFINE_RATE: number[] = [100, 100, 100, 60, 40]
/** 강화 단계당 공격·방어 고정치 +10% */
export const REFINE_PCT_PER_LEVEL = 10

export interface RefineCost {
  gold: number
}

/**
 * 강화비: 장비 값의 15% × (단계+1), **금만**.
 * 전에는 철 조각 (단계+1) 도 들었다. 재료가 경제의 병목이라 한 아이템 0→5 가 철 조각 27~36판이었고, 아무도 강화하지 않았다 (docs/18 §15).
 * 금만 들면 3등급 한 벌 0→5 가 기대 약 2,300금 — 무너진 성채 6~7판이다 (2026-09-14 단장 결정, docs/18 §18)
 */
export function refineCost(def: ItemDef, level: number): RefineCost {
  return { gold: Math.floor((def.price * 15) / 100) * (level + 1) }
}

export const refineRate = (level: number): number => (level >= REFINE_MAX ? 0 : REFINE_RATE[level])

/** 성공이면 true. rng 를 소비한다 */
export function tryRefine(level: number, rng: Rng): boolean {
  const rate = refineRate(level)
  if (rate <= 0) return false
  return rng.pct() < rate
}

/** 강화 배율 (백분율). +3 → 130 */
export const refineMult = (level: number): number => 100 + REFINE_PCT_PER_LEVEL * level

// ───────────────────────────── 제작 (§3.6)

export interface Recipe {
  id: string
  itemId: string
  materials: { id: string; qty: number }[]
  gold: number
}

export const RECIPES: Recipe[] = [
  { id: 'rSwordSteel', itemId: 'swordSteel', materials: [{ id: 'ironScrap', qty: 4 }, { id: 'leather', qty: 1 }], gold: 80 },
  { id: 'rDaggerCurved', itemId: 'daggerCurved', materials: [{ id: 'ironScrap', qty: 3 }, { id: 'leather', qty: 2 }], gold: 80 },
  { id: 'rStaffRune', itemId: 'staffRune', materials: [{ id: 'manaCrystal', qty: 3 }, { id: 'leather', qty: 1 }], gold: 80 },
  { id: 'rRelicSilver', itemId: 'relicSilver', materials: [{ id: 'holyWater', qty: 2 }, { id: 'ironScrap', qty: 2 }], gold: 80 },
  { id: 'rBowLong', itemId: 'bowLong', materials: [{ id: 'feather', qty: 4 }, { id: 'leather', qty: 2 }], gold: 80 },
  { id: 'rArmorChain', itemId: 'armorChain', materials: [{ id: 'ironScrap', qty: 5 }, { id: 'leather', qty: 3 }], gold: 60 },
  { id: 'rRobeEnchanted', itemId: 'robeEnchanted', materials: [{ id: 'manaCrystal', qty: 3 }, { id: 'leather', qty: 2 }], gold: 60 },
  { id: 'rNecklaceMemory', itemId: 'necklaceMemory', materials: [{ id: 'manaCrystal', qty: 6 }, { id: 'holyWater', qty: 3 }, { id: 'bossSeal', qty: 1 }], gold: 200 },
  // ── 3등급 (M2-5a 재료 필요)
  { id: 'rSwordLong', itemId: 'swordLong', materials: [{ id: 'ironScrap', qty: 8 }, { id: 'beastFang', qty: 4 }, { id: 'ogreCore', qty: 1 }], gold: 260 },
  { id: 'rDaggerAssassin', itemId: 'daggerAssassin', materials: [{ id: 'venomSac', qty: 5 }, { id: 'beastFang', qty: 4 }, { id: 'leather', qty: 4 }], gold: 260 },
  { id: 'rBowHorn', itemId: 'bowHorn', materials: [{ id: 'feather', qty: 8 }, { id: 'beastFang', qty: 5 }, { id: 'leather', qty: 4 }], gold: 280 },
  { id: 'rArmorPlate', itemId: 'armorPlate', materials: [{ id: 'ironScrap', qty: 10 }, { id: 'ogreCore', qty: 2 }], gold: 240 },
  { id: 'rPendantRegen', itemId: 'pendantRegen', materials: [{ id: 'holyWater', qty: 5 }, { id: 'venomSac', qty: 3 }, { id: 'manaCrystal', qty: 4 }], gold: 280 },
  // 2026-09-13 단장 결정: 3등급은 **제작으로만** 얻는다. 상점은 기본품(1·2등급)만 판다.
  // 그래서 제작법이 없던 3등급 셋을 채웠다 — 없으면 마법사·프리스트가 3등급 무기를 아예 못 든다
  { id: 'rStaffSage', itemId: 'staffSage', materials: [{ id: 'manaCrystal', qty: 8 }, { id: 'holyWater', qty: 3 }, { id: 'ogreCore', qty: 1 }], gold: 260 },
  { id: 'rRelicHoly', itemId: 'relicHoly', materials: [{ id: 'holyWater', qty: 8 }, { id: 'manaCrystal', qty: 4 }, { id: 'bossSeal', qty: 1 }], gold: 280 },
  { id: 'rRobeArch', itemId: 'robeArch', materials: [{ id: 'manaCrystal', qty: 7 }, { id: 'leather', qty: 4 }, { id: 'venomSac', qty: 2 }], gold: 240 },
  // ── 4등급 (만렙 50 확장, docs/22 §6) — 새 지역 재료 + 기존 재료를 넉넉히
  { id: 'rSwordRune', itemId: 'swordRune', materials: [{ id: 'sunstone', qty: 6 }, { id: 'ironScrap', qty: 12 }, { id: 'ogreCore', qty: 2 }], gold: 500 },
  { id: 'rDaggerSand', itemId: 'daggerSand', materials: [{ id: 'sunstone', qty: 6 }, { id: 'venomSac', qty: 6 }, { id: 'beastFang', qty: 4 }], gold: 500 },
  { id: 'rStaffTide', itemId: 'staffTide', materials: [{ id: 'tideScale', qty: 6 }, { id: 'manaCrystal', qty: 10 }], gold: 500 },
  { id: 'rRelicTide', itemId: 'relicTide', materials: [{ id: 'tideScale', qty: 6 }, { id: 'holyWater', qty: 8 }], gold: 500 },
  { id: 'rBowSand', itemId: 'bowSand', materials: [{ id: 'sunstone', qty: 6 }, { id: 'feather', qty: 12 }, { id: 'beastFang', qty: 4 }], gold: 500 },
  { id: 'rArmorRune', itemId: 'armorRune', materials: [{ id: 'sunstone', qty: 4 }, { id: 'tideScale', qty: 4 }, { id: 'ironScrap', qty: 14 }], gold: 480 },
  { id: 'rRobeTide', itemId: 'robeTide', materials: [{ id: 'tideScale', qty: 6 }, { id: 'manaCrystal', qty: 8 }, { id: 'leather', qty: 6 }], gold: 480 },
  { id: 'rPendantSandglass', itemId: 'pendantSandglass', materials: [{ id: 'sunstone', qty: 5 }, { id: 'tideScale', qty: 3 }, { id: 'manaCrystal', qty: 6 }], gold: 520 },
  // ── 5등급 — 왕의 증표(숨은 보스 · 모험 확정 보상) 하나씩
  { id: 'rSwordStar', itemId: 'swordStar', materials: [{ id: 'starShard', qty: 8 }, { id: 'warBanner', qty: 6 }, { id: 'kingSigil', qty: 1 }], gold: 1200 },
  { id: 'rDaggerShadow', itemId: 'daggerShadow', materials: [{ id: 'warBanner', qty: 8 }, { id: 'venomSac', qty: 8 }, { id: 'kingSigil', qty: 1 }], gold: 1200 },
  { id: 'rStaffStar', itemId: 'staffStar', materials: [{ id: 'starShard', qty: 10 }, { id: 'manaCrystal', qty: 10 }, { id: 'kingSigil', qty: 1 }], gold: 1200 },
  { id: 'rRelicStar', itemId: 'relicStar', materials: [{ id: 'starShard', qty: 8 }, { id: 'holyWater', qty: 10 }, { id: 'kingSigil', qty: 1 }], gold: 1200 },
  { id: 'rBowStar', itemId: 'bowStar', materials: [{ id: 'starShard', qty: 8 }, { id: 'feather', qty: 14 }, { id: 'kingSigil', qty: 1 }], gold: 1200 },
  { id: 'rArmorStar', itemId: 'armorStar', materials: [{ id: 'warBanner', qty: 8 }, { id: 'starShard', qty: 6 }, { id: 'kingSigil', qty: 1 }], gold: 1100 },
  { id: 'rRobeStar', itemId: 'robeStar', materials: [{ id: 'starShard', qty: 8 }, { id: 'tideScale', qty: 6 }, { id: 'kingSigil', qty: 1 }], gold: 1100 },
  { id: 'rCrownStar', itemId: 'crownStar', materials: [{ id: 'starShard', qty: 10 }, { id: 'warBanner', qty: 6 }, { id: 'kingSigil', qty: 2 }], gold: 1300 },
]

export const RECIPE_BY_ID: Record<string, Recipe> = Object.fromEntries(RECIPES.map((r) => [r.id, r]))

/** 제작 시 특성 부여 확률 % */
export const CRAFT_TRAIT_PCT = 30
/** 제작 특성 후보 — 수칙과 맞물리는 것만 (traits.ts 전부) */
export const CRAFT_TRAIT_POOL: string[] = Object.keys(TRAITS)

/** 운이 제작 특성 확률에 주는 보정 %p — 운 5 마다 +1%p, 최대 +25%p */
export const craftLukBonusPct = (luk: number): number => Math.min(25, Math.floor(Math.max(0, luk) / 5))

/**
 * 제작 결과의 보너스 특성. 기본 30% 로 후보 중 하나. 장비 자체 특성과 같으면 다시 뽑지 않고 없음 처리 (단순함 우선).
 * rng 를 소비한다 (확률 1회 + 당첨 시 1회) — `luk` 은 문턱만 올리므로 소비 횟수가 그대로다.
 *
 * `luk` 은 **단원 중 가장 높은 운**. 대장간에 운 좋은 단원을 붙이는 셈이다 (docs/07 §5).
 */
export function rollCraftTrait(itemId: string, rng: Rng, luk = 0): string | undefined {
  if (rng.pct() >= CRAFT_TRAIT_PCT + craftLukBonusPct(luk)) return undefined
  const pick = CRAFT_TRAIT_POOL[rng.int(CRAFT_TRAIT_POOL.length)]
  return ITEMS[itemId]?.trait === pick ? undefined : pick
}

export function canCraft(recipe: Recipe, materials: Record<string, number>, gold: number): boolean {
  if (gold < recipe.gold) return false
  return recipe.materials.every((m) => (materials[m.id] ?? 0) >= m.qty)
}
