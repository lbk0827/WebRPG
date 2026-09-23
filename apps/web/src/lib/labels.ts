// 한국어 표시 문자열. 엔진은 id 만 다루고, 사람이 읽는 말은 전부 여기서 만든다.
import type { BattleEvent, CharRef, Effect, ItemDef, ItemInstance, Row, SkillFailReason, StatKey, StatusId, TargetPriority, TargetSpec, TraitDef } from '@webrpg/engine'
import { COMMON_LEARNABLE, ITEMS, JOB_ADVANCE, LEARNABLE, MATERIALS, PRESETS, SKILLS, STARTER_SKILLS, STATUS_DEFS, TRAITS, WEAPON_TYPE_LABEL, isMonsterIcon, jobSkillPool, refinedNumbers } from '@webrpg/engine'

// ───────────────────────────── 도감 · 요약 문장 (ADR-004)

// ───────────────────────────── 능력치 색 축 (docs/11 §5.20)
//
// 제로식은 능력치 이름마다 색을 고정하고 그 이름이 나오는 모든 곳 — 장비 옵션 · 스킬 버프/디버프 · 패시브 —
// 에서 같은 색을 쓴다. 색이 곧 "이게 무슨 값인지"를 말해 주므로 한 줄에 값 아홉 개를 붙여도 읽힌다.
// 우리도 그 방식을 따르되 색은 여덟 축만 쓴다. 우리는 한글 이름이 늘 붙으므로 색은 잉여 채널이다
// (종이 배경 · 적록 색약 측정 근거는 docs/11 §5.20 C).

/** 글자에 입히는 색 축. `plain` 은 색을 주지 않는다 (보조 정보) */
export type Axis = 'atk' | 'magic' | 'guard' | 'mguard' | 'life' | 'cost' | 'caveat' | 'plain'

/** 색을 입힌 한 토막. 화면은 `Spec` 부품이 그린다 */
export interface Part {
  text: string
  axis: Axis
}

/** 스탯 가산은 그 스탯이 키우는 축의 색을 물려받는다 — 힘·손재주는 물리, 지능은 마법, 속도·운은 색 없음 */
const STAT_AXIS: Record<string, Axis> = {
  str: 'atk',
  dex: 'atk',
  int: 'magic',
  spd: 'plain',
  luk: 'plain',
  maxHp: 'life',
  maxSp: 'cost',
  def: 'guard',
  mdef: 'mguard',
}

/**
 * 상태이상은 그것이 건드리는 능력치의 색을 쓴다 — 제로식이 `Atk-15%` 를 Atk 색으로, `Def+2%` 를
 * Def 색으로 칠하는 것과 같은 규칙. 강화든 약화든 색은 같고, 강화/약화는 이름이 말한다.
 */
const STATUS_AXIS: Record<StatusId, Axis> = {
  poison: 'atk',      // 지속 피해
  atkUp: 'atk',
  atkDown: 'atk',
  defUp: 'guard',
  defDown: 'guard',
  spdUp: 'plain',     // 속도는 색을 주지 않는 축
  spdDown: 'plain',
  silence: 'magic',   // 시전을 끊는 것 — 마법 축
  barrier: 'guard',
}

/** 스탯 이름의 색 축 — 도감 표 머리처럼 이름만 나오는 자리에 쓴다 */
export const statAxis = (k: string): Axis => STAT_AXIS[k] ?? 'plain'

/** 상태이상 이름의 색 축 */
export const statusAxis = (id: StatusId): Axis => STATUS_AXIS[id] ?? 'plain'

/** 효과 한 줄의 축 — 피해는 물리/마법, 회복은 생명, SP 는 자원, 보호막은 방어, 내 HP 를 태우는 것은 주의 */
function effectAxis(e: Effect): Axis {
  switch (e.kind) {
    case 'damage':
      return e.school === 'phys' ? 'atk' : 'magic'
    case 'heal':
    case 'revive':
      return 'life'
    case 'restoreSp':
    case 'damageSp':
      return 'cost'
    case 'drain':
      return e.resource === 'hp' ? 'life' : 'cost'
    case 'shield':
      return 'guard'
    case 'recoil':
      return 'caveat'
    case 'applyStatus':
      return STATUS_AXIS[e.status] ?? 'plain'
    default:
      return 'plain'
  }
}

