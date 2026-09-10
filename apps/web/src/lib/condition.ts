// 수칙 편집기의 조건 모델. 엔진의 Condition 트리를 "AND/OR 로 묶인 원자 목록"으로 단순화해 편집한다.
// 편집기가 표현 못 하는 깊은 트리는 읽기 전용 설명으로만 보여준다.
import type { Cmp, Condition, ConditionAtom, Row, Side, StatKey, StatusId } from '@webrpg/engine'
import { STATUS_DEFS } from '@webrpg/engine'

export type Field = 'cmp' | 'value' | 'row' | 'status' | 'stat'

export const STAT_LABEL: Record<StatKey, string> = { str: '힘', int: '지능', dex: '손재주', spd: '속도', luk: '운' }

export interface KindSpec {
  /** side 가 있는 kind 는 "{side}" 자리에 아군/적군이 들어간다 */
  label: string
  fields: Field[]
  unit: string
  defaultValue: number
}

export const KIND_SPECS: Record<ConditionAtom['kind'], KindSpec> = {
  selfHpPct: { label: '내 HP 비율', fields: ['value', 'cmp'], unit: '%', defaultValue: 50 },
  selfHpAbs: { label: '내 HP', fields: ['value', 'cmp'], unit: '', defaultValue: 200 },
  selfSpPct: { label: '내 SP 비율', fields: ['value', 'cmp'], unit: '%', defaultValue: 50 },
  selfSpAbs: { label: '내 SP', fields: ['value', 'cmp'], unit: '', defaultValue: 20 },
  selfRow: { label: '내 위치가', fields: ['row'], unit: '', defaultValue: 0 },
  selfHasStatus: { label: '내가', fields: ['status'], unit: '상태', defaultValue: 0 },
  selfActionCount: { label: '내 행동 횟수', fields: ['value', 'cmp'], unit: '회', defaultValue: 1 },
  teamAliveCount: { label: '{side} 생존자', fields: ['value', 'cmp'], unit: '명', defaultValue: 3 },
  teamDeadCount: { label: '{side} 전사자', fields: ['value', 'cmp'], unit: '명', defaultValue: 1 },
  teamAnyHpPctBelow: { label: '{side} 중 HP가', fields: ['value'], unit: '% 이하인 자 있음', defaultValue: 40 },
  teamAvgHpPct: { label: '{side} 평균 HP', fields: ['value', 'cmp'], unit: '%', defaultValue: 50 },
  teamCastingCount: { label: '{side} 시전 중', fields: ['value', 'cmp'], unit: '명', defaultValue: 1 },
  teamStatusCount: { label: '{side} 중', fields: ['status', 'value', 'cmp'], unit: '명', defaultValue: 1 },
  teamRowCount: { label: '{side}', fields: ['row', 'value', 'cmp'], unit: '명', defaultValue: 2 },
  teamSpPctBelow: { label: '{side} 중 SP가', fields: ['value'], unit: '% 이하인 자 있음', defaultValue: 20 },
  chance: { label: '확률', fields: ['value'], unit: '%', defaultValue: 50 },
  selfStat: { label: '내 능력치', fields: ['stat', 'value', 'cmp'], unit: '', defaultValue: 30 },
}

export interface PickerItem {
  key: string
  kind: ConditionAtom['kind']
  side?: Side
  label: string
}

const SELF_KINDS: ConditionAtom['kind'][] = ['selfHpPct', 'selfHpAbs', 'selfSpPct', 'selfSpAbs', 'selfRow', 'selfHasStatus', 'selfActionCount', 'selfStat']
const TEAM_KINDS: ConditionAtom['kind'][] = ['teamAnyHpPctBelow', 'teamAliveCount', 'teamDeadCount', 'teamAvgHpPct', 'teamCastingCount', 'teamStatusCount', 'teamRowCount', 'teamSpPctBelow']

export const PICKER_GROUPS: { group: string; items: PickerItem[] }[] = [
  { group: '자신', items: SELF_KINDS.map((kind) => ({ key: kind, kind, label: KIND_SPECS[kind].label })) },
  { group: '아군', items: TEAM_KINDS.map((kind) => ({ key: `ally:${kind}`, kind, side: 'ally', label: KIND_SPECS[kind].label.replace('{side}', '아군') })) },
  { group: '적군', items: TEAM_KINDS.map((kind) => ({ key: `enemy:${kind}`, kind, side: 'enemy', label: KIND_SPECS[kind].label.replace('{side}', '적군') })) },
  { group: '기타', items: [{ key: 'chance', kind: 'chance', label: '확률' }] },
]

export function pickerKey(atom: ConditionAtom): string {
  return 'side' in atom ? `${atom.side}:${atom.kind}` : atom.kind
}

