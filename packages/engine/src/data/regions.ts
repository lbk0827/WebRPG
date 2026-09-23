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
  /**
   * 이 지역이 기대하는 편성 (M2-7).
   *
   * 기본은 `'base'` — 장비 없이 직업 기본 수칙만으로도 권장 하한에서 해볼 만해야 한다
   * (`test/balance.test.ts` 가 40% 이상을 요구한다).
   *
   * `'advanced'` 는 **전직이 전제인 지역**이다. 만렙이 30 이라 레벨로는 더 어렵게 만들 수 없고,
   * 기준 편성이 이길 수 있게 잡으면 전직 편성은 90% 를 넘어 측정 신호가 뭉개진다 (docs/18 §13·§14).
   * 그래서 문턱을 레벨이 아니라 **설계**로 옮겼다 — 기준 편성은 지고, 전직 + 훅 수칙이어야 해볼 만하다.
   */
  expects?: 'base' | 'advanced'
  /**
   * 엘리트 조우 (docs/30). 판마다 `pct`% 확률로 무작위 조우 대신 **고정 조합**이 통째로 나온다.
   * 기본 수칙의 약점을 찌르는 조합이라 "몬스터가 교재" 를 가장 직접 보여 준다.
   * 확률은 별도 난수로 굴린다 — 엘리트가 아닌 판은 이 필드가 없을 때와 같은 적이 나온다.
   */
  elites?: EliteDef[]
}

export interface EliteDef {
  id: string
  /** 표시 이름 ("봉화 조") */
  name: string
  /** 한 줄 설명 — 무엇을 조심해야 하나 */
  brief: string
  /** 판당 등장 확률 % */
  pct: number
  /** 고정 상대 (몬스터 id 순서대로) */
  foes: string[]
}