export const STAT_HELP: Record<StatKey, string> = {
  str: '물리 공격의 위력. 기본 공격·강타·휩쓸기 같은 힘 기술이 세진다.',
  int: '마법·회복의 위력과 최대 SP. 10·20·35·50·70 을 넘을 때마다 패턴 칸이 하나 늘어난다.',
  dex: '연타·사격·독 같은 손재주 기술의 위력. 4 마다 시전 준비 시간 1% 단축 (최대 25%).',
  spd: '행동 게이지가 차는 속도. 높을수록 차례가 자주 온다 (제곱근이라 몰빵은 손해).',
  luk: '더블 크리티컬 — 운이 25 를 넘으면 넘은 1 당 피해 한 타가 2배로 들어갈 확률 +1% (최대 30%). 그리고 단원 중 가장 높은 운이 드롭 확률(운 2 당 +1%, 최대 +60%)과 제작 특성 확률(운 5 당 +1%p, 최대 +25%p)에 붙고, 적이 거는 상태이상을 저항한다(상대와의 차이 4 당 1%, 최대 30%). 포인트의 20% 쯤 섞으면 후반 지역에서 이득이고, 40% 는 과합니다 (docs/18 §18). 타고난 운: 프리스트 25 · 도적·엘프 20 · 전사·마법사 10.',
}

export const STATUS_HELP: Record<StatusId, string> = {
  poison: '매 차례 시작에 HP 피해. 크기가 피해량.',
  atkUp: '주는 피해 +N%.',
  atkDown: '주는 피해 −N%.',
  defUp: '받는 피해 −N%.',
  defDown: '받는 피해 +N%.',
  spdUp: '게이지 충전 +N%.',
  spdDown: '게이지 충전 −N%.',
  silence: 'SP 를 쓰는 기술 사용 불가. 기본 공격만 남는다.',
  barrier: 'N 번의 공격을 무효로 한다.',
}

const rowText = (r: Row): string => (r === 'front' ? '전열' : '후열')

export function targetText(t: TargetSpec, p?: TargetPriority): string {
  const side = t.side === 'enemy' ? '적' : t.side === 'ally' ? '아군' : t.side === 'self' ? '자신' : '아무나'
  const scope = t.side === 'self' ? '' : t.scope === 'single' ? ' 1명' : t.scope === 'all' ? ' 전원' : ` ${t.hits}회 무작위`
  const hits = t.scope === 'single' && t.hits > 1 ? ` ${t.hits}타` : ''
  let pri = ''
  if (p) {
    if (p.mode === 'prefer') pri = p.by === 'lowestHpPct' ? ' · HP 낮은 순' : p.by === 'highestHpPct' ? ' · HP 높은 순' : ' · 후열 우선'
    else if (p.by === 'hasStatus') pri = ` · [${statusLabel(p.status)}]인 자만`
    else pri = p.by === 'dead' ? ' · 쓰러진 자만' : p.by === 'casting' ? ' · 시전 중인 자만' : ' · 약화된 자만'
  }
  return `${side}${scope}${hits}${pri}`
}

