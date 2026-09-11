// 한국어 표시 문자열. 엔진은 id 만 다루고, 사람이 읽는 말은 전부 여기서 만든다.
import type { BattleEvent, CharRef, Effect, ItemDef, Row, SkillFailReason, StatKey, StatusId, TargetPriority, TargetSpec, TraitDef } from '@webrpg/engine'
import { COMMON_LEARNABLE, LEARNABLE, PRESETS, SKILLS, STARTER_SKILLS, STATUS_DEFS, TRAITS, WEAPON_TYPE_LABEL, jobSkillPool } from '@webrpg/engine'

// ───────────────────────────── 도감 · 요약 문장 (ADR-004)

export const STAT_HELP: Record<StatKey, string> = {
  str: '물리 공격의 위력. 기본 공격·강타·휩쓸기 같은 힘 기술이 세진다.',
  int: '마법·회복의 위력과 최대 SP. 10·20·35·50·70 을 넘을 때마다 패턴 칸이 하나 늘어난다.',
  dex: '연타·사격·독 같은 손재주 기술의 위력. 4 마다 시전 준비 시간 1% 단축 (최대 25%).',
  spd: '행동 게이지가 차는 속도. 높을수록 차례가 자주 온다 (제곱근이라 몰빵은 손해).',
  luk: '적이 거는 상태이상을 저항할 확률. 상대와의 차이 4 당 1%, 최대 30%.',
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

export function skillBrief(id: string): string {
  const p = skillParts(id)
  if (!p) return ''
  return [p.cost, p.target, p.timing, p.effects, p.notes].filter(Boolean).join(' · ')
}

/** 이 스킬을 가질 수 있는 직업들 (시작 또는 습득) */
export const skillJobs = (id: string): string[] => Object.keys(PRESETS).filter((job) => jobSkillPool(job).includes(id)).map((job) => PRESETS[job].name)

/** 도감용: "전사 기본 · 엘프 2pt · 공용 공짜" */
export function skillSources(id: string): string {
  const out: string[] = []
  if (COMMON_LEARNABLE.some((l) => l.skillId === id)) out.push('공용 공짜')
  for (const job of Object.keys(PRESETS)) {
    if (STARTER_SKILLS[job]?.includes(id)) out.push(`${PRESETS[job].name} 기본`)
    const l = LEARNABLE[job]?.find((x) => x.skillId === id)
    if (l) out.push(`${PRESETS[job].name} ${l.cost}pt`)
  }
  return out.join(' · ') || '—'
}

export function traitText(t: TraitDef): string {
  return t.effects
    .map((e) => {
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
        case 'trigger': {
          const when = e.on === 'turnStart' ? '매 차례 시작' : e.on === 'damaged' ? '피격 시' : `HP ${e.hpPct}% 이하가 되면`
          return `${when}${e.perBattle ? ` (전투당 ${e.perBattle}회)` : ''}: ${effectText(e.effect)}`
        }
      }
    })
    .join(', ')
}

/** 장비 한 줄: "물리 +18 · 방어 5% +10 · 마방 +5 · 운 +10 · [방벽]" */
export function itemBrief(def: ItemDef): string {
  const out: string[] = []
  if (def.atk) {
    if (def.atk[0]) out.push(`물리 +${def.atk[0]}`)
    if (def.atk[1]) out.push(`마법 +${def.atk[1]}`)
  }
  if (def.def) {
    const [pp, pf, mp, mf] = def.def
    if (pp || pf) out.push(`방어${pp ? ` ${pp}%` : ''}${pf ? ` +${pf}` : ''}`)
    if (mp || mf) out.push(`마방${mp ? ` ${mp}%` : ''}${mf ? ` +${mf}` : ''}`)
  }
  if (def.stats) for (const [k, v] of Object.entries(def.stats)) out.push(`${GEAR_STAT_LABEL[k] ?? k} ${v > 0 ? '+' : ''}${v}`)
  if (def.trait) out.push(`[${traitLabel(def.trait)}] ${TRAITS[def.trait] ? traitText(TRAITS[def.trait]) : ''}`)
  if (def.weaponType) out.unshift(WEAPON_TYPE_LABEL[def.weaponType])
  return out.join(' · ')
}
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

export const jobName = (job: string): string => PRESETS[job]?.name ?? job
export const jobOf = (charId: string): string => charId.split('#')[0]
export const skillLabel = (id: string): string => SKILLS[id]?.label ?? id
export const statusLabel = (id: StatusId): string => STATUS_DEFS[id]?.label ?? id

/** 관례 경로 (assets/manifest.json 과 일치). BASE_URL 을 붙여 GitHub Pages 같은 하위 경로 배포에서도 동작 */
export const jobIcon = (job: string): string => `${import.meta.env.BASE_URL}jobs/${job}.svg`

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
        : { kind: 'damage', text: `${who(e.target)}에게 ${e.amount} 피해` }
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