export const REGIONS: RegionDef[] = [
  {
    id: 'outskirts',
    no: 1,
    name: '마을 외곽',
    brief: '탈영병 한둘이 마을 근처를 어슬렁거린다. 훈련이 안 된 자들이라 수칙이 한 줄뿐이다. 혼자서도 해볼 만한 첫 의뢰.',
    recommended: [1, 3],
    // 새 게임은 주인공 한 명으로 시작한다 (docs/20). 2~3명이면 혼자 Lv1 30% · Lv5 에도 55% 에 막혔다 → 1~2명: Lv1 78% · Lv2 97%
    count: [1, 2],
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
    elites: [{
      id: 'signalCrew', name: '봉화 조', pct: 12,
      brief: '뒤의 신호수 둘이 번갈아 봉화를 올린다. 올라갈 때마다 단검수가 세지고 빨라진다 — 준비 동작을 끊어라.',
      foes: ['banditKnife', 'banditKnife', 'banditSignaller', 'banditSignaller'],
    }],
  },
  {
    id: 'fort',
    no: 3,
    name: '폐허 요새',
    brief: '경쟁 용병단이 요새를 선점했다. 우리와 같은 직업, 제대로 된 수칙. 뒤에 선 프리스트를 놔두면 앞이 죽지 않는다.',
    recommended: [6, 10],
    count: [4, 5],
    table: [
      { monsterId: 'rivalWarrior', weight: 22 },
      { monsterId: 'rivalRogue', weight: 18 },
      { monsterId: 'rivalMage', weight: 18 },
      { monsterId: 'rivalPriest', weight: 24 },
      { monsterId: 'rivalElf', weight: 18 },
    ],
    unlock: { regionId: 'highway', wins: 3 },
    elites: [{
      id: 'shieldWall', name: '방벽 조', pct: 12,
      brief: '방패수 둘이 늘 엄호하고 뒤에서 프리스트가 되돌린다. 치유 주문을 끊을 SP 를 독에 쓰지 마라.',
      foes: ['rivalBulwark', 'rivalBulwark', 'rivalRogue', 'rivalPriest', 'rivalMage'],
    }],
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
    brief: '고블린은 약하지만 주술사가 섞여 있다. 긴 준비 동작이 보이면 끊어라. 놔두면 불덩이가 오거나 동료가 되살아난다.',
    recommended: [12, 16],
    count: [3, 5],
    table: [
      { monsterId: 'goblin', weight: 40 },
      { monsterId: 'goblinFighter', weight: 30 },
      { monsterId: 'goblinShaman', weight: 22 },
      { monsterId: 'goblinChief', weight: 8 },
    ],
    unlock: { regionId: 'valley', wins: 3 },
    elites: [{
      id: 'disruptors', name: '방해꾼 조', pct: 12,
      brief: '방해꾼 둘이 긴 준비 동작을 보는 족족 끊는다. 큰 기술은 그들이 쓰러진 뒤로 미뤄라.',
      foes: ['goblinChief', 'goblinFighter', 'goblinDisruptor', 'goblinDisruptor'],
    }],
  },
  {
    id: 'webwood',
    no: 6,
    name: '거미 숲',
    brief: '독이 쌓이면 가만히 서 있어도 줄어든다. 정화를 수칙에 넣지 않았다면 지금이 그때다. 어미가 긴 주문을 외면 끊어라.',
    recommended: [15, 20],
    count: [3, 5],
    table: [
      { monsterId: 'spider', weight: 34 },
      { monsterId: 'greatSpider', weight: 26 },
      { monsterId: 'harpy', weight: 22 },
      { monsterId: 'broodMother', weight: 18 },
    ],
    unlock: { regionId: 'goblinCamp', wins: 3 },
  },
  {
    id: 'citadel',
    no: 7,
    name: '무너진 성채',
    brief: '거북은 엄호하고 스스로를 굳힌다. 뒤에서는 창자가 계속 되돌린다. 앞만 때려서는 끝나지 않는다 — 뒤를 쳐라.',
    recommended: [19, 24],
    count: [4, 5],
    table: [
      { monsterId: 'rockTurtle', weight: 30 },
      { monsterId: 'harpyFlock', weight: 24 },
      { monsterId: 'ogreVanguard', weight: 28 },
      { monsterId: 'stoneChanter', weight: 18 },
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
      { monsterId: 'ogre', weight: 30 },
      { monsterId: 'rockTurtle', weight: 20 },
      { monsterId: 'greatSpider', weight: 24 },
      { monsterId: 'stoneChanter', weight: 16 },
      { monsterId: 'abyssOgre', weight: 10 },
    ],
    unlock: { regionId: 'citadel', wins: 3 },
  },
  // ═════════ M2-7: 전직이 전제인 지역 (expects: 'advanced') ═════════
  //
  // 만렙이 30 이라 레벨로는 더 어렵게 만들 수 없다. 그래서 문턱을 **설계**로 옮겼다.
  // 여기 적은 짐승이 아니라 2차 직업의 훅을 들고 나오는 용병단이다 — 기준 편성으로는 넘지 못한다.
  // 덕분에 전직 편성을 포화 없이 측정할 자리가 생긴다 (docs/18 §13·§14 가 요구한 것).
  {
    id: 'frostgate',
    no: 9,
    name: '서리 관문',
    brief: '심연을 넘으면 관문이 있다. 지키는 것은 짐승이 아니라 훈련된 용병단이다 — 그들도 수칙을 짜고, 그들도 전직했다. 엄호를 뚫고 시전을 끊어야 한다.',
    // 만렙 50 확장으로 권장 밴드를 뒤로 한 칸 늘렸다 (docs/22 §4)
    recommended: [26, 31],
    count: [4, 6],
    expects: 'advanced',
    table: [
      { monsterId: 'gateGuardian', weight: 26 },
      { monsterId: 'frostBerserker', weight: 24 },
      { monsterId: 'gateMarksman', weight: 22 },
      { monsterId: 'frostChanter', weight: 16 },
      { monsterId: 'gateChaplain', weight: 16 },
    ],
    unlock: { regionId: 'abyss', wins: 3 },
  },
  {
    id: 'throne',
    no: 10,
    name: '잊힌 왕좌',
    brief: '관문 너머, 용병단을 처음 만든 자가 앉아 있던 자리. 잊힌 단장은 여덟 줄의 수칙을 쓴다 — 이 게임에서 가장 긴 것이다. 당신의 거울이다.',
    recommended: [30, 34],
    count: [4, 6],
    expects: 'advanced',
    table: [
      { monsterId: 'throneKnight', weight: 30 },
      { monsterId: 'throneShadow', weight: 26 },
      { monsterId: 'gateChaplain', weight: 22 },
      { monsterId: 'forgottenCaptain', weight: 14 },
    ],
    unlock: { regionId: 'frostgate', wins: 3 },
  },

  // ═════════ 만렙 50 확장 — Lv30~50 (docs/22 §4) ═════════
  // 전부 전직 전제. 지역마다 가르치는 것이 하나다. 앞 지역 3승이면 열린다
  {
    id: 'dunes',
    no: 11,
    name: '모래바람 황야',
    brief: '왕좌 너머는 모래뿐이다. 사막 부족은 둔화와 정지로 박자를 뺏는다. 정화와 가속을 수칙에 넣고, 점술사의 긴 주문은 끊어라.',
    recommended: [33, 38],
    count: [4, 6],
    expects: 'advanced',
    table: [
      { monsterId: 'sandRaider', weight: 30 },
      { monsterId: 'duneStalker', weight: 26 },
      { monsterId: 'sandHarpy', weight: 24 },
      { monsterId: 'sandSeer', weight: 20 },
      { monsterId: 'duneWarlord', weight: 5 },
    ],
    unlock: { regionId: 'throne', wins: 3 },
  },
  {
    id: 'sunkenTemple',
    no: 12,
    name: '가라앉은 신전',
    brief: '물에 잠긴 신전은 막고 되돌린다. 수호상이 앞을 막고 사제가 장막과 재생으로 되감는다. 뒤를 치지 않으면 끝나지 않는다.',
    recommended: [37, 42],
    count: [4, 6],
    expects: 'advanced',
    table: [
      { monsterId: 'templeWarden', weight: 28 },
      { monsterId: 'tidePriest', weight: 22 },
      { monsterId: 'eelSwarm', weight: 26 },
      { monsterId: 'drownedKnight', weight: 24 },
      { monsterId: 'templeColossus', weight: 5 },
    ],
    unlock: { regionId: 'dunes', wins: 3 },
  },
  {
    id: 'warfield',
    no: 13,
    name: '용병왕의 전장',
    brief: '모든 용병단이 한 번은 거쳐 가는 전장. 여기 선 자들은 당신이 고를 수 있는 모든 2차 직업을 이미 쓴다 — 여섯 명의 거울이다.',
    recommended: [41, 46],
    // 5~6 명이면 훅을 겹친 정예에게 HP 를 절반 가까이 깎아도 28% 였다 — 인원이 가장 큰 손잡이다 (docs/07 §3.8g)
    count: [3, 5],
    expects: 'advanced',
    table: [
      { monsterId: 'kingsGuard', weight: 20 },
      { monsterId: 'warBerserker', weight: 18 },
      { monsterId: 'warAssassin', weight: 16 },
      { monsterId: 'warElementalist', weight: 16 },
      { monsterId: 'warBishop', weight: 14 },
      { monsterId: 'warRanger', weight: 16 },
      { monsterId: 'mercenaryKing', weight: 4 },
    ],
    unlock: { regionId: 'sunkenTemple', wins: 3 },
  },
  {
    id: 'fallenStar',
    no: 14,
    name: '별이 떨어진 탑',
    brief: '별이 떨어진 자리에 탑이 섰다. 창자들은 이 게임에서 가장 긴 주문을 외운다 — 끊는 사람이 없으면 전원이 쓰러진다. 꼭대기에는 주인이 있다.',
    recommended: [45, 50],
    count: [3, 5],
    expects: 'advanced',
    table: [
      { monsterId: 'starGolem', weight: 26 },
      { monsterId: 'voidHarpy', weight: 24 },
      { monsterId: 'starChanter', weight: 22 },
      { monsterId: 'riftBeast', weight: 26 },
      { monsterId: 'towerMaster', weight: 4 },
    ],
    unlock: { regionId: 'warfield', wins: 3 },
  },
]

