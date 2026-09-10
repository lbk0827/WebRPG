// 훈련 과제 (docs/05 §8.2). 정해진 상황 + 목표를 주고 수칙을 고쳐 달성하게 하는 한 판.
// 튜토리얼이자 첫 게임 콘텐츠. 각 과제는 test/missions.test.ts 에서
// "기본 수칙은 지고 solution 은 이긴다"가 검증되어야 한다.
import type { BattleResult, CharSetup, Condition, GuardPolicy, Row, RuleRow, RuleSet, Stats, TeamSetup } from '../types'
import { PRESETS } from './presets'
import { SKILLS } from './skills'

export interface MissionChar {
  job: string
  /** 표시 이름. 생략 시 직업명 */
  name?: string
  /** 훈련용 상대는 스탯을 덮어쓸 수 있다 (예: 허수아비) */
  stats?: Partial<Stats>
  /** 보유 스킬 덮어쓰기 (훈련용 상대 전용 스킬 등) */
  skills?: string[]
  row?: Row
  guard?: GuardPolicy
  rules: RuleSet
}

export interface MissionLimits {
  /** 조항 순서만 바꿀 수 있다 (추가·삭제·조건 편집 불가) */
  reorderOnly?: boolean
  /** 엄호 방침만 바꿀 수 있다 */
  guardOnly?: boolean
  /** 조항 수 상한 */
  maxRows?: number
}

/** 편집 가능한 슬롯에 대한 플레이어의 변경분 */
export interface SlotOverride {
  rules?: RuleSet
  guard?: GuardPolicy
  row?: Row
}

export interface MissionObjective {
  /** 전투 종료 시 살아 있어야 하는 플레이어 슬롯 */
  aliveSlots?: number[]
  /** 전투 중 한 번 이상 소생되어야 하는 플레이어 슬롯 */
  revivedSlots?: number[]
  /** 특정 스킬을 N회 이상 사용해야 한다 (배우려는 개념을 직접 판정) */
  skillUses?: { skillId: string; min: number }
}

export interface Mission {
  id: string
  no: number
  title: string
  /** 상황 설명 (2~3문장) */
  brief: string
  /** 목표 (한 줄) */
  goal: string
  /** 배우는 것 (짧게) */
  lesson: string
  /** 실패 후 보여줄 힌트 */
  hint: string
  seed: number
  /** 승리 외의 추가 목표. 생략 시 승리만으로 완료 */
  objective?: MissionObjective
  player: MissionChar[]
  enemy: MissionChar[]
  /** 편집 가능한 플레이어 슬롯 인덱스 */
  editable: number[]
  limits?: MissionLimits
  /** 검증용 정답. editable 순서대로 */
  solution: SlotOverride[]
}

export interface Verdict {
  cleared: boolean
  /** 미달 사유 (사람이 읽는 문장) */
  failed: string[]
}

/** 과제 완료 판정: 승리 + objective */
export function judgeMission(m: Mission, result: BattleResult): Verdict {
  const failed: string[] = []
  if (result.outcome !== 'team0') failed.push(result.outcome === 'draw' ? '무승부로 끝났다' : '전투에서 졌다')

  const nameOf = (slot: number): string => m.player[slot].name ?? PRESETS[m.player[slot].job].name
  if (m.objective?.skillUses) {
    const { skillId, min } = m.objective.skillUses
    const used = result.events.filter((e) => e.t === 'ruleFired' && e.actor.team === 0 && e.skillId === skillId).length
    if (used < min) failed.push(`${SKILLS[skillId]?.label ?? skillId}을(를) ${min}회 이상 써야 한다 (${used}회)`)
  }
  if (m.objective?.aliveSlots || m.objective?.revivedSlots) {
    const alive = m.player.map(() => true)
    const revived = m.player.map(() => false)
    for (const e of result.events) {
      if (e.t === 'death' && e.target.team === 0) alive[e.target.index] = false
      else if (e.t === 'revive' && e.target.team === 0) {
        alive[e.target.index] = true
        revived[e.target.index] = true
      }
    }
    for (const slot of m.objective.aliveSlots ?? []) if (!alive[slot]) failed.push(`${nameOf(slot)}가 쓰러진 채로 전투가 끝났다`)
    for (const slot of m.objective.revivedSlots ?? []) if (!revived[slot]) failed.push(`${nameOf(slot)}를 한 번도 일으키지 못했다`)
  }
  return { cleared: failed.length === 0, failed }
}