export function effectText(e: Effect): string {
  switch (e.kind) {
    case 'damage':
      return `${e.school === 'phys' ? '물리' : '마법'} ${e.power}%${e.scaleBy === 'dex' ? ' (손재주)' : ''}${e.pierce ? ' 관통' : ''}${e.falloff ? ` 점감 ${e.falloff}%` : ''}${e.rowBonus ? ` (열 조건 ${e.rowBonus.power}%)` : ''}`
    case 'heal':
      return `회복 ${e.power}%`
    case 'restoreSp':
      return `SP 회복 ${e.power}%`
    case 'applyStatus':
      return `[${statusLabel(e.status)}] ${e.duration}턴${e.magnitude !== undefined ? ` ${e.magnitude}` : ''}`
    case 'removeStatus':
      return e.category === 'debuff' ? '약화 해제' : '강화 해제'
    case 'modifyGauge':
      return `게이지 ${e.delta > 0 ? '+' : ''}${e.delta}`
    case 'revive':
      return `소생 HP ${e.hpPct}%`
    case 'shield':
      return `보호막 ${e.hits}회`
    case 'moveRow':
      return `${e.who === 'self' ? '자신' : '대상'} ${e.to === 'swap' ? '열 교대' : rowText(e.to) + '로'}`
    case 'damageSp':
      return `SP 피해 ${e.power}%`
    case 'drain':
      return `${e.resource === 'hp' ? 'HP' : 'SP'} 흡수 ${e.pct}%`
    case 'recoil':
      // 지금 남은 HP 기준인지 최대 HP 기준인지가 수칙 판단을 바꾼다 — 반드시 적는다
      return `${e.ofCurrent ? '남은' : '최대'} HP 의 ${e.pct}% 를 태운다${e.gauge ? ` (게이지도 −${e.gauge})` : ''}`
  }
}

export interface SkillParts {
  cost: string
  target: string
  timing: string
  effects: string
  notes: string
}

/** 제로식의 "이름 / 대상 / SP / 위력 / (준비:대기)" 한 줄 포맷에서 착안한 요약 (우리 표현) */
export function skillParts(id: string): SkillParts | null {
  const s = SKILLS[id]
  if (!s) return null
  const notes: string[] = []
  if (s.ignoreCover) notes.push('엄호 무시')
  if (s.cooldown) notes.push(`재사용 ${s.cooldown}회 대기`)
  if (s.perBattle) notes.push(`전투당 ${s.perBattle}회`)
  if (s.costHpPct) notes.push(`HP ${s.costHpPct}% 지불`)
  if (s.requires?.weaponType) notes.push(`무기: ${s.requires.weaponType.join('/')}`)
  return {
    cost: s.spCost === 0 ? 'SP 0' : `SP ${s.spCost}`,
    target: targetText(s.target, s.priority),
    timing: s.charge === 0 && s.stiff === 0 ? '즉시' : `준비 ${s.charge} · 경직 ${s.stiff}`,
    effects: s.effects.map(effectText).join(', '),
    notes: notes.join(' · '),
  }
}

export interface SkillPartGroups {
  cost: Part
  target: Part
  timing: Part
  effects: Part[]
  notes: Part[]
}

/** `skillPartList()` 를 칸별로 — 도감처럼 소비 · 대상 · 효과 · 제약을 다른 칸에 그리는 자리 */
export function skillPartGroups(id: string): SkillPartGroups | null {
  const s = SKILLS[id]
  const p = skillParts(id)
  if (!s || !p) return null
  return {
    cost: { text: p.cost, axis: 'cost' },
    // 적은 공격색, 아군·자신은 생명색 — 제로식의 enemy 빨강 / friend 녹과 같은 대비축
    target: { text: p.target, axis: s.target.side === 'enemy' ? 'atk' : s.target.side === 'any' ? 'plain' : 'life' },
    timing: { text: p.timing, axis: 'plain' },
    effects: s.effects.map((e) => ({ text: effectText(e), axis: effectAxis(e) })),
    notes: p.notes ? p.notes.split(' · ').map((note) => ({ text: note, axis: 'caveat' as const })) : [],
  }
}

/**
 * 스킬 정보 한 줄을 색 축과 함께: "SP 8 · 적 1명 · 즉시 · 물리 300% · 엄호 무시".
 * 축은 제로식의 슬롯을 그대로 옮겼다 — 소비(자원) · 대상(적/아군) · 시간(무채) · 효과(계열) · 제약(주의).
 */
