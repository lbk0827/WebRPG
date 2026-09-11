// 의뢰 지역 (M2-1). 가중치 조우 테이블 (합 정규화 안 함 — S12 채택), 순차 해금.
import type { BattleResult, TeamSetup } from '../types'
import { createRng } from '../rng'
import { MONSTERS, monsterSetup } from './monsters'

export interface RegionDef {
  id: string
  no: number
  name: string
  brief: string
  /** 권장 레벨 밴드 */
  recommended: [number, number]
  /** 등장 수 [최소, 최대] */
  count: [number, number]
  /** 가중치 테이블. 합은 아무 값이어도 된다 */
  table: { monsterId: string; weight: number }[]
  /** 해금 조건: 특정 지역에서 N승 */
  unlock?: { regionId: string; wins: number }
}

export const REGIONS: RegionDef[] = [
  {
    id: 'outskirts',
    no: 1,
    name: '마을 외곽',
    brief: '탈영병 몇이 마을 근처를 어슬렁거린다. 훈련이 안 된 자들이라 수칙이 한 줄뿐이다. 첫 의뢰로 알맞다.',
    recommended: [1, 3],
    count: [2, 3],
    table: [
      { monsterId: 'deserter', weight: 70 },
      { monsterId: 'deserterArcher', weight: 30 },
    ],
  },
  {
    id: 'highway',
    no: 2,
    name: '가도',
    brief: '상단이 도적단에 시달린다. 단검수는 독을 바르고 궁수는 후열을 노린다. 가끔 두목이 직접 나온다는 소문.',
    recommended: [3, 6],
    count: [3, 4],
    table: [
      { monsterId: 'banditKnife', weight: 50 },
      { monsterId: 'banditArcher', weight: 35 },
      { monsterId: 'banditBoss', weight: 8 },
    ],
    unlock: { regionId: 'outskirts', wins: 3 },
  },
  {
    id: 'fort',
    no: 3,
    name: '폐허 요새',
    brief: '경쟁 용병단이 요새를 선점했다. 우리와 같은 직업, 제대로 된 수칙. 여기서부터는 상대도 수칙을 짠다.',
    recommended: [6, 10],
    count: [4, 5],
    table: [
      { monsterId: 'rivalWarrior', weight: 25 },
      { monsterId: 'rivalRogue', weight: 20 },
      { monsterId: 'rivalMage', weight: 20 },
      { monsterId: 'rivalPriest', weight: 15 },
      { monsterId: 'rivalElf', weight: 20 },
    ],
    unlock: { regionId: 'highway', wins: 3 },
  },
  {
    id: 'valley',
    no: 4,
    name: '늑대 골짜기',
    brief: '사람이 아니라 짐승이다. 수는 많고 발이 빠르다. 우리가 한 번 움직일 때 저쪽은 두 번 움직인다.',
    recommended: [9, 13],
    count: [4, 5],
    table: [
      { monsterId: 'batSwarm', weight: 40 },
      { monsterId: 'wildDog', weight: 40 },
      { monsterId: 'starvingDog', weight: 20 },
    ],
    unlock: { regionId: 'fort', wins: 3 },
  },
  {
    id: 'goblinCamp',
    no: 5,
    name: '고블린 부락',
    brief: '고블린은 약하지만 주술사가 섞여 있다. 긴 준비 동작이 보이면 끊어라 — 안 끊으면 불덩이가 온다.',
    recommended: [12, 16],
    count: [3, 5],
    table: [
      { monsterId: 'goblin', weight: 40 },
      { monsterId: 'goblinFighter', weight: 30 },
      { monsterId: 'goblinShaman', weight: 22 },
      { monsterId: 'goblinChief', weight: 8 },
    ],
    unlock: { regionId: 'valley', wins: 3 },
  },
  {
    id: 'webwood',
    no: 6,
    name: '거미 숲',
    brief: '독이 쌓이면 가만히 서 있어도 줄어든다. 정화를 수칙에 넣지 않았다면 지금이 그때다.',
    recommended: [15, 20],
    count: [3, 5],
    table: [
      { monsterId: 'spider', weight: 40 },
      { monsterId: 'greatSpider', weight: 30 },
      { monsterId: 'harpy', weight: 30 },
    ],
    unlock: { regionId: 'goblinCamp', wins: 3 },
  },
  {
    id: 'citadel',
    no: 7,
    name: '무너진 성채',
    brief: '거북은 엄호하고 스스로를 굳힌다. 전열을 정면으로 때려서는 답이 없다 — 엄호를 무시하거나 뒤를 쳐라.',
    recommended: [19, 24],
    count: [4, 5],
    table: [
      { monsterId: 'rockTurtle', weight: 35 },
      { monsterId: 'harpyFlock', weight: 30 },
      { monsterId: 'ogreVanguard', weight: 35 },
    ],
    unlock: { regionId: 'webwood', wins: 3 },
  },
  {
    id: 'abyss',
    no: 8,
    name: '심연의 굴',
    brief: '오우거의 수칙은 우리 것과 같은 수준이다. 첫 수에 스스로를 올리고, 넷 이상이면 쓸어버리고, 성한 자를 골라 갑주를 부순다.',
    recommended: [23, 30],
    count: [3, 5],
    table: [
      { monsterId: 'ogre', weight: 35 },
      { monsterId: 'rockTurtle', weight: 25 },
      { monsterId: 'greatSpider', weight: 30 },
      { monsterId: 'abyssOgre', weight: 10 },
    ],
    unlock: { regionId: 'citadel', wins: 3 },
  },
]

