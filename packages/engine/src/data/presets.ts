// M1 프리셋 단원 (§8.1). 스탯·보유 스킬 고정. 플레이어는 수칙과 편성만 바꾼다.
// 기본 수칙은 "그럭저럭 돌아가는" 수준으로 둔다 — 퍼즐은 이걸 고치는 데서 시작한다.
import type { CharSetup, Condition, RuleRow, TeamSetup } from '../types'

const always: Condition = { op: 'always' }
const atom = (a: Extract<Condition, { op: 'atom' }>['atom']): Condition => ({ op: 'atom', atom: a })
const row = (condition: Condition, skillId: string, maxUses?: number): RuleRow =>
  maxUses === undefined ? { condition, skillId } : { condition, skillId, maxUses }

export const PRESETS: Record<string, CharSetup> = {
  bulwark: {
    id: 'bulwark',
    name: '방벽병',
    row: 'front',
    guard: { mode: 'always' },
    stats: { maxHp: 620, maxSp: 40, str: 40, int: 5, spd: 25, def: 26, mdef: 10 },
    skills: ['strike', 'heavyBlow', 'warCry', 'sunder'],
    rules: {
      rows: [
        row(atom({ kind: 'selfActionCount', cmp: 'eq', value: 1 }), 'warCry', 1),
        row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'sunder'),
        row(always, 'strike'),
      ],
    },
  },
  blade: {
    id: 'blade',
    name: '검사',
    row: 'front',
    guard: { mode: 'hpAbove', pct: 50 },
    stats: { maxHp: 460, maxSp: 60, str: 56, int: 5, spd: 40, def: 15, mdef: 8 },
    skills: ['strike', 'heavyBlow', 'flurry', 'sweep'],
    rules: {
      rows: [
        row(atom({ kind: 'teamAliveCount', side: 'enemy', cmp: 'gte', value: 4 }), 'sweep'),
        row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'heavyBlow'),
        row(always, 'strike'),
      ],
    },
  },
  ranger: {
    id: 'ranger',
    name: '궁수',
    row: 'back',
    guard: { mode: 'never' },
    stats: { maxHp: 350, maxSp: 60, str: 46, int: 10, spd: 55, def: 10, mdef: 10 },
    skills: ['strike', 'flurry', 'venom', 'pierceShot'],
    rules: {
      rows: [
        row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 12 }), 'pierceShot'),
        row(always, 'strike'),
      ],
    },
  },
  mage: {
    id: 'mage',
    name: '마법사',
    row: 'back',
    guard: { mode: 'never' },
    stats: { maxHp: 300, maxSp: 120, str: 5, int: 62, spd: 35, def: 5, mdef: 20 },
    skills: ['strike', 'bolt', 'inferno', 'meditate'],
    rules: {
      rows: [
        row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 22 }), 'inferno'),
        row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 6 }), 'bolt'),
        row(always, 'meditate'),
      ],
    },
  },
  cleric: {
    id: 'cleric',
    name: '사제',
    row: 'back',
    guard: { mode: 'never' },
    stats: { maxHp: 340, maxSp: 110, str: 8, int: 52, spd: 38, def: 8, mdef: 18 },
    skills: ['strike', 'mend', 'prayer', 'resurrect', 'cleanse', 'ward'],
    rules: {
      rows: [
        row(atom({ kind: 'teamDeadCount', side: 'ally', cmp: 'gte', value: 1 }), 'resurrect'),
        row(atom({ kind: 'teamAnyHpPctBelow', side: 'ally', value: 50 }), 'mend'),
        row(always, 'strike'),
      ],
    },
  },
  disruptor: {
    id: 'disruptor',
    name: '교란자',
    row: 'back',
    guard: { mode: 'never' },
    stats: { maxHp: 330, maxSp: 80, str: 32, int: 30, spd: 72, def: 8, mdef: 12 },
    skills: ['strike', 'stagger', 'hush', 'venom'],
    rules: {
      rows: [
        row(atom({ kind: 'teamCastingCount', side: 'enemy', cmp: 'gte', value: 1 }), 'hush'),
        row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'venom'),
        row(always, 'strike'),
      ],
    },
  },
  berserker: {
    id: 'berserker',
    name: '광전사',
    row: 'front',
    guard: { mode: 'chance', pct: 25 },
    stats: { maxHp: 530, maxSp: 50, str: 66, int: 5, spd: 46, def: 8, mdef: 5 },
    skills: ['strike', 'flurry', 'sweep', 'warCry'],
    rules: {
      rows: [
        row(atom({ kind: 'selfActionCount', cmp: 'eq', value: 1 }), 'warCry', 1),
        row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 10 }), 'flurry'),
        row(always, 'strike'),
      ],
    },
  },
}

/** 프리셋을 복제해 팀을 만든다. 같은 프리셋을 여러 번 써도 상태가 공유되지 않는다. */
export function makeTeam(name: string, ids: string[]): TeamSetup {
  return {
    name,
    members: ids.map((id, i) => {
      const p = PRESETS[id]
      if (!p) throw new Error(`unknown preset: ${id}`)
      return structuredClone({ ...p, id: `${p.id}#${i}` })
    }),
  }
}

export const TEAMS: Record<string, () => TeamSetup> = {
  balanced: () => makeTeam('균형', ['bulwark', 'blade', 'ranger', 'mage', 'cleric']),
  rush: () => makeTeam('돌격', ['berserker', 'blade', 'bulwark', 'ranger', 'ranger']),
  control: () => makeTeam('제압', ['bulwark', 'disruptor', 'mage', 'cleric', 'ranger']),
  casters: () => makeTeam('마도', ['bulwark', 'bulwark', 'mage', 'mage', 'cleric']),
}