export const REGION_BY_ID: Record<string, RegionDef> = Object.fromEntries(REGIONS.map((r) => [r.id, r]))

export function isRegionUnlocked(region: RegionDef, wins: Record<string, number>): boolean {
  if (!region.unlock) return true
  return (wins[region.unlock.regionId] ?? 0) >= region.unlock.wins
}

/** 조우 생성. 같은 시드면 같은 편성 — 리플레이는 시드만 저장하면 된다 */
export function rollEncounter(region: RegionDef, seed: number): TeamSetup {
  const elite = rollElite(region, seed)
  if (elite) return { ...namedTeam(region.name, elite.foes), elite: elite.name }
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
  return namedTeam(region.name, picks)
}

/** 이 판이 엘리트 조우인가. 무작위 조우와 다른 난수를 쓴다 — 엘리트가 아닌 판의 편성은 바뀌지 않는다 */
function rollElite(region: RegionDef, seed: number): EliteDef | undefined {
  if (!region.elites?.length) return undefined
  const rng = createRng(seed ^ 0xe117e)
  let r = rng.int(100)
  for (const e of region.elites) {
    r -= e.pct
    if (r < 0) return e
  }
  return undefined
}

/** 몬스터 id 목록 → 팀. 같은 이름이 겹치면 번호를 붙인다 */
function namedTeam(name: string, picks: string[]): TeamSetup {
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
  return { name, members }
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
 *
 * `partyLuk` 은 **출전 단원 중 가장 높은 운**이다. 운 2 마다 드롭 확률 +1%, 최대 +60%
 * (docs/07 §5: 운은 전투 밖에서 드롭·제작에 붙는다 — 2026-09-13 까지 연결되지 않고 있었다).
 * 한 명만 운에 투자해도 값이 나오게 **최고값**을 쓴다. "운 좋은 놈이 주워 온다."
 * rng 소비 횟수는 바뀌지 않는다 — 문턱만 오른다 (결정론 유지).
 */
/**
 * 운이 드롭 확률에 주는 보정 % — **운 2 마다 +1%, 최대 +60%**.
 * 4 로 나눴을 때는 40% 를 운에 넣어도 판당 드롭이 3.5% 밖에 안 늘어 선택지가 되지 못했다 (2026-09-13 실측).
 */
export const lootBonusPct = (luk: number): number => Math.min(60, Math.floor(Math.max(0, luk) / 2))

export function battleRewards(result: BattleResult, enemy: TeamSetup, seed?: number, partyLuk = 0): Rewards {
  const exp = enemy.members.reduce((s, m) => s + (m.monster?.exp ?? 0), 0)
  const gold = enemy.members.reduce((s, m) => s + (m.monster?.gold ?? 0), 0)
  if (result.outcome !== 'team0') return { exp: Math.floor(exp * 0.3), gold: 0, drops: [] }
  const drops: string[] = []
  if (seed !== undefined) {
    const rng = createRng(seed ^ 0xd201)
    const boost = 100 + lootBonusPct(partyLuk)
    for (const m of enemy.members) {
      for (const d of m.monster?.drops ?? []) {
        if (rng.int(10000) < Math.floor((d.permyriad * boost) / 100)) {
          drops.push(d.itemId)
          break
        }
      }
    }
  }
  return { exp, gold, drops }
}