export const REGION_BY_ID: Record<string, RegionDef> = Object.fromEntries(REGIONS.map((r) => [r.id, r]))

export function isRegionUnlocked(region: RegionDef, wins: Record<string, number>): boolean {
  if (!region.unlock) return true
  return (wins[region.unlock.regionId] ?? 0) >= region.unlock.wins
}

/** 조우 생성. 같은 시드면 같은 편성 — 리플레이는 시드만 저장하면 된다 */
export function rollEncounter(region: RegionDef, seed: number): TeamSetup {
  const rng = createRng(seed ^ 0x5eed)
  const n = region.count[0] + rng.int(region.count[1] - region.count[0] + 1)
  const total = region.table.reduce((s, t) => s + t.weight, 0)
  const picks: string[] = []
  for (let i = 0; i < n; i++) {
    let r = rng.int(total)
    for (const t of region.table) {
      r -= t.weight
      if (r < 0) {
        picks.push(t.monsterId)
        break
      }
    }
  }
  // 같은 이름이 겹치면 번호를 붙인다
  const seen: Record<string, number> = {}
  const members = picks.map((id, idx) => {
    const def = MONSTERS[id]
    const setup = monsterSetup(def, idx)
    seen[def.name] = (seen[def.name] ?? 0) + 1
    return setup
  })
  const dup = new Set(Object.keys(seen).filter((k) => seen[k] > 1))
  const counter: Record<string, number> = {}
  for (const m of members) {
    if (dup.has(m.name)) {
      counter[m.name] = (counter[m.name] ?? 0) + 1
      m.name = `${m.name} ${counter[m.name]}`
    }
  }
  return { name: region.name, members }
}

export interface Rewards {
  /** 드롭된 재료 id 목록 (몬스터당 최대 1) */
  drops: string[]
  exp: number
  gold: number
}

/** 승리: 전부 / 패배·무승부: 경험치 30%, 금 0 */
/**
 * 보상. 승리면 전액 + 드롭, 패배면 경험치 30%·금 0·드롭 없음.
 * 드롭은 몬스터마다 테이블을 위에서부터 굴려 처음 당첨된 것 하나 (S12). seed 를 주면 결정론 — 같은 전투는 같은 드롭.
 */
export function battleRewards(result: BattleResult, enemy: TeamSetup, seed?: number): Rewards {
  const exp = enemy.members.reduce((s, m) => s + (m.monster?.exp ?? 0), 0)
  const gold = enemy.members.reduce((s, m) => s + (m.monster?.gold ?? 0), 0)
  if (result.outcome !== 'team0') return { exp: Math.floor(exp * 0.3), gold: 0, drops: [] }
  const drops: string[] = []
  if (seed !== undefined) {
    const rng = createRng(seed ^ 0xd201)
    for (const m of enemy.members) {
      for (const d of m.monster?.drops ?? []) {
        if (rng.int(10000) < d.permyriad) {
          drops.push(d.itemId)
          break
        }
      }
    }
  }
  return { exp, gold, drops }
}
