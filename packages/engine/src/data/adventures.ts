// 모험 (탭 개편 2026-09-11). 제로식의 Adventure 에서 착안한 형태 — 일반 전투(지역 반복)와 이렇게 다르다:
//  · 상대가 **고정**이다 (가중치 무작위가 아님). 그래서 수칙을 그 상대에 맞춰 짤 수 있다
//  · **연속 도전이 안 된다** — 승리하면 길게, 패배하면 짧게 재도전 대기가 붙는다
//  · **하루 횟수 제한**이나 **열쇠(재료) 소모**, **요일 제한**이 걸린다
//  · 대신 보상이 크고, 승리 시 재료가 **확정**으로 나온다
// 시간 계산은 엔진이 하지 않는다 (엔진은 Date 를 쓰지 않는다). 웹이 시각을 넣어 판정한다.
import type { TeamSetup } from '../types'
import { MONSTERS, monsterSetup } from './monsters'

export interface AdventureDef {
  id: string
  no: number
  name: string
  brief: string
  /** 권장 레벨 밴드 */
  recommended: [number, number]
  /** 고정 상대 (몬스터 id 순서대로) */
  foes: string[]
  /** 입장 시 소모하는 재료 */
  entry?: { itemId: string; qty: number }
  /** 도전 가능한 요일 (0=일 … 6=토). 생략 = 매일 */
  weekdays?: number[]
  /** 재도전 대기 (분). 승리 / 패배 */
  cooldownMin: { win: number; lose: number }
  /** 하루 도전 횟수 상한. 생략 = 무제한 */
  dailyLimit?: number
  /** 경험치·금 배수 (%) */
  rewardPct: number
  /** 승리 확정 보상 */
  clearDrops: { itemId: string; qty: number }[]
  /** 해금: 지역에서 N 승 */
  unlock: { regionId: string; wins: number }
}

export const WEEKDAY_LABEL = ['일', '월', '화', '수', '목', '금', '토'] as const

export const ADVENTURES: AdventureDef[] = [
  {
    id: 'colosseum',
    no: 1,
    name: '고블린 콜로세움',
    brief: '부락 깊은 곳의 투기장. 족장이 직접 나온다. 인장이 있어야 문이 열린다.',
    recommended: [14, 18],
    foes: ['goblinChief', 'goblinFighter', 'goblinFighter'],
    entry: { itemId: 'bossSeal', qty: 1 },
    cooldownMin: { win: 180, lose: 5 },
    rewardPct: 200,
    clearDrops: [{ itemId: 'manaCrystal', qty: 2 }, { itemId: 'ironScrap', qty: 3 }],
    unlock: { regionId: 'goblinCamp', wins: 3 },
  },
  {
    id: 'catacomb',
    no: 2,
    name: '지하 묘소',
    brief: '묘소는 좁다. 박쥐가 먼저 몰려오고 그 뒤에서 거미가 기다린다. 하루 세 번까지.',
    recommended: [18, 22],
    foes: ['batSwarm', 'batSwarm', 'batSwarm', 'greatSpider', 'greatSpider'],
    cooldownMin: { win: 60, lose: 5 },
    dailyLimit: 3,
    rewardPct: 150,
    clearDrops: [{ itemId: 'venomSac', qty: 2 }],
    unlock: { regionId: 'webwood', wins: 3 },
  },
  {
    id: 'trial',
    no: 3,
    name: '칠요의 시련',
    brief: '성채의 옛 수비대가 정해진 날에만 문을 연다. 월·수·금, 하루 한 번.',
    recommended: [20, 26],
    foes: ['rockTurtle', 'rockTurtle', 'harpyFlock', 'harpyFlock'],
    weekdays: [1, 3, 5],
    cooldownMin: { win: 0, lose: 5 },
    dailyLimit: 1,
    rewardPct: 250,
    clearDrops: [{ itemId: 'ironScrap', qty: 4 }, { itemId: 'feather', qty: 3 }],
    unlock: { regionId: 'citadel', wins: 3 },
  },
  {
    id: 'abyssGate',
    no: 4,
    name: '심연의 문',
    brief: '핵 세 개를 문에 끼우면 열린다. 안에 무엇이 있는지는 돌아온 자가 없어 모른다.',
    recommended: [26, 30],
    foes: ['abyssOgre', 'ogre', 'ogre'],
    entry: { itemId: 'ogreCore', qty: 3 },
    cooldownMin: { win: 360, lose: 10 },
    rewardPct: 300,
    clearDrops: [{ itemId: 'ogreCore', qty: 2 }, { itemId: 'bossSeal', qty: 1 }],
    unlock: { regionId: 'abyss', wins: 3 },
  },
]

export const ADVENTURE_BY_ID: Record<string, AdventureDef> = Object.fromEntries(ADVENTURES.map((a) => [a.id, a]))

/** 고정 상대 편성. 같은 이름이 겹치면 번호를 붙인다 (지역 조우와 같은 규칙) */
export function adventureTeam(def: AdventureDef): TeamSetup {
  const members = def.foes.map((id, idx) => monsterSetup(MONSTERS[id], idx))
  const seen: Record<string, number> = {}
  for (const m of members) seen[m.name] = (seen[m.name] ?? 0) + 1
  const dup = new Set(Object.keys(seen).filter((k) => seen[k] > 1))
  const counter: Record<string, number> = {}
  for (const m of members) {
    if (dup.has(m.name)) {
      counter[m.name] = (counter[m.name] ?? 0) + 1
      m.name = `${m.name} ${counter[m.name]}`
    }
  }
  return { name: def.name, members }
}

/** 이 모험의 경험치·금 (배수 적용). 드롭은 clearDrops 로 확정이라 여기 없다 */
export function adventureRewards(def: AdventureDef): { exp: number; gold: number } {
  const team = adventureTeam(def)
  const exp = team.members.reduce((s, m) => s + (m.monster?.exp ?? 0), 0)
  const gold = team.members.reduce((s, m) => s + (m.monster?.gold ?? 0), 0)
  return { exp: Math.floor((exp * def.rewardPct) / 100), gold: Math.floor((gold * def.rewardPct) / 100) }
}