export function makeAtom(kind: ConditionAtom['kind'], side: Side = 'ally'): ConditionAtom {
  const v = KIND_SPECS[kind].defaultValue
  switch (kind) {
    case 'selfHpPct':
    case 'selfHpAbs':
    case 'selfSpPct':
    case 'selfSpAbs':
      return { kind, cmp: 'lte', value: v }
    case 'selfActionCount':
      return { kind, cmp: 'eq', value: v }
    case 'selfRow':
      return { kind, row: 'front' }
    case 'selfHasStatus':
      return { kind, status: 'poison' }
    case 'teamAliveCount':
    case 'teamDeadCount':
    case 'teamAvgHpPct':
    case 'teamCastingCount':
      return { kind, side, cmp: 'gte', value: v }
    case 'teamAnyHpPctBelow':
    case 'teamSpPctBelow':
      return { kind, side, value: v }
    case 'teamStatusCount':
      return { kind, side, status: 'poison', cmp: 'gte', value: v }
    case 'teamRowCount':
      return { kind, side, row: 'back', cmp: 'gte', value: v }
    case 'chance':
      return { kind, percent: v }
    case 'selfStat':
      return { kind, stat: 'str', cmp: 'gte', value: v }
  }
}

// ───────────────────────────── 편집기 모델 ↔ 엔진 Condition

export interface EditorAtom {
  atom: ConditionAtom
  not: boolean
}

export interface EditorCondition {
  join: 'and' | 'or'
  atoms: EditorAtom[]
}

export function toCondition(ec: EditorCondition): Condition {
  const nodes: Condition[] = ec.atoms.map(({ atom, not }) => (not ? { op: 'not', node: { op: 'atom', atom } } : { op: 'atom', atom }))
  if (nodes.length === 0) return { op: 'always' }
  if (nodes.length === 1) return nodes[0]
  return { op: ec.join, nodes }
}

/** 편집기가 표현 가능한 형태면 변환, 아니면 null (읽기 전용 표시) */
export function fromCondition(c: Condition): EditorCondition | null {
  const one = (n: Condition): EditorAtom | null => {
    if (n.op === 'atom') return { atom: n.atom, not: false }
    if (n.op === 'not' && n.node.op === 'atom') return { atom: n.node.atom, not: true }
    return null
  }
  if (c.op === 'always') return { join: 'and', atoms: [] }
  const single = one(c)
  if (single) return { join: 'and', atoms: [single] }
  if (c.op === 'and' || c.op === 'or') {
    const atoms = c.nodes.map(one)
    if (atoms.some((a) => a === null)) return null
    return { join: c.op, atoms: atoms as EditorAtom[] }
  }
  return null
}

// ───────────────────────────── 문장 렌더링

export const cmpText = (c: Cmp): string => (c === 'gte' ? '이상' : c === 'lte' ? '이하' : '정확히')
export const sideText = (s: Side): string => (s === 'ally' ? '아군' : '적군')
export const rowText = (r: Row): string => (r === 'front' ? '전열' : '후열')
export const statusText = (s: StatusId): string => STATUS_DEFS[s].label

export function describeAtom(a: ConditionAtom): string {
  switch (a.kind) {
    case 'selfHpPct':
      return `내 HP ${a.value}% ${cmpText(a.cmp)}`
    case 'selfHpAbs':
      return `내 HP ${a.value} ${cmpText(a.cmp)}`
    case 'selfSpPct':
      return `내 SP ${a.value}% ${cmpText(a.cmp)}`
    case 'selfSpAbs':
      return `내 SP ${a.value} ${cmpText(a.cmp)}`
    case 'selfRow':
      return `내가 ${rowText(a.row)}`
    case 'selfHasStatus':
      return `내가 [${statusText(a.status)}] 상태`
    case 'selfActionCount':
      return a.cmp === 'eq' ? `내 ${a.value}번째 행동` : `내 행동 횟수 ${a.value}회 ${cmpText(a.cmp)}`
    case 'teamAliveCount':
      return `${sideText(a.side)} 생존자 ${a.value}명 ${cmpText(a.cmp)}`
    case 'teamDeadCount':
      return `${sideText(a.side)} 전사자 ${a.value}명 ${cmpText(a.cmp)}`
    case 'teamAnyHpPctBelow':
      return `${sideText(a.side)} 중 HP ${a.value}% 이하인 자 있음`
    case 'teamAvgHpPct':
      return `${sideText(a.side)} 평균 HP ${a.value}% ${cmpText(a.cmp)}`
    case 'teamCastingCount':
      return `${sideText(a.side)} 시전 중 ${a.value}명 ${cmpText(a.cmp)}`
    case 'teamStatusCount':
      return `${sideText(a.side)} 중 [${statusText(a.status)}] ${a.value}명 ${cmpText(a.cmp)}`
    case 'teamRowCount':
      return `${sideText(a.side)} ${rowText(a.row)} ${a.value}명 ${cmpText(a.cmp)}`
    case 'teamSpPctBelow':
      return `${sideText(a.side)} 중 SP ${a.value}% 이하인 자 있음`
    case 'chance':
      return `${a.percent}% 확률`
    case 'selfStat':
      return `내 ${STAT_LABEL[a.stat]} ${a.value} ${cmpText(a.cmp)}`
  }
}

export function describeCondition(c: Condition): string {
  switch (c.op) {
    case 'always':
      return '항상'
    case 'atom':
      return describeAtom(c.atom)
    case 'not':
      return `${describeCondition(c.node)} 아님`
    case 'and':
      return c.nodes.map(describeCondition).join(' 그리고 ')
    case 'or':
      return c.nodes.map(describeCondition).join(' 또는 ')
  }
}
