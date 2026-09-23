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
  /** 등급 — 상점은 1·2 만 판다. 3 은 제작 전용, 4·5 는 만렙 50 확장의 제작 전용 (docs/22 §6) */
  tier: 1 | 2 | 3 | 4 | 5
  price: number
  /** 공격 가산 [물리, 마법] */
  atk?: [number, number]
  /** 방어 가산 [물리%, 물리 고정, 마법%, 마법 고정] */
  def?: [number, number, number, number]
  /** 스탯 가산 (성장 뒤에 더한다, 상한 없음) */
  stats?: Partial<Stats>
  /** 특성 0~1 (data/traits.ts) */
  trait?: string
  /**
   * 이 장비가 쥐여 주는 **무기 스킬** (docs/31). 든 동안만 쓸 수 있다 —
   * 스킬 쪽에도 `requires.weaponType` 이 걸려 있어 다른 무기로 바꾸면 그 줄은 건너뛴다.
   * 주인공 무기는 벗을 수 없으니 사실상 계보의 스킬이고, 진화해도 앞 단계 것을 잃지 않는다 (에고의 기억)
   */
  skills?: string[]
  /** 주인공 전용 (docs/20). 상점·제작·판매·해제 없음 — 전직하면 진화한다. 강화(금)는 된다 */
  bound?: true
  blurb: string
}

/** 직업별 무기 타입 */
export const JOB_WEAPONS: Record<string, WeaponType[]> = {
  warrior: ['sword'],
  rogue: ['dagger'],
  mage: ['staff'],
  priest: ['relic'],
  elf: ['bow'],
  // 주인공 — 전용 무기만 든다. 나무 몽둥이로 시작해 전직할 때 진화한다 (docs/20)
  adventurer: ['ego'],
}