export function skillPartList(id: string): Part[] {
  const g = skillPartGroups(id)
  return g ? [g.cost, g.target, g.timing, ...g.effects, ...g.notes] : []
}

/** 같은 내용의 평문 — 검색 · `title` 처럼 색을 쓸 수 없는 자리 */
export function skillBrief(id: string): string {
  const parts = skillPartList(id)
  return parts.length ? partsText(parts) : ''
}

/** 이 스킬을 가질 수 있는 직업들 (시작 또는 습득) */
export const skillJobs = (id: string): string[] => Object.keys(PRESETS).filter((job) => jobSkillPool(job).includes(id)).map((job) => PRESETS[job].name)

/** 도감용: "전사 기본 · 엘프 2pt · 공용 Free" */
export function skillSources(id: string): string {
  const out: string[] = []
  if (COMMON_LEARNABLE.some((l) => l.skillId === id)) out.push('공용 Free')
  for (const job of Object.keys(PRESETS)) {
    if (STARTER_SKILLS[job]?.includes(id)) out.push(`${PRESETS[job].name} 기본`)
    const l = LEARNABLE[job]?.find((x) => x.skillId === id)
    if (l) out.push(`${PRESETS[job].name} ${l.cost}pt`)
  }
  return out.join(' · ') || '—'
}

// M2-5b 의 훅 특성 4종이 여기 빠져 있어 화면에 빈칸으로 나왔다 (2026-09-13).
// 반환형을 string 으로 못 박아 두면 다음에 효과를 더할 때 컴파일이 막아 준다
export function traitText(t: TraitDef): string {
  return t.effects
    .map((e): string => {
      switch (e.kind) {
        case 'castTimePct':
          return `시전 준비 시간 ${e.pct}%`
        case 'coverDamagePct':
          return `엄호할 때 받는 피해 ${e.pct}%`
        case 'damageVsRowPct':
          return `${rowText(e.row)} 상대에게 피해 +${e.pct}%`
        case 'startGauge':
          return `전투 시작 게이지 +${e.amount}`
        case 'ruleRows':
          return `패턴 칸 +${e.add}`
        case 'resistPct':
          return `상태이상 저항 +${e.pct}%`
        case 'statusPowerPct':
          return `내가 건 상태이상의 세기 +${e.pct}%`
        case 'damageVsDebuffedPct':
          return `약화된 상대에게 피해 +${e.pct}%`
        case 'gaugeDamagePct':
          return `내가 깎는 게이지 +${e.pct}%`
        case 'recoilPowerPct':
          return `내 HP 를 태우는 기술: 태운 최대 HP 1%p 마다 피해 +${e.pct}%`
        case 'trigger': {
          const when = e.on === 'turnStart' ? '매 차례 시작' : e.on === 'damaged' ? '피격 시' : `HP ${e.hpPct}% 이하가 되면`
          return `${when}${e.perBattle ? ` (전투당 ${e.perBattle}회)` : ''}: ${effectText(e.effect)}`
        }
      }
    })
    .join(', ')
}

/**
 * 장비 옵션 한 줄을 색 축과 함께: "물리 +18 · 방어 5% +10 · 마방 +5 · 운 +10 · [방벽]".
 * 인스턴스를 주면 강화·보너스 특성 반영. 값은 라벨과 한 색으로 묶는다 (docs/11 §5.20 D 1).
 */