const always: Condition = { op: 'always' }
const atom = (a: Extract<Condition, { op: 'atom' }>['atom']): Condition => ({ op: 'atom', atom: a })
const row = (condition: Condition, skillId: string, maxUses?: number): RuleRow =>
  maxUses === undefined ? { condition, skillId } : { condition, skillId, maxUses }
const rules = (...rows: RuleRow[]): RuleSet => ({ rows })
const strikeOnly = rules(row(always, 'strike'))

export function missionChar(mc: MissionChar, idx: number): CharSetup {
  const p = PRESETS[mc.job]
  if (!p) throw new Error(`unknown job: ${mc.job}`)
  return {
    id: `${p.id}#${idx}`,
    name: mc.name ?? p.name,
    row: mc.row ?? p.row,
    guard: structuredClone(mc.guard ?? p.guard),
    stats: { ...p.stats, ...mc.stats },
    skills: [...(mc.skills ?? p.skills)],
    rules: structuredClone(mc.rules),
  }
}

/** 과제의 두 팀을 만든다. overrides 는 editable 슬롯 인덱스 → 변경분 */
export function missionTeams(m: Mission, overrides: Record<number, SlotOverride> = {}): [TeamSetup, TeamSetup] {
  const player: TeamSetup = {
    name: '내 용병단',
    members: m.player.map((mc, i) => {
      const o = overrides[i]
      const c = missionChar({ ...mc, rules: o?.rules ?? mc.rules, guard: o?.guard ?? mc.guard, row: o?.row ?? mc.row }, i)
      return c
    }),
  }
  const enemy: TeamSetup = { name: '훈련 상대', members: m.enemy.map(missionChar) }
  return [player, enemy]
}

/** solution 을 overrides 형태로 */
export function solutionOverrides(m: Mission): Record<number, SlotOverride> {
  const out: Record<number, SlotOverride> = {}
  m.editable.forEach((slot, k) => {
    if (m.solution[k]) out[slot] = m.solution[k]
  })
  return out
}

// ─────────────────────────────────────────────────────────────
// 과제 목록. 한 과제에 한 개념.