export const WEAPON_TYPE_LABEL: Record<WeaponType, string> = { sword: '검', dagger: '단검', staff: '지팡이', relic: '성물', bow: '활', ego: '주인공 전용', none: '—' }
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
  // 주인공 전용 무기 (2026-09-14 단장 기획, docs/20). 사거나 만들 수 없고 벗을 수 없다 — 전직하면 진화한다. 강화(금)는 된다.
  // 모험가 나무 몽둥이 →(15) 길드원 에고 소드 / 떠돌이 에고 블레이드 →(30) 용사의 검 / 다크 블레이드.
  // 수치는 같은 무렵의 무기보다 조금 높다 — 바꿔 낄 수 없고 제작 보너스 특성도 붙지 않는다. price 는 강화비 계산에만 쓴다
  { id: 'woodenClub', label: '나무 몽둥이', slot: 'weapon', weaponType: 'ego', tier: 1, price: 60, atk: [9, 0], skills: ['headKnock'], bound: true, blurb: '모험을 떠나던 날 주운 몽둥이. 이상하게 손에 붙는다.' },
  { id: 'egoSword', label: '에고 소드', slot: 'weapon', weaponType: 'ego', tier: 2, price: 220, atk: [22, 0], def: [0, 5, 0, 0], stats: { maxHp: 60 }, skills: ['headKnock', 'rally', 'wedge'], bound: true, blurb: '길드에 들던 날 몽둥이가 검이 되었다. 가끔 말을 건다.' },
  { id: 'egoBlade', label: '에고 블레이드', slot: 'weapon', weaponType: 'ego', tier: 2, price: 220, atk: [24, 0], stats: { maxHp: 40, spd: 6 }, skills: ['headKnock', 'rally', 'plunge'], bound: true, blurb: '길 위에서 몽둥이가 날을 세웠다. 혼자일 때 더 가볍다.' },
  { id: 'braveSword', label: '용사의 검', slot: 'weapon', weaponType: 'ego', tier: 3, price: 600, atk: [32, 0], def: [0, 8, 0, 6], stats: { maxHp: 120 }, trait: 'bulwark', skills: ['headKnock', 'rally', 'wedge', 'breakingEdge'], bound: true, blurb: '에고 소드가 제 이름을 찾았다. 방패를 함께 든다.' },
  { id: 'darkBlade', label: '다크 블레이드', slot: 'weapon', weaponType: 'ego', tier: 3, price: 600, atk: [38, 0], stats: { maxHp: 60, spd: 8 }, skills: ['headKnock', 'rally', 'plunge', 'darkRelease'], bound: true, blurb: '에고 블레이드가 어둠을 삼켰다. 힘을 주고 대가를 받는다.' },

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

  // ═════════ 4 · 5등급 — 만렙 50 확장, 제작 전용 (docs/22 §6) ═════════
  // 3등급 공격 28~30 → 4등급 약 1.4배 → 5등급 약 1.9배. 기본치가 제곱근이라 가산이 크게 먹힌다 — HOF 최상위 8배는 우리 체계에서 과하다
  { id: 'swordRune', label: '룬검', slot: 'weapon', weaponType: 'sword', tier: 4, price: 1200, atk: [42, 0], blurb: '날에 새긴 문양이 모래바람에도 닳지 않는다.' },
  { id: 'swordStar', label: '별검', slot: 'weapon', weaponType: 'sword', tier: 5, price: 2400, atk: [56, 0], blurb: '떨어진 별의 조각을 두드려 폈다.' },
  { id: 'daggerSand', label: '사막의 곡도', slot: 'weapon', weaponType: 'dagger', tier: 4, price: 1200, atk: [40, 0], blurb: '태양석으로 벼린 날. 쥐면 뜨겁다.' },
  { id: 'daggerShadow', label: '그림자 송곳', slot: 'weapon', weaponType: 'dagger', tier: 5, price: 2400, atk: [54, 0], blurb: '용병왕의 암살자들이 쓰던 것. 소리가 나지 않는다.' },
  { id: 'staffTide', label: '조수의 지팡이', slot: 'weapon', weaponType: 'staff', tier: 4, price: 1200, atk: [0, 42], blurb: '신전 바닥에서 건졌다. 아직 젖어 있다.' },
  { id: 'staffStar', label: '별의 지팡이', slot: 'weapon', weaponType: 'staff', tier: 5, price: 2400, atk: [0, 56], blurb: '끝에 박힌 별조각이 밤마다 빛난다.' },
  { id: 'relicTide', label: '조수의 성배', slot: 'weapon', weaponType: 'relic', tier: 4, price: 1200, atk: [0, 38], def: [0, 0, 6, 12], blurb: '물이 마르지 않는 잔.' },
  { id: 'relicStar', label: '별의 성물', slot: 'weapon', weaponType: 'relic', tier: 5, price: 2400, atk: [0, 52], def: [0, 0, 8, 16], blurb: '탑의 꼭대기에서 누군가 기도하던 것.' },
  { id: 'bowSand', label: '태양궁', slot: 'weapon', weaponType: 'bow', tier: 4, price: 1200, atk: [40, 0], blurb: '태양석을 박아 시위가 늘어지지 않는다.' },
  { id: 'bowStar', label: '별화살 활', slot: 'weapon', weaponType: 'bow', tier: 5, price: 2400, atk: [54, 0], blurb: '쏜 화살이 꼬리를 끌며 떨어진다.' },
  { id: 'armorRune', label: '룬 판금', slot: 'armor', tier: 4, price: 1100, def: [14, 26, 0, 7], blurb: '문양이 칼끝을 미끄러뜨린다.' },
  { id: 'armorStar', label: '별의 갑주', slot: 'armor', tier: 5, price: 2200, def: [18, 34, 0, 9], trait: 'ironWill', blurb: '입으면 두려움이 먼저 빠져나간다.' },
  { id: 'robeTide', label: '조수의 로브', slot: 'armor', tier: 4, price: 1100, def: [0, 7, 14, 28], stats: { maxSp: 45 }, blurb: '물결 무늬가 주문을 흘려 보낸다.' },
  { id: 'robeStar', label: '별의 로브', slot: 'armor', tier: 5, price: 2200, def: [0, 9, 18, 36], stats: { maxSp: 60 }, trait: 'foresight', blurb: '다음에 무엇이 올지 조금 먼저 안다.' },
  { id: 'pendantSandglass', label: '모래시계 펜던트', slot: 'trinket', tier: 4, price: 1300, stats: { spd: 6 }, trait: 'foresight', blurb: '모래가 떨어지는 동안은 먼저 움직인다.' },
  { id: 'crownStar', label: '별의 관', slot: 'trinket', tier: 5, price: 2600, stats: { int: 10, luk: 10 }, trait: 'extraPattern', blurb: '쓰는 순간 생각이 한 줄 더 는다.' },
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
  /** 장비가 쥐여 주는 무기 스킬 (docs/31) */
  skills: string[]
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
  const out: GearSummary = { atk: [0, 0], def: [0, 0, 0, 0], stats: {}, traits: [], weapon: 'none', skills: [] }
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
    for (const k of d.skills ?? []) if (!out.skills.includes(k)) out.skills.push(k)
    if (d.slot === 'weapon' && d.weaponType) out.weapon = d.weaponType
  }
  return out
}

export function applyGearStats(stats: Stats, extra: Partial<Stats>): Stats {
  const s = { ...stats }
  for (const k of Object.keys(extra) as (keyof Stats)[]) s[k] = Math.max(1, s[k] + (extra[k] ?? 0))
  return s
}