export function itemParts(def: ItemDef, inst?: ItemInstance): Part[] {
  const out: Part[] = []
  if (def.weaponType) out.push({ text: WEAPON_TYPE_LABEL[def.weaponType], axis: 'plain' })
  const n = inst ? refinedNumbers(def, inst.refine) : { atk: def.atk ?? [0, 0], def: def.def ?? [0, 0, 0, 0] }
  if (n.atk[0]) out.push({ text: `물리 +${n.atk[0]}`, axis: 'atk' })
  if (n.atk[1]) out.push({ text: `마법 +${n.atk[1]}`, axis: 'magic' })
  const [pp, pf, mp, mf] = n.def
  if (pp || pf) out.push({ text: `방어${pp ? ` ${pp}%` : ''}${pf ? ` +${pf}` : ''}`, axis: 'guard' })
  if (mp || mf) out.push({ text: `마방${mp ? ` ${mp}%` : ''}${mf ? ` +${mf}` : ''}`, axis: 'mguard' })
  if (def.stats) {
    for (const [k, v] of Object.entries(def.stats)) {
      // 마이너스 옵션은 값이 싼 대가다 — 축 색이 아니라 주의색으로 눈에 걸리게 한다
      out.push({ text: `${GEAR_STAT_LABEL[k] ?? k} ${v > 0 ? '+' : ''}${v}`, axis: v < 0 ? 'caveat' : STAT_AXIS[k] ?? 'plain' })
    }
  }
  // 특성은 색을 주지 않는다 — 대괄호와 하늘색 프레임(§5.18)이 이미 그 일을 하고, 한 줄에 아홉 번째 색을 더하면 축이 무너진다
  if (def.trait) out.push({ text: `[${traitLabel(def.trait)}] ${TRAITS[def.trait] ? traitText(TRAITS[def.trait]) : ''}`, axis: 'plain' })
  if (inst?.trait && inst.trait !== def.trait) {
    out.push({ text: `[${traitLabel(inst.trait)}] ${TRAITS[inst.trait] ? traitText(TRAITS[inst.trait]) : ''} (제작 보너스)`, axis: 'plain' })
  }
  // 무기 스킬 — 이 무기를 든 동안만 쓸 수 있는 스킬 (docs/31). 특성과 같은 이유로 색을 주지 않는다
  if (def.skills?.length) out.push({ text: `무기 스킬 ${def.skills.map(skillLabel).join(' · ')}`, axis: 'plain' })
  return out
}

/** 같은 내용의 평문 — 검색 · `title` · 표 정렬처럼 색을 쓸 수 없는 자리 */
export const itemBrief = (def: ItemDef, inst?: ItemInstance): string => partsText(itemParts(def, inst))

/** 색 토막들을 평문 한 줄로 */
export const partsText = (parts: Part[]): string => parts.map((p) => p.text).join(' · ')

/**
 * 장비 하나가 주는 수치 (강화 반영). 비교에 쓴다.
 * 키 순서를 고정해 두 장비를 나란히 뺄 수 있게 한다.
 */
function gearNumbers(inst?: ItemInstance): Record<string, number> {
  const out: Record<string, number> = {}
  if (!inst) return out
  const def = ITEMS[inst.itemId]
  if (!def) return out
  const n = refinedNumbers(def, inst.refine)
  if (n.atk[0]) out.물리 = n.atk[0]
  if (n.atk[1]) out.마법 = n.atk[1]
  if (n.def[0]) out['방어%'] = n.def[0]
  if (n.def[1]) out.방어 = n.def[1]
  if (n.def[2]) out['마방%'] = n.def[2]
  if (n.def[3]) out.마방 = n.def[3]
  if (def.stats) for (const [k, v] of Object.entries(def.stats)) if (v) out[GEAR_STAT_LABEL[k] ?? k] = (out[GEAR_STAT_LABEL[k] ?? k] ?? 0) + v
  return out
}

export interface GearDelta {
  label: string
  /** 지금 낀 것 대비 증감 */
  value: number
}

/** 후보를 끼면 무엇이 얼마나 달라지나 (제로식에는 없는 비교 — docs/11 §5.13) */
export function gearDelta(next?: ItemInstance, cur?: ItemInstance): GearDelta[] {
  const a = gearNumbers(next)
  const b = gearNumbers(cur)
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])]
  return keys
    .map((label) => ({ label, value: (a[label] ?? 0) - (b[label] ?? 0) }))
    .filter((d) => d.value !== 0)
}

