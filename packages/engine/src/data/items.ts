// 장비 (M2-4a, docs/07 §3.5). 슬롯 3: 무기 · 방어구 · 장신구. 장비 = 가산치 + 특성 0~1개.
// 무기는 직업별 타입 화이트리스트. 아이템 인스턴스는 { uid, itemId, refine } — 강화(refine)는 M2-4b 에서 효과가 붙는다.
import type { Stats, WeaponType } from '../types'
import { TRAITS } from './traits'

export type GearSlot = 'weapon' | 'armor' | 'trinket'

export interface ItemDef {
  id: string
  label: string
  slot: GearSlot
  /** 무기만. 직업 화이트리스트(JOB_WEAPONS)와 대조 */
  weaponType?: WeaponType
  /** 상점 등급 — 1 은 처음부터, 2 는 가도 해금 후, 3 은 폐허 요새 해금 후 */
  tier: 1 | 2 | 3
  price: number
  /** 공격 가산 [물리, 마법] */
  atk?: [number, number]
  /** 방어 가산 [물리%, 물리 고정, 마법%, 마법 고정] */
  def?: [number, number, number, number]
  /** 스탯 가산 (성장 뒤에 더한다, 상한 없음) */
  stats?: Partial<Stats>
  /** 특성 0~1 (data/traits.ts) */
  trait?: string
  blurb: string
}

/** 직업별 무기 타입 */
export const JOB_WEAPONS: Record<string, WeaponType[]> = {
  warrior: ['sword'],
  rogue: ['dagger'],
  mage: ['staff'],
  priest: ['relic'],
  elf: ['bow'],
}

export const WEAPON_TYPE_LABEL: Record<WeaponType, string> = { sword: '검', dagger: '단검', staff: '지팡이', relic: '성물', bow: '활', none: '—' }
export const SLOT_LABEL: Record<GearSlot, string> = { weapon: '무기', armor: '방어구', trinket: '장신구' }

