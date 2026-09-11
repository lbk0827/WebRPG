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
  bossSeal: { id: 'bossSeal', label: '두목의 인장', blurb: '도적 두목이 갖고 있던 것. 드물다.' },
}

// ───────────────────────────── 강화 (§3.5)

export const REFINE_MAX = 5
/** 현재 단계 → 다음 단계 성공률 %. 실패해도 파괴·하락 없음 */
export const REFINE_RATE: number[] = [100, 100, 80, 60, 40]
/** 강화 단계당 공격·방어 고정치 +10% */
export const REFINE_PCT_PER_LEVEL = 10
export const REFINE_MATERIAL = 'ironScrap'

export interface RefineCost {
  gold: number
  material: string
  qty: number
}

/** 강화비: 장비 값의 15% × (단계+1), 철 조각 (단계+1) */
export function refineCost(def: ItemDef, level: number): RefineCost {
  return { gold: Math.floor((def.price * 15) / 100) * (level + 1), material: REFINE_MATERIAL, qty: level + 1 }
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
]

export const RECIPE_BY_ID: Record<string, Recipe> = Object.fromEntries(RECIPES.map((r) => [r.id, r]))

/** 제작 시 특성 부여 확률 % */
export const CRAFT_TRAIT_PCT = 30
/** 제작 특성 후보 — 수칙과 맞물리는 것만 (traits.ts 전부) */
export const CRAFT_TRAIT_POOL: string[] = Object.keys(TRAITS)

/**
 * 제작 결과의 보너스 특성. 30% 로 후보 중 하나. 장비 자체 특성과 같으면 다시 뽑지 않고 없음 처리 (단순함 우선).
 * rng 를 소비한다 (확률 1회 + 당첨 시 1회).
 */
export function rollCraftTrait(itemId: string, rng: Rng): string | undefined {
  if (rng.pct() >= CRAFT_TRAIT_PCT) return undefined
  const pick = CRAFT_TRAIT_POOL[rng.int(CRAFT_TRAIT_POOL.length)]
  return ITEMS[itemId]?.trait === pick ? undefined : pick
}

export function canCraft(recipe: Recipe, materials: Record<string, number>, gold: number): boolean {
  if (gold < recipe.gold) return false
  return recipe.materials.every((m) => (materials[m.id] ?? 0) >= m.qty)
}