/** 바뀌는 특성 — 얻는 것과 잃는 것 */
export function traitDelta(next?: ItemInstance, cur?: ItemInstance): { gain: string[]; lose: string[] } {
  const of = (inst?: ItemInstance): string[] => {
    if (!inst) return []
    const d = ITEMS[inst.itemId]
    return [d?.trait, inst.trait].filter((t): t is string => !!t && !!TRAITS[t])
  }
  const a = of(next)
  const b = of(cur)
  return { gain: a.filter((t) => !b.includes(t)), lose: b.filter((t) => !a.includes(t)) }
}

/** 장비 하나의 대략적인 값 — 목록 정렬에만 쓴다. 판단은 플레이어가 한다 */
export function gearWorth(inst: ItemInstance): number {
  const n = gearNumbers(inst)
  return Object.entries(n).reduce((s, [k, v]) => s + (k.endsWith('%') ? v * 3 : v), 0)
}

/** "강철 검 +3" */
export const itemName = (inst: ItemInstance): string => `${ITEMS[inst.itemId]?.label ?? inst.itemId}${inst.refine > 0 ? ` +${inst.refine}` : ''}${inst.trait ? ' ✦' : ''}`
export const materialLabel = (id: string): string => MATERIALS[id]?.label ?? id
const GEAR_STAT_LABEL: Record<string, string> = { str: '힘', int: '지능', dex: '손재주', spd: '속도', luk: '운', maxHp: 'HP', maxSp: 'SP', def: '방어', mdef: '마방' }

export function timeAgo(ms: number, now = Date.now()): string {
  const d = Math.max(0, now - ms)
  const m = Math.floor(d / 60000)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}

/** 직업 이름. 'guildMember-female' 처럼 전직 단계·성별이 붙은 그림 키도 받는다 */
export const jobName = (job: string): string => {
  const k = job.split('-')[0]
  return PRESETS[job]?.name ?? PRESETS[k]?.name ?? JOB_ADVANCE[k]?.name ?? job
}
export const jobOf = (charId: string): string => charId.split('#')[0]
export const skillLabel = (id: string): string => SKILLS[id]?.label ?? id
export const statusLabel = (id: StatusId): string => STATUS_DEFS[id]?.label ?? id

/**
 * 아이콘 경로 (assets/manifest.json 과 일치). BASE_URL 을 붙여 GitHub Pages 같은 하위 경로 배포에서도 동작.
 * 키는 직업 id 또는 몬스터 아이콘 id — 전투 CharSetup.id 의 `키#번호` 앞부분이 그대로 들어온다.
 */
export const jobIcon = (key: string): string => {
  const k = emblemKey(key)
  return `${import.meta.env.BASE_URL}${isMonsterIcon(k) ? 'monsters' : 'jobs'}/${k}.svg`
}

/**
 * 그림이 아직 없는 키 → 임시로 쓸 기존 그림. docs/21 주인공 계보 남녀 10종은 모두 도착했다.
 * 그림이 도착하면 해당 키를 지운다.
 */
const ART_STANDIN: Record<string, string> = {
  adventurer: 'warrior',
}
export const artKey = (key: string): string => ART_STANDIN[key] ?? key

/**
 * 원형 엠블럼(jobs/*.svg)의 키. 전투 도트와 따로 간다 — 주인공 계보는 도트가 도착해도 엠블럼은 없으므로
 * 남 → 전사, 여 → 도적 엠블럼을 쓴다 (manifest.json 의 icon 과 같다). 도트를 불러오는 동안 이 그림이 먼저 보인다
 */
const HERO_LINE = /^(adventurer|guildMember|wanderer|brave|fallenHero)-(male|female)$/
const emblemKey = (key: string): string => {
  const m = HERO_LINE.exec(key)
  return m ? (m[2] === 'male' ? 'warrior' : 'rogue') : artKey(key)
}

export const failText = (r: SkillFailReason): string =>
  r === 'noSp' ? 'SP 부족' : r === 'noRequiredTarget' ? '대상 없음' : r === 'silenced' ? '침묵 상태' : r === 'cooldown' ? '재사용 대기' : r === 'notLearned' ? '미습득' : '무기 불일치'