const list: ItemDef[] = [
  // ── 무기 (직업별 3등급)
  { id: 'swordTraining', label: '훈련용 검', slot: 'weapon', weaponType: 'sword', tier: 1, price: 60, atk: [8, 0], blurb: '날이 무디지만 없는 것보다 낫다.' },
  { id: 'swordSteel', label: '강철 검', slot: 'weapon', weaponType: 'sword', tier: 2, price: 220, atk: [18, 0], blurb: '가도의 대장간 물건.' },
  { id: 'swordLong', label: '장검', slot: 'weapon', weaponType: 'sword', tier: 3, price: 600, atk: [30, 0], blurb: '요새 무기고에서 나온 것.' },
  { id: 'daggerPlain', label: '단도', slot: 'weapon', weaponType: 'dagger', tier: 1, price: 60, atk: [7, 0], blurb: '작고 빠르다.' },
  { id: 'daggerCurved', label: '곡도', slot: 'weapon', weaponType: 'dagger', tier: 2, price: 220, atk: [16, 0], blurb: '휘어진 날. 찌르기보다 긋기.' },
  { id: 'daggerAssassin', label: '비수', slot: 'weapon', weaponType: 'dagger', tier: 3, price: 600, atk: [28, 0], blurb: '소매 안에 들어간다.' },
  { id: 'staffOak', label: '참나무 지팡이', slot: 'weapon', weaponType: 'staff', tier: 1, price: 60, atk: [0, 8], blurb: '마력을 모으는 데 쓴다. 때리는 데는 아니다.' },
  { id: 'staffRune', label: '룬 지팡이', slot: 'weapon', weaponType: 'staff', tier: 2, price: 220, atk: [0, 18], blurb: '문양이 희미하게 빛난다.' },
  { id: 'staffSage', label: '현자의 지팡이', slot: 'weapon', weaponType: 'staff', tier: 3, price: 600, atk: [0, 30], blurb: '누가 현자였는지는 아무도 모른다.' },
  { id: 'relicWood', label: '목제 성표', slot: 'weapon', weaponType: 'relic', tier: 1, price: 60, atk: [0, 6], def: [0, 0, 0, 3], blurb: '기도할 때 쥔다.' },
  { id: 'relicSilver', label: '은 성표', slot: 'weapon', weaponType: 'relic', tier: 2, price: 220, atk: [0, 14], def: [0, 0, 0, 6], blurb: '은은 악한 것을 싫어한다고 한다.' },
  { id: 'relicHoly', label: '성유물', slot: 'weapon', weaponType: 'relic', tier: 3, price: 600, atk: [0, 26], def: [0, 0, 5, 8], blurb: '무엇의 유물인지는 묻지 않는 게 좋다.' },
  { id: 'bowHunting', label: '사냥활', slot: 'weapon', weaponType: 'bow', tier: 1, price: 60, atk: [8, 0], blurb: '토끼용. 사람에게도 된다.' },
  { id: 'bowLong', label: '장궁', slot: 'weapon', weaponType: 'bow', tier: 2, price: 220, atk: [18, 0], blurb: '키만 한 활.' },
  { id: 'bowHorn', label: '각궁', slot: 'weapon', weaponType: 'bow', tier: 3, price: 650, atk: [28, 0], trait: 'sniperEye', blurb: '뿔을 겹쳐 만든 활. 후열이 잘 보인다.' },

  // ── 방어구 (전열용 갑옷 / 후열용 로브)
  { id: 'armorLeather', label: '가죽 조끼', slot: 'armor', tier: 1, price: 50, def: [0, 4, 0, 1], blurb: '없는 것보다는.' },
  { id: 'armorChain', label: '사슬 갑옷', slot: 'armor', tier: 2, price: 200, def: [5, 10, 0, 3], blurb: '무겁지만 칼이 안 들어간다.' },
  { id: 'armorPlate', label: '판금 갑옷', slot: 'armor', tier: 3, price: 550, def: [10, 18, 0, 5], trait: 'bulwark', blurb: '엄호하는 사람이 입는 것.' },
  { id: 'robeCloth', label: '천 로브', slot: 'armor', tier: 1, price: 50, def: [0, 1, 0, 6], blurb: '따뜻하다. 방어는 마법에만.' },
  { id: 'robeEnchanted', label: '마법 로브', slot: 'armor', tier: 2, price: 200, def: [0, 3, 5, 12], stats: { maxSp: 15 }, blurb: '주머니에 마력이 조금 고여 있다.' },
  { id: 'robeArch', label: '대마법사 로브', slot: 'armor', tier: 3, price: 550, def: [0, 5, 10, 20], stats: { maxSp: 30 }, trait: 'quickCast', blurb: '입으면 주문이 빨라진다. 이유는 모른다.' },

  // ── 장신구 (특성이 본체. 2등급부터)
  { id: 'ringSwift', label: '신속의 반지', slot: 'trinket', tier: 2, price: 300, trait: 'quickCast', blurb: '시전 준비가 짧아진다. 끊기꾼 앞에서 쓸모.' },
  { id: 'charmGuard', label: '수호의 부적', slot: 'trinket', tier: 2, price: 300, trait: 'bulwark', blurb: '엄호할 때 덜 아프다.' },
  { id: 'hornVanguard', label: '선봉의 뿔피리', slot: 'trinket', tier: 2, price: 350, trait: 'eager', blurb: '전투 시작 게이지 +300. 첫 수를 먼저 둔다.' },
  { id: 'amuletIron', label: '철의 의지', slot: 'trinket', tier: 2, price: 300, stats: { luk: 10 }, trait: 'ironWill', blurb: '상태이상이 잘 안 먹는다.' },
  { id: 'coinLucky', label: '행운의 동전', slot: 'trinket', tier: 1, price: 120, stats: { luk: 12 }, blurb: '운 +12. 그뿐이다.' },
  { id: 'braceletVigor', label: '활력 팔찌', slot: 'trinket', tier: 1, price: 120, stats: { maxHp: 60 }, blurb: 'HP +60.' },
  { id: 'necklaceMemory', label: '기억의 목걸이', slot: 'trinket', tier: 3, price: 700, trait: 'extraPattern', blurb: '패턴 칸 +1. 이 게임에서 가장 비싼 한 칸.' },
  { id: 'pendantRegen', label: '재생의 펜던트', slot: 'trinket', tier: 3, price: 650, trait: 'regen', blurb: '매 차례 조금씩 아문다.' },
]

