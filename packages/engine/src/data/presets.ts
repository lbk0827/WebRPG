// M1 프리셋 단원 (§8.1). 직업 5종 — assets/manifest.json 의 jobs 키와 1:1.
// 스탯·보유 스킬 고정. 플레이어는 수칙과 편성만 바꾼다.
// 기본 수칙은 "그럭저럭 돌아가는" 수준으로 둔다 — 퍼즐은 이걸 고치는 데서 시작한다.
import type { CharSetup, Condition, RuleRow, TeamSetup } from '../types'

const always: Condition = { op: 'always' }
const atom = (a: Extract<Condition, { op: 'atom' }>['atom']): Condition => ({ op: 'atom', atom: a })
const row = (condition: Condition, skillId: string, maxUses?: number): RuleRow =>
  maxUses === undefined ? { condition, skillId } : { condition, skillId, maxUses }

export const PRESETS: Record<string, CharSetup> = {
  warrior: {
    id: 'warrior',
    name: '전사',
    row: 'front',
    guard: { mode: 'hpAbove', pct: 30 },
    stats: { maxHp: 560, maxSp: 50, str: 50, int: 5, dex: 20, spd: 32, luk: 10, def: 22, mdef: 9 },
    skills: ['strike', 'heavyBlow', 'sweep', 'warCry', 'sunder'],
    rules: {
      rows: [
        row(atom({ kind: 'selfActionCount', cmp: 'eq', value: 1 }), 'warCry', 1),
        row(atom({ kind: 'teamAliveCount', side: 'enemy', cmp: 'gte', value: 4 }), 'sweep'),
        row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'heavyBlow'),
        row(always, 'strike'),
      ],
    },
  },
  rogue: {
    id: 'rogue',
    name: '도적',
    row: 'front',
    guard: { mode: 'never' },
    stats: { maxHp: 380, maxSp: 70, str: 36, int: 20, dex: 52, spd: 70, luk: 20, def: 10, mdef: 10 },
    skills: ['strike', 'flurry', 'venom', 'stagger', 'hush'],
    rules: {
      rows: [
        row(atom({ kind: 'teamCastingCount', side: 'enemy', cmp: 'gte', value: 1 }), 'hush'),
        row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'venom'),
        row(always, 'strike'),
      ],
    },
  },
  mage: {
    id: 'mage',
    name: '마법사',
    row: 'back',
    guard: { mode: 'never' },
    stats: { maxHp: 300, maxSp: 120, str: 5, int: 62, dex: 16, spd: 35, luk: 15, def: 5, mdef: 20 },
    skills: ['strike', 'bolt', 'inferno', 'meditate'],
    rules: {
      rows: [
        row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 22 }), 'inferno'),
        row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 6 }), 'bolt'),
        row(always, 'meditate'),
      ],
    },
  },
  priest: {
    id: 'priest',
    name: '프리스트',
    row: 'back',
    guard: { mode: 'never' },
    stats: { maxHp: 340, maxSp: 110, str: 8, int: 52, dex: 20, spd: 38, luk: 25, def: 8, mdef: 18 },
    skills: ['strike', 'mend', 'prayer', 'resurrect', 'cleanse', 'ward'],
    rules: {
      rows: [
        row(atom({ kind: 'teamDeadCount', side: 'ally', cmp: 'gte', value: 1 }), 'resurrect'),
        row(atom({ kind: 'teamAnyHpPctBelow', side: 'ally', value: 50 }), 'mend'),
        row(always, 'strike'),
      ],
    },
  },
  elf: {
    id: 'elf',
    name: '엘프',
    row: 'back',
    guard: { mode: 'never' },
    stats: { maxHp: 350, maxSp: 60, str: 34, int: 10, dex: 56, spd: 55, luk: 20, def: 10, mdef: 10 },
    skills: ['strike', 'flurry', 'venom', 'pierceShot'],
    rules: {
      rows: [
        row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 12 }), 'pierceShot'),
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
  balanced: () => makeTeam('균형', ['warrior', 'warrior', 'elf', 'mage', 'priest']),
  rush: () => makeTeam('돌격', ['warrior', 'warrior', 'rogue', 'elf', 'elf']),
  control: () => makeTeam('제압', ['warrior', 'rogue', 'mage', 'priest', 'elf']),
  casters: () => makeTeam('마도', ['warrior', 'warrior', 'mage', 'mage', 'priest']),
}