export const traitLabel = (id: string): string => TRAITS[id]?.label ?? id

export const outcomeText = (o: string): string =>
  o === 'team0' ? '승리' : o === 'team1' ? '패배' : '무승부'

export type Names = [string[], string[]]

export interface Line {
  kind: 'fired' | 'exhausted' | 'failed' | 'cast' | 'interrupt' | 'cover' | 'damage' | 'heal' | 'status' | 'death' | 'revive' | 'misc'
  text: string
}

export function describeEvent(e: BattleEvent, names: Names): Line | null {
  const who = (r: CharRef): string => `${r.team === 0 ? '' : '적 '}${names[r.team][r.index]}`
  switch (e.t) {
    case 'ruleFired':
      return { kind: 'fired', text: `${e.ruleIndex + 1}번 패턴 발동 → ${skillLabel(e.skillId)}` }
    case 'ruleExhausted':
      return { kind: 'exhausted', text: '수칙에 없는 상황이라 우물쭈물했다' }
    case 'skillFailed':
      return { kind: 'failed', text: `${e.ruleIndex + 1}번 패턴 ${skillLabel(e.skillId)} 불가 — ${failText(e.reason)}` }
    case 'castStart':
      return { kind: 'cast', text: `${skillLabel(e.skillId)} 시전 시작…` }
    case 'castResolve':
      return { kind: 'cast', text: `${skillLabel(e.skillId)} 발동!` }
    case 'castInterrupted':
      return { kind: 'interrupt', text: `${who(e.target)}의 ${skillLabel(e.skillId)} 시전이 끊겼다` }
    case 'cover':
      return { kind: 'cover', text: `${who(e.defender)}가 ${who(e.protectedChar)}를 엄호` }
    case 'damage':
      return e.nullified
        ? { kind: 'cover', text: `${who(e.target)}의 보호막이 공격을 막았다` }
        : { kind: 'damage', text: `${e.crit ? '더블 크리티컬! ' : ''}${who(e.target)}에게 ${e.amount} 피해` }
    case 'heal':
      return { kind: 'heal', text: `${who(e.target)} HP +${e.amount}` }
    case 'spChange':
      return e.delta > 0 ? { kind: 'heal', text: `${who(e.target)} SP +${e.delta}` } : null
    case 'statusApply':
      return { kind: 'status', text: `${who(e.target)} [${statusLabel(e.status)}] ${e.duration}턴` }
    case 'statusResisted':
      return { kind: 'cover', text: `${who(e.target)}가 [${statusLabel(e.status)}]을 저항했다` }
    case 'statusTick':
      return { kind: 'damage', text: `${who(e.target)} [${statusLabel(e.status)}] ${e.amount} 피해` }
    case 'statusExpire':
      return { kind: 'status', text: `${who(e.target)} [${statusLabel(e.status)}] 해제` }
    case 'gaugeShift':
      return { kind: 'status', text: `${who(e.target)} 행동 게이지 ${e.delta > 0 ? '+' : ''}${e.delta}` }
    case 'rowChange':
      return { kind: 'status', text: `${who(e.target)} ${e.row === 'front' ? '전열' : '후열'}로 이동` }
    case 'traitTrigger':
      return { kind: 'revive', text: `${who(e.target)} 특성 [${traitLabel(e.traitId)}] 발동` }
    case 'death':
      return { kind: 'death', text: `${who(e.target)} 쓰러짐` }
    case 'revive':
      return { kind: 'revive', text: `${who(e.target)} 소생 (HP ${e.hp})` }
    default:
      return null
  }
}

/** "2시간 14분" / "3시간" / "3분" — 모험 재도전 대기 (목록·맵이 함께 쓴다) */
export function waitText(ms: number): string {
  const min = Math.ceil(ms / 60_000)
  if (min < 60) return `${min}분`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`
}