export const ITEMS: Record<string, ItemDef> = Object.fromEntries(list.map((i) => [i.id, i]))
export const ITEM_LIST: ItemDef[] = list

/** 판매가 = 구매가의 20% (§3.7) */
export const SELL_PCT = 20
export const sellPrice = (def: ItemDef): number => Math.floor((def.price * SELL_PCT) / 100)

/** 이 직업이 이 아이템을 낄 수 있는가 (무기는 타입, 나머지는 자유) */
export function canEquip(job: string, def: ItemDef): boolean {
  if (def.slot !== 'weapon') return true
  return !!def.weaponType && (JOB_WEAPONS[job] ?? []).includes(def.weaponType)
}

export interface ItemInstance {
  uid: string
  itemId: string
  /** 강화 단계 0~5 (M2-4b). 공격·방어 고정치 +10%/단계 */
  refine: number
  /** 제작 시 붙은 보너스 특성 (M2-4b, 30%) */
  trait?: string
}

export interface GearSummary {
  atk: [number, number]
  def: [number, number, number, number]
  stats: Partial<Stats>
  traits: string[]
  weapon: WeaponType
}

/** 강화 반영 가산치. 공격 둘과 방어 고정치(1·3번)만 오른다 — % 와 스탯은 그대로 */
export function refinedNumbers(def: ItemDef, refine: number): { atk: [number, number]; def: [number, number, number, number] } {
  const mult = 100 + 10 * Math.max(0, refine)
  const up = (v: number) => Math.floor((v * mult) / 100)
  const atk: [number, number] = def.atk ? [up(def.atk[0]), up(def.atk[1])] : [0, 0]
  const d: [number, number, number, number] = def.def ? [def.def[0], up(def.def[1]), def.def[2], up(def.def[3])] : [0, 0, 0, 0]
  return { atk, def: d }
}

/** 착용 장비 합산 — CharSetup.bonus / traits / weapon 으로 들어간다. 인스턴스의 강화·보너스 특성 포함 */
export function summarizeGear(items: (ItemInstance | undefined)[]): GearSummary {
  const out: GearSummary = { atk: [0, 0], def: [0, 0, 0, 0], stats: {}, traits: [], weapon: 'none' }
  for (const it of items) {
    if (!it) continue
    const d = ITEMS[it.itemId]
    if (!d) continue
    const r = refinedNumbers(d, it.refine)
    out.atk[0] += r.atk[0]
    out.atk[1] += r.atk[1]
    for (let i = 0; i < 4; i++) out.def[i] += r.def[i]
    if (d.stats) for (const k of Object.keys(d.stats) as (keyof Stats)[]) out.stats[k] = (out.stats[k] ?? 0) + (d.stats[k] ?? 0)
    for (const t of [d.trait, it.trait]) if (t && TRAITS[t] && !out.traits.includes(t)) out.traits.push(t)
    if (d.slot === 'weapon' && d.weaponType) out.weapon = d.weaponType
  }
  return out
}

export function applyGearStats(stats: Stats, extra: Partial<Stats>): Stats {
  const s = { ...stats }
  for (const k of Object.keys(extra) as (keyof Stats)[]) s[k] = Math.max(1, s[k] + (extra[k] ?? 0))
  return s
}