export const MISSIONS: Mission[] = [
  {
    id: 'order',
    no: 1,
    title: '조항의 순서',
    brief:
      '훈련 교관과 1:1 대련이다. 내 전사는 강타를 알고 있지만, 수칙 1번이 "항상 → 기본 공격"이라 강타 조항까지 내려가지 못한다. 수칙은 위에서부터 읽고, 처음 맞는 조항에서 멈춘다.',
    goal: '조항의 순서만 바꿔서 교관을 이겨라',
    lesson: '수칙은 위에서부터 평가되고, 처음 참인 조항에서 멈춘다',
    hint: '"항상"은 언제나 참이다. 항상인 조항 아래의 조항은 절대 실행되지 않는다. 강타를 위로 올려라.',
    seed: 101,
    player: [{ job: 'warrior', rules: rules(row(always, 'strike'), row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'heavyBlow')) }],
    enemy: [{ job: 'warrior', name: '교관', stats: { maxHp: 700, maxSp: 0 }, guard: { mode: 'never' }, rules: strikeOnly }],
    editable: [0],
    limits: { reorderOnly: true },
    solution: [{ rules: rules(row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'heavyBlow'), row(always, 'strike')) }],
  },
  {
    id: 'fallback',
    no: 2,
    title: '빈손으로 서 있지 마라',
    brief:
      '마법사의 수칙은 "SP 22 이상 → 대화염" 하나뿐이다. SP가 떨어지면 맞는 조항이 없어 우물쭈물하며 차례를 넘긴다. 전사가 앞에서 버티는 동안 마법사는 멍하니 서 있다.',
    goal: 'SP가 떨어져도 뭔가 하도록 조항을 추가해서 이겨라',
    lesson: '모든 조항이 거짓이면 아무것도 하지 않는다 — 마지막엔 항상 실행되는 조항(fallback)을 둔다',
    hint: '맨 아래에 "항상 → 명상" 또는 "항상 → 마력탄"을 추가하라. 명상은 SP를 회복한다.',
    seed: 102,
    player: [
      { job: 'warrior', guard: { mode: 'always' }, rules: strikeOnly },
      { job: 'mage', stats: { maxSp: 70 }, rules: rules(row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 22 }), 'inferno')) },
    ],
    enemy: [
      { job: 'warrior', name: '교관', stats: { maxHp: 900, str: 30, maxSp: 0 }, guard: { mode: 'never' }, rules: strikeOnly },
      { job: 'warrior', name: '교관', stats: { maxHp: 900, str: 30, maxSp: 0 }, guard: { mode: 'never' }, rules: strikeOnly },
    ],
    editable: [1],
    solution: [
      {
        rules: rules(
          row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 22 }), 'inferno'),
          row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 6 }), 'bolt'),
          row(always, 'meditate'),
        ),
      },
    ],
  },
  {
    id: 'threshold',
    no: 3,
    title: '치료는 늦으면 소용없다',
    brief:
      '프리스트의 치유 조항은 "아군 HP 10% 이하 → 치유"다. 전사는 10%가 되기 전에 한 방에 쓰러진다. 임계값이 문제다.',
    goal: '치유 조건의 숫자를 고쳐서 전사를 살리고 이겨라',
    lesson: '조건의 임계값이 곧 타이밍이다. 너무 늦으면 발동할 기회가 없다',
    hint: '10%를 50~60%로 올려라. 큰 피해를 받기 전에 회복이 들어가야 한다.',
    seed: 103,
    player: [
      { job: 'warrior', guard: { mode: 'always' }, rules: rules(row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'heavyBlow'), row(always, 'strike')) },
      { job: 'priest', rules: rules(row(atom({ kind: 'teamAnyHpPctBelow', side: 'ally', value: 10 }), 'mend'), row(always, 'strike')) },
    ],
    enemy: [
      { job: 'warrior', name: '교관', stats: { maxHp: 520, str: 40, maxSp: 0 }, guard: { mode: 'never' }, rules: strikeOnly },
      { job: 'warrior', name: '교관', stats: { maxHp: 520, str: 40, maxSp: 0 }, guard: { mode: 'never' }, rules: strikeOnly },
    ],
    editable: [1],
    solution: [{ rules: rules(row(atom({ kind: 'teamAnyHpPctBelow', side: 'ally', value: 60 }), 'mend'), row(always, 'strike')) }],
  },
  {
    id: 'guard',
    no: 4,
    title: '누가 앞에 서는가',
    brief:
      '적 도적 둘이 후열의 마법사를 노린다. 전사는 앞에 있지만 엄호 방침이 "엄호 안 함"이라 옆에서 구경만 한다. 후열을 노린 공격은 전열이 대신 맞아줄 수 있다.',
    goal: '전사의 엄호 방침을 바꿔서 마법사를 지키고 이겨라',
    lesson: '전열의 엄호 방침이 후열의 생존을 결정한다',
    hint: '전사의 엄호를 "항상 엄호"로. 전사는 방어력이 높아 같은 공격도 덜 아프다.',
    seed: 104,
    player: [
      { job: 'warrior', guard: { mode: 'never' }, rules: strikeOnly },
      { job: 'mage', rules: rules(row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 6 }), 'bolt'), row(always, 'meditate')) },
    ],
    enemy: [
      { job: 'rogue', name: '습격자', stats: { maxSp: 0, str: 44 }, rules: strikeOnly },
      { job: 'rogue', name: '습격자', stats: { maxSp: 0, str: 44 }, rules: strikeOnly },
    ],
    editable: [0],
    limits: { guardOnly: true },
    solution: [{ guard: { mode: 'always' } }],
  },
  {
    id: 'interrupt',
    no: 5,
    title: '시전을 끊어라',
    brief:
      '적 마법사의 대화염이 우리 셋을 통째로 태운다. 대화염은 시전 시간이 길다 — 시전 중인 적은 조건으로 관측할 수 있고, 도적의 침묵은 시전 중인 적만 노린다.',
    goal: '도적이 적 마법사의 시전을 끊게 만들어 이겨라',
    lesson: '적의 상태를 관측하는 조건 — 이 게임의 심장. 상대가 무엇을 하려는지 보고 대응한다',
    hint: '도적의 1번 조항에 "적군 시전 중 1명 이상 → 침묵"을 넣어라. 흔들기도 된다.',
    seed: 105,
    player: [
      { job: 'warrior', guard: { mode: 'always' }, rules: rules(row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'heavyBlow'), row(always, 'strike')) },
      { job: 'rogue', stats: { maxSp: 100 }, rules: rules(row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'venom'), row(always, 'strike')) },
      { job: 'priest', rules: rules(row(atom({ kind: 'teamAnyHpPctBelow', side: 'ally', value: 50 }), 'mend'), row(always, 'strike')) },
    ],
    enemy: [
      { job: 'warrior', name: '호위병', stats: { maxHp: 700, str: 45, maxSp: 0 }, guard: { mode: 'always' }, rules: strikeOnly },
      { job: 'mage', name: '적 마법사', stats: { maxHp: 360, maxSp: 240, int: 85 }, rules: rules(row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 22 }), 'inferno'), row(always, 'bolt')) },
    ],
    editable: [1],
    solution: [
      {
        rules: rules(
          row(atom({ kind: 'teamCastingCount', side: 'enemy', cmp: 'gte', value: 1 }), 'hush'),
          row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'venom'),
          row(always, 'strike'),
        ),
      },
    ],
  },
  {
    id: 'opener',
    no: 6,
    title: '함성은 한 번이면 된다',
    brief:
      '전사의 1번 조항이 "항상 → 전의 고양"이다. 공격력은 오르지만, 매 차례 함성만 지르다 SP가 바닥난 뒤에야 칼을 든다. 첫 행동에만 쓰고 싶다.',
    goal: '전의 고양을 딱 한 번만 쓰게 만들어 이겨라',
    lesson: '"N회만"과 "내 N번째 행동" — 오프닝 무브를 지정하는 두 방법',
    hint: '조항 오른쪽의 "회만"에 1을 넣거나, 조건을 "내 행동 횟수 정확히 1"로 바꿔라.',
    seed: 106,
    player: [{ job: 'warrior', rules: rules(row(always, 'warCry'), row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'heavyBlow'), row(always, 'strike')) }],
    enemy: [{ job: 'warrior', name: '교관', stats: { maxHp: 760, maxSp: 0 }, guard: { mode: 'never' }, rules: strikeOnly }],
    editable: [0],
    solution: [{ rules: rules(row(always, 'warCry', 1), row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'heavyBlow'), row(always, 'strike')) }],
  },
  {
    id: 'revive',
    no: 7,
    title: '쓰러진 자를 일으켜라',
    brief:
      '적 암살자가 첫 두 발로 엘프를 쓰러뜨린다. 막을 수는 없다. 하지만 프리스트는 소생을 안다 — 소생은 "쓰러진 아군"이 있을 때만 대상을 찾고, 없으면 그 조항은 건너뛰고 다음으로 간다. 그러니 맨 위에 둬도 안전하다.',
    goal: '쓰러진 엘프를 한 번이라도 일으켜 세우고 이겨라 (이기는 것만으로는 부족하다)',
    lesson: '한정형 대상 스킬(소생·침묵·정화)은 대상이 없으면 실패하고 다음 조항으로 넘어간다',
    hint: '프리스트 1번 조항에 "아군 전사자 1명 이상 → 소생"을 넣어라. 전사자가 없을 땐 자동으로 건너뛰니 맨 위가 안전하다.',
    seed: 107,
    objective: { revivedSlots: [1] },
    player: [
      { job: 'warrior', guard: { mode: 'never' }, rules: rules(row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'heavyBlow'), row(always, 'strike')) },
      { job: 'elf', stats: { maxHp: 200 }, rules: rules(row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 12 }), 'pierceShot'), row(always, 'strike')) },
      { job: 'priest', row: 'front', rules: rules(row(atom({ kind: 'teamAnyHpPctBelow', side: 'ally', value: 30 }), 'mend'), row(always, 'strike')) },
    ],
    enemy: [
      { job: 'elf', name: '암살자', stats: { maxHp: 260, str: 120, dex: 120, spd: 90, maxSp: 24 }, rules: rules(row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 12 }), 'pierceShot'), row(always, 'strike')) },
      { job: 'warrior', name: '교관', stats: { maxHp: 700, str: 40, maxSp: 0 }, guard: { mode: 'never' }, rules: strikeOnly },
    ],
    editable: [2],
    solution: [
      {
        rules: rules(
          row(atom({ kind: 'teamDeadCount', side: 'ally', cmp: 'gte', value: 1 }), 'resurrect'),
          row(atom({ kind: 'teamAnyHpPctBelow', side: 'ally', value: 30 }), 'mend'),
          row(always, 'strike'),
        ),
      },
    ],
  },
  {
    id: 'aoe',
    no: 8,
    title: '많을 땐 휩쓸어라',
    brief:
      '잡병 넷이 몰려온다. 전사의 수칙은 강타 → 기본 공격뿐이라 한 놈씩 찍어 넘어뜨리는 동안 나머지 셋이 계속 때린다. 휩쓸기는 적 전원을 한 번에 친다 — 적이 많을 때만.',
    goal: '적이 많을 땐 휩쓸고, 적을 땐 찍어서 이겨라',
    lesson: '"적군 생존자 수" 조건 — 광역과 단일을 상황으로 고른다',
    hint: '1번 조항에 "적군 생존자 3명 이상 → 휩쓸기"를 넣어라. 셋 이하로 줄면 강타로 넘어간다.',
    seed: 108,
    player: [{ job: 'warrior', rules: rules(row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'heavyBlow'), row(always, 'strike')) }],
    enemy: [0, 1, 2, 3].map(() => ({
      job: 'warrior' as const,
      name: '잡병',
      stats: { maxHp: 150, str: 27, def: 5, maxSp: 0 },
      guard: { mode: 'never' as const },
      rules: strikeOnly,
    })),
    editable: [0],
    solution: [
      {
        rules: rules(
          row(atom({ kind: 'teamAliveCount', side: 'enemy', cmp: 'gte', value: 3 }), 'sweep'),
          row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'heavyBlow'),
          row(always, 'strike'),
        ),
      },
    ],
  },
  {
    id: 'cleanse',
    no: 9,
    title: '독을 풀어라',
    brief:
      '적 독술사 둘이 맹독을 바른다. 중독된 단원은 자기 차례마다 피가 빠진다. 프리스트는 치유로 버티려 하지만 독이 계속 흐르는 한 밑 빠진 독이다. 정화는 디버프에 걸린 아군만 노린다.',
    goal: '프리스트가 독을 세 번 이상 풀게 만들고 이겨라 (이기는 것만으로는 부족하다)',
    lesson: '"아군 중 [상태] N명 이상" 조건 — 상태이상을 관측하고 대응한다',
    hint: '프리스트 1번 조항에 "아군 중 [중독] 1명 이상 → 정화"를 넣어라. 정화는 중독자가 없으면 자동으로 건너뛴다.',
    seed: 109,
    objective: { skillUses: { skillId: 'cleanse', min: 3 } },
    player: [
      { job: 'warrior', guard: { mode: 'never' }, rules: rules(row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'heavyBlow'), row(always, 'strike')) },
      { job: 'priest', rules: rules(row(atom({ kind: 'teamAnyHpPctBelow', side: 'ally', value: 50 }), 'mend'), row(always, 'strike')) },
    ],
    enemy: [
      { job: 'rogue', name: '독술사', skills: ['strike', 'venomStrong'], stats: { maxHp: 340, maxSp: 32, str: 20, dex: 36, spd: 50 }, rules: rules(row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'venomStrong'), row(always, 'strike')) },
      { job: 'rogue', name: '독술사', skills: ['strike', 'venomStrong'], stats: { maxHp: 340, maxSp: 32, str: 20, dex: 36, spd: 50 }, rules: rules(row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'venomStrong'), row(always, 'strike')) },
    ],
    editable: [1],
    solution: [
      {
        rules: rules(
          row(atom({ kind: 'teamStatusCount', side: 'ally', status: 'poison', cmp: 'gte', value: 1 }), 'cleanse'),
          row(atom({ kind: 'teamAnyHpPctBelow', side: 'ally', value: 50 }), 'mend'),
          row(always, 'strike'),
        ),
      },
    ],
  },
  {
    id: 'notagain',
    no: 10,
    title: '이미 걸린 건 다시 걸지 마라',
    brief:
      '갑주 파쇄는 적의 방어를 깎지만 위력은 약하다. 전사의 수칙은 SP만 있으면 갑주 파쇄를 반복한다 — 이미 걸려 있는 적에게 또. 강타 조항은 그 아래에 묻혀 있다. 방어 약화는 한 번이면 충분하고, 그 뒤엔 강타가 제값을 한다.',
    goal: '방어 약화가 걸려 있지 않을 때만 갑주 파쇄를 쓰게 만들어 이겨라',
    lesson: '"N명 정확히 0" 조건 = "없을 때". 상태가 없을 때만 거는 법',
    hint: '갑주 파쇄 조항의 조건을 "적군 중 [방어 약화] 0명 정확히"로 바꿔라. 걸려 있으면 건너뛰고 강타로 간다.',
    seed: 110,
    player: [
      {
        job: 'warrior',
        rules: rules(
          row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'sunder'),
          row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'heavyBlow'),
          row(always, 'strike'),
        ),
      },
    ],
    enemy: [{ job: 'warrior', name: '교관', stats: { maxHp: 760, str: 42, maxSp: 0 }, guard: { mode: 'never' }, rules: strikeOnly }],
    editable: [0],
    solution: [
      {
        rules: rules(
          row(atom({ kind: 'teamStatusCount', side: 'enemy', status: 'defDown', cmp: 'eq', value: 0 }), 'sunder'),
          row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'heavyBlow'),
          row(always, 'strike'),
        ),
      },
    ],
  },
  {
    id: 'average',
    no: 11,
    title: '전체가 아프면 전체를 치료하라',
    brief:
      '적 전사 둘이 휩쓸기를 연달아 쓴다. 우리 다섯이 골고루 깎인다. 프리스트의 치유는 한 명씩만 고쳐서 따라가지 못한다. 기원은 아군 전원을 회복하지만 시전이 길고 비싸다 — 전체가 아플 때만 쓸 가치가 있다.',
    goal: '아군 전체의 상태를 보고 기원을 쓰게 만들어 이겨라',
    lesson: '"아군 평균 HP" 조건 — 개인이 아니라 전황을 집계해서 판단한다',
    hint: '프리스트 1번 조항에 "아군 평균 HP 65% 이하 → 기원"을 넣어라. 치유 조항은 그 아래에 남겨둔다.',
    seed: 111,
    player: [
      { job: 'warrior', guard: { mode: 'hpAbove', pct: 30 }, rules: rules(row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'heavyBlow'), row(always, 'strike')) },
      { job: 'rogue', rules: rules(row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 8 }), 'venom'), row(always, 'strike')) },
      { job: 'elf', rules: rules(row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 12 }), 'pierceShot'), row(always, 'strike')) },
      { job: 'mage', rules: rules(row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 6 }), 'bolt'), row(always, 'meditate')) },
      { job: 'priest', rules: rules(row(atom({ kind: 'teamAnyHpPctBelow', side: 'ally', value: 50 }), 'mend'), row(always, 'strike')) },
    ],
    enemy: [
      { job: 'warrior', name: '돌격대장', stats: { maxHp: 1500, str: 62, maxSp: 140 }, guard: { mode: 'never' }, rules: rules(row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 14 }), 'sweep'), row(always, 'strike')) },
      { job: 'warrior', name: '돌격대장', stats: { maxHp: 1500, str: 62, maxSp: 140 }, guard: { mode: 'never' }, rules: rules(row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 14 }), 'sweep'), row(always, 'strike')) },
    ],
    editable: [4],
    solution: [
      {
        rules: rules(
          row(atom({ kind: 'teamAvgHpPct', side: 'ally', cmp: 'lte', value: 65 }), 'prayer'),
          row(atom({ kind: 'teamAnyHpPctBelow', side: 'ally', value: 50 }), 'mend'),
          row(always, 'strike'),
        ),
      },
    ],
  },
  {
    id: 'nocast',
    no: 12,
    title: '끊기는 기술은 버려라',
    brief:
      '이번엔 우리가 끊기는 쪽이다. 적 방해꾼은 빠르고, 시전 중인 상대를 보면 어김없이 침묵을 건다. 마법사가 대화염을 준비할 때마다 끊기고, SP 22와 두 차례를 날린다. 마력탄은 시전이 없어 끊기지 않는다 — 약하지만 확실하다.',
    goal: '마법사가 끊기지 않게 수칙을 짜서 이겨라',
    lesson: '시전이 있는 기술은 끊긴다. 끊기 전문 상대에겐 강한 기술을 버리고 즉발기로 간다',
    hint: '대화염 조항을 지우거나 맨 아래로 내려라. "내 SP 6 이상 → 마력탄", "항상 → 명상"이면 충분하다.',
    seed: 112,
    player: [
      { job: 'warrior', guard: { mode: 'always' }, rules: strikeOnly },
      { job: 'mage', stats: { spd: 45 }, rules: rules(row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 22 }), 'inferno'), row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 6 }), 'bolt'), row(always, 'meditate')) },
    ],
    enemy: [
      { job: 'rogue', name: '방해꾼', stats: { maxHp: 360, maxSp: 120, str: 30, spd: 170 }, rules: rules(row(atom({ kind: 'teamCastingCount', side: 'enemy', cmp: 'gte', value: 1 }), 'hush'), row(always, 'strike')) },
      { job: 'warrior', name: '교관', stats: { maxHp: 680, str: 36, maxSp: 0 }, guard: { mode: 'always' }, rules: strikeOnly },
    ],
    editable: [1],
    solution: [
      {
        rules: rules(
          row(atom({ kind: 'selfSpAbs', cmp: 'gte', value: 6 }), 'bolt'),
          row(always, 'meditate'),
        ),
      },
    ],
  },
]

export const MISSION_BY_ID: Record<string, Mission> = Object.fromEntries(MISSIONS.map((m) => [m.id, m]))
