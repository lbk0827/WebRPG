// 단원 ↔ 전투 CharSetup 변환, 성장 처리, 편성 판 조작.
import type { Alloc, Analysis, AdventureDef, BattleResult, CharSetup, GearSlot, GearSummary, ItemDef, ItemInstance, Recipe, RuleSet, StatKey, Stats, TeamSetup } from '@webrpg/engine'
import {
  DEFAULT_CONFIG, DISMISS_REFUND_PCT, HERO_JOB, HIRE, ITEMS, ITEM_LIST, MATERIALS, MEMBER_MAX, PRESETS, RECIPE_BY_ID, REFINE_MAX, REGIONS, RENAME_GOLD, SKILLS, SKILL_RESET_GOLD, STARTER_SKILLS, STAT_CAP, STAT_POINTS_PER_LEVEL, SKILL_POINTS_PER_LEVEL, WEEKDAY_LABEL,
  ADVANCE_RESET_GOLD, JOB_ADVANCE, advanceChain, boundWeaponFor,
  adventureRewards, adventureTeam, advancesFor, analyze, applyGearStats, applyQuirk, canAdvance, canCraft, canEquip, createRng, grantExp, growthStats, hireLevel, hirePrice, isRegionUnlocked, learnCost, learnableFor, refineCost, rollCraftTrait, rollQuirk, sellPrice, simulate, summarizeGear, tryRefine,
} from '@webrpg/engine'
import { PARTY_MAX, cellRow, dayKey, pushRecord, type GameSave, type Gear, type Member } from './save'

export const GEAR_SLOTS: GearSlot[] = ['weapon', 'armor', 'trinket']
export const gearItems = (gear: Gear): (ItemInstance | undefined)[] => GEAR_SLOTS.map((s) => gear[s])
export const gearSummary = (m: Member): GearSummary => summarizeGear(gearItems(m.gear ?? {}))

/**
 * 2차 직업이 얹는 스탯 보정 (M2-5b).
 * **레벨 배율을 곱한 뒤에** 더한다. 성장 전에 더하면 HP +240 이 Lv24 에서 +516 이 되어
 * 전직이 "다르게 싸우는 것"이 아니라 힘 도약이 된다 (ADR-003 위반).
 */
function withAdvanceBonus(scaled: Stats, job2?: string): Stats {
  // 전직 사슬 전체 — 주인공은 길드원의 보정 위에 용사의 보정이 쌓인다 (docs/20)
  const chain = advanceChain(job2)
  if (chain.length === 0) return scaled
  const out = { ...scaled }
  for (const adv of chain) {
    for (const [k, v] of Object.entries(adv.bonus)) {
      const key = k as keyof Stats
      const raw = (out[key] ?? 0) + (v ?? 0)
      // 분배 스탯은 상한을 함께 지킨다
      out[key] = key === 'maxHp' || key === 'maxSp' || key === 'def' || key === 'mdef' ? raw : Math.min(STAT_CAP, raw)
    }
  }
  return out
}

/** 성장 + 편차 + 전직 보정 + 장비 스탯 가산 */
export const memberStats = (m: Member): Stats =>
  applyGearStats(
    withAdvanceBonus(growthStats(applyQuirk(PRESETS[m.job].stats, m.quirk), m.level, m.alloc), m.job2),
    gearSummary(m).stats,
  )

/**
 * 초상·전투 도트의 키. 주인공은 **전직 단계 × 성별**마다 그림이 다르다 — `guildMember-female` 처럼 (docs/21).
 * 성별은 외형만, 능력치는 같다. 그림이 아직 없는 키는 labels.ts 의 ART_STANDIN 이 기존 도트로 돌린다
 */
export const memberIcon = (m: Member): string => (m.job === HERO_JOB ? `${m.job2 ?? HERO_JOB}-${m.gender ?? 'male'}` : m.job)

export function memberSetup(m: Member, idx: number): CharSetup {
  const p = PRESETS[m.job]
  const g = gearSummary(m)
  const chain = advanceChain(m.job2)
  return {
    // id 앞부분은 전투 화면이 도트를 고르는 키다 (jobOf)
    id: `${memberIcon(m)}#${idx}`,
    name: m.name,
    row: m.row,
    guard: structuredClone(m.guard),
    stats: memberStats(m),
    skills: [...(m.skills ?? p.skills)],
    rules: structuredClone(m.rules),
    bonus: { atk: g.atk, def: g.def },
    // 수칙 훅은 특성으로 붙는다 (docs/04 ADR-003)
    traits: [...chain.flatMap((a) => a.traits), ...g.traits],
    weapon: g.weapon,
  }
}

// ───────────────────────────── 전직 (M2-5b)

/** 지금 단계(최근 전직, 없으면 1차 직업) 다음에 고를 수 있는 전직 */
export const advanceOptions = (m: Member) => advancesFor(m.job2 ?? m.job)
export const memberCanAdvance = (m: Member): boolean => canAdvance(m.job, m.job2, m.level)

/** 주인공 전용 무기인가 — 벗거나 바꾸거나 팔 수 없다 */
const isBound = (it: ItemInstance | undefined): boolean => !!it && !!ITEMS[it.itemId]?.bound

/**
 * 다음 전직을 고른다. 대표 스킬을 바로 배우고 훅 특성이 붙는다.
 * 주인공은 전직이 이어지고(모험가 → 길드원 → 용사), **전용 무기가 진화한다** — 강화 단계는 그대로 (docs/20)
 */
export function advanceMember(g: GameSave, id: string, jobId: string): GameSave {
  const m = g.members.find((x) => x.id === id)
  const def = JOB_ADVANCE[jobId]
  if (!m || !def || def.base !== (m.job2 ?? m.job) || m.level < def.level) return g
  const skills = [...new Set([...(m.skills ?? []), ...def.grants])]
  const w = m.gear.weapon
  const gear: Gear = def.weapon && w && isBound(w) ? { ...m.gear, weapon: { ...w, itemId: def.weapon } } : m.gear
  return { ...g, members: g.members.map((x) => (x.id === id ? { ...x, job2: jobId, skills, gear } : x)) }
}

/** 전직 취소 — 금을 낸다. 2차 스킬은 잃고 쓴 포인트는 돌려받는다 */
export function resetAdvance(g: GameSave, id: string): GameSave {
  const m = g.members.find((x) => x.id === id)
  if (!m || !m.job2 || g.gold < ADVANCE_RESET_GOLD) return g
  const def = JOB_ADVANCE[m.job2]
  const lost = new Set([...def.grants, ...def.learnable.map((l) => l.skillId)])
  let refund = 0
  for (const l of def.learnable) if ((m.skills ?? []).includes(l.skillId)) refund += l.cost
  const skills = (m.skills ?? []).filter((s) => !lost.has(s))
  // 잃은 스킬을 쓰던 수칙 줄은 기본 공격으로 되돌린다 — 우물쭈물하지 않게
  const rows = m.rules.rows.map((r) => (lost.has(r.skillId) ? { ...r, skillId: 'strike' } : r))
  // 사슬의 **한 단계만** 되돌린다 — 용사를 취소하면 길드원으로. 주인공 무기도 한 단계 전으로 (docs/20)
  const prevJob2 = JOB_ADVANCE[def.base] ? def.base : undefined
  const w = m.gear.weapon
  const gear: Gear = def.weapon && w && isBound(w) ? { ...m.gear, weapon: { ...w, itemId: boundWeaponFor(prevJob2) } } : m.gear
  return {
    ...g,
    gold: g.gold - ADVANCE_RESET_GOLD,
    members: g.members.map((x) =>
      x.id === id
        ? { ...x, job2: prevJob2, gear, skills, rules: { ...x.rules, rows }, skillPoints: x.skillPoints + refund, spentSkillPoints: Math.max(0, x.spentSkillPoints - refund) }
        : x,
    ),
  }
}

// ───────────────────────────── 장비 · 상점 (M2-4a)

/** 상점 등급: 1 항상, 2 는 폐허 요새(3) 해금, 3 은 고블린 부락(5) 해금 */
/**
 * 상점 등급. **2 가 상한이다** (2026-09-13 단장 결정).
 *
 * 전에는 3등급까지 팔았다. 그런데 제작법이 상점과 **같은 물건**을 만들면서 금이 2.4배 싸서
 * (상점 9,000금 vs 제작 3,735금 — docs/18 §15), 공방이 열리면 상점 3등급 칸을 아무도 안 봤다.
 * 이제 역할을 나눈다: **상점은 기본품, 공방은 좋은 물건.**
 *   · 상점 1·2등급 — 금만 있으면 즉시. 언제든 최소한을 갖춘다
 *   · 공방 3등급 — 재료가 필요하다. 시간이 든다. 보너스 특성이 붙을 수도 있다
 */
export function shopTier(g: GameSave): 1 | 2 {
  const open = (no: number) => { const r = REGIONS.find((x) => x.no === no); return !!r && isRegionUnlocked(r, g.regionWins) }
  return open(3) ? 2 : 1
}

// 주인공 전용 무기(bound)는 팔지 않는다
export const shopStock = (g: GameSave): ItemDef[] => { const t = shopTier(g); return ITEM_LIST.filter((i) => i.tier <= t && !i.bound) }

const newUid = (): string => `i${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`

export function buyItem(g: GameSave, itemId: string): GameSave {
  const def = ITEMS[itemId]
  if (!def || def.bound || def.tier > shopTier(g) || g.gold < def.price) return g
  return { ...g, gold: g.gold - def.price, inventory: [...g.inventory, { uid: newUid(), itemId, refine: 0 }] }
}

export function sellItem(g: GameSave, uid: string): GameSave {
  const it = g.inventory.find((x) => x.uid === uid)
  if (!it) return g
  return { ...g, gold: g.gold + sellPrice(ITEMS[it.itemId]), inventory: g.inventory.filter((x) => x.uid !== uid) }
}

/** 창고의 장비를 단원에게. 그 슬롯에 있던 것은 창고로 */
export function equipItem(g: GameSave, memberId: string, uid: string): GameSave {
  const m = g.members.find((x) => x.id === memberId)
  const it = g.inventory.find((x) => x.uid === uid)
  if (!m || !it) return g
  const def = ITEMS[it.itemId]
  if (!canEquip(m.job, def)) return g
  const prev = m.gear[def.slot]
  // 주인공 전용 무기는 빼지도, 다른 것으로 바꾸지도 않는다
  if (def.bound || isBound(prev)) return g
  const inventory = g.inventory.filter((x) => x.uid !== uid)
  if (prev) inventory.push(prev)
  return { ...updateMember(g, { ...m, gear: { ...m.gear, [def.slot]: it } }), inventory }
}

export function unequipItem(g: GameSave, memberId: string, slot: GearSlot): GameSave {
  const m = g.members.find((x) => x.id === memberId)
  const it = m?.gear[slot]
  if (!m || !it || isBound(it)) return g
  const gear = { ...m.gear }
  delete gear[slot]
  return { ...updateMember(g, { ...m, gear }), inventory: [...g.inventory, it] }
}

/** 이 단원이 이 슬롯에 낄 수 있는 창고 장비 */
export const equippableFor = (g: GameSave, m: Member, slot: GearSlot): ItemInstance[] =>
  g.inventory.filter((it) => ITEMS[it.itemId].slot === slot && canEquip(m.job, ITEMS[it.itemId]))

/**
 * 다른 단원이 끼고 있지만 이 단원도 낄 수 있는 장비 (M2-4a 개선 2026-09-12).
 * "전부 리스트화해서 비교한다"는 요구를 채우려면 창고만 봐서는 모자란다 — 좋은 건 대개 누가 끼고 있다.
 */
export function wornByOthers(g: GameSave, m: Member, slot: GearSlot): { it: ItemInstance; owner: Member }[] {
  const out: { it: ItemInstance; owner: Member }[] = []
  for (const other of g.members) {
    if (other.id === m.id) continue
    const it = other.gear?.[slot]
    if (it && canEquip(m.job, ITEMS[it.itemId])) out.push({ it, owner: other })
  }
  return out
}

/** 다른 단원의 장비를 벗겨 이 단원에게 끼운다 (한 번에) */
export function takeFrom(g: GameSave, fromId: string, toId: string, slot: GearSlot): GameSave {
  const from = g.members.find((x) => x.id === fromId)
  const it = from?.gear?.[slot]
  if (!from || !it) return g
  return equipItem(unequipItem(g, fromId, slot), toId, it.uid)
}

// ───────────────────────────── 공방 (M2-4b)

export interface OwnedItem {
  it: ItemInstance
  /** 착용 중이면 단원 */
  owner?: Member
}

/** 창고 + 착용 중인 장비 전부 */
export function allItems(g: GameSave): OwnedItem[] {
  const out: OwnedItem[] = g.inventory.map((it) => ({ it }))
  for (const m of g.members) for (const it of gearItems(m.gear ?? {})) if (it) out.push({ it, owner: m })
  return out
}

function replaceItem(g: GameSave, uid: string, next: ItemInstance): GameSave {
  if (g.inventory.some((x) => x.uid === uid)) return { ...g, inventory: g.inventory.map((x) => (x.uid === uid ? next : x)) }
  return {
    ...g,
    members: g.members.map((m) => {
      const gear = m.gear ?? {}
      const slot = GEAR_SLOTS.find((s) => gear[s]?.uid === uid)
      return slot ? { ...m, gear: { ...gear, [slot]: next } } : m
    }),
  }
}

export function addMaterials(g: GameSave, ids: string[]): GameSave {
  if (ids.length === 0) return g
  const materials = { ...g.materials }
  for (const id of ids) materials[id] = (materials[id] ?? 0) + 1
  return { ...g, materials }
}

export function canRefine(g: GameSave, it: ItemInstance): boolean {
  if (it.refine >= REFINE_MAX) return false
  return g.gold >= refineCost(ITEMS[it.itemId], it.refine).gold
}

export interface RefineOutcome {
  save: GameSave
  success: boolean
  item: ItemInstance
}

/** 강화 시도. 금만 든다. 비용은 성공·실패 모두 소모. 실패해도 파괴·하락 없음 (§3.5 · docs/18 §18) */
export function refineItem(g: GameSave, uid: string, seed: number): RefineOutcome | null {
  const found = allItems(g).find((o) => o.it.uid === uid)
  if (!found || !canRefine(g, found.it)) return null
  const it = found.it
  const c = refineCost(ITEMS[it.itemId], it.refine)
  const success = tryRefine(it.refine, createRng(seed))
  const next: ItemInstance = success ? { ...it, refine: it.refine + 1 } : it
  let save: GameSave = { ...g, gold: g.gold - c.gold }
  if (success) save = replaceItem(save, uid, next)
  return { save, success, item: next }
}

export interface CraftOutcome {
  save: GameSave
  item: ItemInstance
  recipe: Recipe
}

/** 제작. 재료·금 소모, 창고에 새 장비. 30% 로 보너스 특성 (§3.6) */
export function craftItem(g: GameSave, recipeId: string, seed: number): CraftOutcome | null {
  const r = RECIPE_BY_ID[recipeId]
  if (!r || !canCraft(r, g.materials, g.gold)) return null
  const materials = { ...g.materials }
  for (const m of r.materials) {
    materials[m.id] -= m.qty
    if (materials[m.id] <= 0) delete materials[m.id]
  }
  const item: ItemInstance = { uid: newUid(), itemId: r.itemId, refine: 0 }
  const trait = rollCraftTrait(r.itemId, createRng(seed), rosterLuk(g))
  if (trait) item.trait = trait
  return { save: { ...g, gold: g.gold - r.gold, materials, inventory: [...g.inventory, item] }, item, recipe: r }
}

export const craftableNow = (g: GameSave): Recipe[] => Object.values(RECIPE_BY_ID).filter((r) => canCraft(r, g.materials, g.gold))

// ───────────────────────────── 모험 (탭 개편). 시간 판정은 웹에서만 — 엔진은 시간을 모른다

/** "철 조각 ×6 · 가죽 ×2" — 없으면 빈 문자열 */
export const materialsText = (g: GameSave): string =>
  Object.entries(g.materials).filter(([, v]) => v > 0).map(([id, v]) => `${MATERIALS[id]?.label ?? id} ×${v}`).join(' · ')

export interface AdvGate {
  unlocked: boolean
  /** 지금 갈 수 있는가 */
  ready: boolean
  /** 못 가는 이유 (한 줄) */
  reason?: string
  /** 재도전까지 남은 ms */
  waitMs: number
  /** 오늘 남은 횟수. 제한 없으면 null */
  todayLeft: number | null
  cleared: boolean
}

export function adventureGate(g: GameSave, def: AdventureDef, now = Date.now()): AdvGate {
  const region = REGIONS.find((r) => r.id === def.unlock.regionId)
  const unlocked = (g.regionWins[def.unlock.regionId] ?? 0) >= def.unlock.wins
  const st = g.adventures[def.id]
  const today = dayKey(now)
  const count = st && st.day === today ? st.count : 0
  const todayLeft = def.dailyLimit === undefined ? null : Math.max(0, def.dailyLimit - count)
  const waitMs = Math.max(0, (st?.nextAt ?? 0) - now)
  const cleared = st?.cleared === true
  const base: AdvGate = { unlocked, ready: false, waitMs, todayLeft, cleared }

  if (!unlocked) return { ...base, reason: `${region?.name ?? def.unlock.regionId}에서 ${def.unlock.wins}승 하면 열립니다` }
  if (def.weekdays && !def.weekdays.includes(new Date(now).getDay())) {
    return { ...base, reason: `${def.weekdays.map((d) => WEEKDAY_LABEL[d]).join('·')}요일에만 열립니다` }
  }
  if (waitMs > 0) return { ...base, reason: '재도전 대기 중' }
  if (todayLeft !== null && todayLeft <= 0) return { ...base, reason: '오늘 도전 횟수를 다 썼습니다' }
  if (def.entry && (g.materials[def.entry.itemId] ?? 0) < def.entry.qty) {
    return { ...base, reason: `입장에 ${MATERIALS[def.entry.itemId]?.label ?? def.entry.itemId} ${def.entry.qty}개가 필요합니다` }
  }
  if (partyMembers(g).length === 0) return { ...base, reason: '편성이 비어 있습니다' }
  return { ...base, ready: true }
}

export interface AdventureRun {
  save: GameSave
  def: AdventureDef
  seed: number
  player: TeamSetup
  enemy: TeamSetup
  result: BattleResult
  analysis: Analysis
  exp: number
  gold: number
  drops: { itemId: string; qty: number }[]
  levelUps: { name: string; level: number }[]
}

/** 모험 도전. 입장 재료·횟수·대기는 성패와 무관하게 소모된다 */
export function runAdventure(g: GameSave, def: AdventureDef, now = Date.now()): AdventureRun | null {
  if (!adventureGate(g, def, now).ready) return null
  const seed = (now % 1_000_000_007) + g.battles
  const enemy = adventureTeam(def)
  const player = partyTeam(g)
  const result = simulate({ seed, teams: [player, enemy], config: DEFAULT_CONFIG, skills: SKILLS })
  const analysis = analyze(result, [player.members.length, enemy.members.length])
  const win = result.outcome === 'team0'
  const base = adventureRewards(def)
  const exp = win ? base.exp : Math.floor(base.exp * 0.3)
  const gold = win ? base.gold : 0
  const drops = win ? def.clearDrops : []

  const levelUps: { name: string; level: number }[] = []
  const members = g.members.map((m) => {
    if (!g.party.includes(m.id)) return m
    const r = applyExp(m, exp)
    if (r.levelsGained > 0) levelUps.push({ name: m.name, level: r.member.level })
    return r.member
  })

  // 입장 재료 소모
  const materials = { ...g.materials }
  if (def.entry) {
    materials[def.entry.itemId] = (materials[def.entry.itemId] ?? 0) - def.entry.qty
    if (materials[def.entry.itemId] <= 0) delete materials[def.entry.itemId]
  }
  for (const d of drops) materials[d.itemId] = (materials[d.itemId] ?? 0) + d.qty

  const today = dayKey(now)
  const prev = g.adventures[def.id]
  const count = (prev && prev.day === today ? prev.count : 0) + 1
  const cooldown = (win ? def.cooldownMin.win : def.cooldownMin.lose) * 60_000

  const next: GameSave = pushRecord(
    {
      ...g,
      members,
      materials,
      gold: g.gold + gold,
      battles: g.battles + 1,
      wins: g.wins + (win ? 1 : 0),
      adventures: { ...g.adventures, [def.id]: { nextAt: now + cooldown, day: today, count, cleared: prev?.cleared === true || win } },
    },
    { at: now, regionId: `adv:${def.id}`, seed, outcome: result.outcome, exp, gold, actions: result.actionCount, player, enemy },
  )
  return { save: next, def, seed, player, enemy, result, analysis, exp, gold, drops, levelUps }
}

// ───────────────────────────── 스킬 습득 (M2-2, 제로식 방식)

/** 아직 안 배운, 이 직업이 배울 수 있는 스킬 */
export const unlearned = (m: Member) => learnableFor(m.job, m.job2).filter((l) => !m.skills.includes(l.skillId))

/** 지금 포인트로 살 수 있는 게 있는가 */
export const canLearnSomething = (m: Member): boolean => unlearned(m).some((l) => l.cost <= m.skillPoints)

export function learnSkill(m: Member, skillId: string): Member {
  const cost = learnCost(m.job, skillId, m.job2)
  if (cost === null || m.skills.includes(skillId) || m.skillPoints < cost) return m
  return { ...m, skills: [...m.skills, skillId], skillPoints: m.skillPoints - cost, spentSkillPoints: m.spentSkillPoints + cost }
}

/** 배우지 않은 스킬을 참조하는 패턴을 지운다. 전부 지워지면 "항상 → 기본 공격" 하나를 남긴다 */
export function pruneRules(rules: RuleSet, skills: string[]): RuleSet {
  const rows = rules.rows.filter((r) => skills.includes(r.skillId))
  return { rows: rows.length ? rows : [{ condition: { op: 'always' }, skillId: 'strike' }] }
}

/** 스킬 초기화 — 시작 스킬로 되돌리고 쓴 포인트를 돌려준다. 금이 든다 */
export function resetSkills(g: GameSave, m: Member): GameSave {
  if (g.gold < SKILL_RESET_GOLD) return g
  // 전직으로 받은 대표 스킬은 되돌리지 않는다 — 그건 산 것이 아니라 직업이 준 것이다
  const granted = advanceChain(m.job2).flatMap((a) => a.grants)
  const skills = [...new Set([...(STARTER_SKILLS[m.job] ?? PRESETS[m.job].skills), ...granted])]
  const next: Member = { ...m, skills, skillPoints: m.skillPoints + m.spentSkillPoints, spentSkillPoints: 0, rules: pruneRules(m.rules, skills) }
  return { ...updateMember(g, next), gold: g.gold - SKILL_RESET_GOLD }
}

export const memberById = (g: GameSave, id: string | null): Member | undefined => (id ? g.members.find((m) => m.id === id) : undefined)

/** 편성된 단원 (판 칸 순서 — 전열 0~2, 후열 3~5. 빈 칸 제외) */
export const partyMembers = (g: GameSave): Member[] => g.party.map((id) => memberById(g, id)).filter((m): m is Member => m !== undefined)

export const partyTeam = (g: GameSave): TeamSetup => ({ name: g.name, members: partyMembers(g).map(memberSetup) })

/**
 * 드롭·제작에 쓰는 운 — **출전 단원 중 가장 높은 값**. 장비 보정까지 포함한다.
 * 한 명만 운에 투자해도 값이 나오게 최고값을 쓴다 ("운 좋은 놈이 주워 온다", docs/07 §5).
 */
export const partyLuk = (g: GameSave): number =>
  partyMembers(g).reduce((best, m) => Math.max(best, memberStats(m).luk), 0)

/** 제작에 쓰는 운 — 출전 여부와 무관하게 **단원 전체** 중 최고값 (대장간은 마을에 있다) */
export const rosterLuk = (g: GameSave): number =>
  g.members.reduce((best, m) => Math.max(best, memberStats(m).luk), 0)

/** 편성 요약 (상태줄·비교 카드용) */
export function partySummary(g: GameSave): { count: number; avgLevel: number; levelSum: number; hpSum: number } {
  const ms = partyMembers(g)
  const levelSum = ms.reduce((s, m) => s + m.level, 0)
  const hpSum = ms.reduce((s, m) => s + memberStats(m).maxHp, 0)
  return { count: ms.length, avgLevel: ms.length ? Math.round(levelSum / ms.length) : 0, levelSum, hpSum }
}

/** 대기 중인 단원 (판에 없는) */
export const benchMembers = (g: GameSave): Member[] => g.members.filter((m) => !g.party.includes(m.id))

export const cellOf = (g: GameSave, id: string): number => g.party.indexOf(id)

// ───────────────────────────── 편성 판 조작. 단원 row 는 항상 놓인 칸을 따른다

/** 칸에 단원을 놓는다. 다른 칸에 있었으면 옮기고, 그 칸에 누가 있었으면 자리를 바꾼다. 인원 상한이면 그대로 */
export function placeMember(g: GameSave, cell: number, id: string): GameSave {
  const from = g.party.indexOf(id)
  const occupant = g.party[cell]
  if (from < 0 && occupant === null && partyMembers(g).length >= PARTY_MAX) return g
  const party = g.party.slice()
  party[cell] = id
  if (from >= 0) party[from] = occupant
  else if (occupant) {
    // 대기 단원이 자리를 차지 — 있던 단원은 대기로
    party[cell] = id
  }
  const moved = [id, occupant].filter((x): x is string => x !== null && party.includes(x))
  const members = g.members.map((m) => (moved.includes(m.id) ? { ...m, row: cellRow(party.indexOf(m.id)) } : m))
  return { ...g, party, members }
}

/** 칸을 비운다 (단원은 대기로) */
export function clearCell(g: GameSave, cell: number): GameSave {
  const party = g.party.slice()
  party[cell] = null
  return { ...g, party }
}

/** 두 칸을 맞바꾼다 (빈 칸 포함) */
export function swapCells(g: GameSave, a: number, b: number): GameSave {
  if (a === b) return g
  const party = g.party.slice()
  ;[party[a], party[b]] = [party[b], party[a]]
  const touched = [party[a], party[b]].filter((x): x is string => x !== null)
  const members = g.members.map((m) => (touched.includes(m.id) ? { ...m, row: cellRow(party.indexOf(m.id)) } : m))
  return { ...g, party, members }
}

// ───────────────────────────── 전투 맵의 체크박스 편성 (2026-09-13, 제로식 방식)
// 체크박스는 "누가 가나"만 정한다. "어디 서나"는 단원의 row 로 빈 칸을 찾는다.
// 같은 열 안의 칸 순서는 건드리지 않는다 — 그건 편성 탭의 판에서 한다.

type RowName = 'front' | 'back'

const freeCell = (g: GameSave, row: RowName): number => g.party.findIndex((id, c) => id === null && cellRow(c) === row)

/** 이 열에 빈 칸이 있나 (열은 3칸) */
export const rowHasRoom = (g: GameSave, row: RowName): boolean => freeCell(g, row) >= 0

/** 출전시킨다. 원래 서던 열의 빈 칸 → 없으면 반대 열 → 인원 상한이면 그대로 */
export function enlistMember(g: GameSave, id: string): GameSave {
  const m = memberById(g, id)
  if (!m || g.party.includes(id) || partyMembers(g).length >= PARTY_MAX) return g
  const other: RowName = m.row === 'front' ? 'back' : 'front'
  const cell = freeCell(g, m.row) >= 0 ? freeCell(g, m.row) : freeCell(g, other)
  return cell < 0 ? g : placeMember(g, cell, id)
}

/** 출전에서 뺀다 (대기로). 단원의 row 는 남아 다음에 같은 열로 돌아간다 */
export function withdrawMember(g: GameSave, id: string): GameSave {
  const cell = g.party.indexOf(id)
  return cell < 0 ? g : clearCell(g, cell)
}

/** 서는 열을 바꾼다. 그 열이 꽉 차 있으면 그대로 */
export function setMemberRow(g: GameSave, id: string, row: RowName): GameSave {
  const from = g.party.indexOf(id)
  if (from < 0 || cellRow(from) === row) return g
  const to = freeCell(g, row)
  return to < 0 ? g : placeMember(g, to, id)
}

/** 선택초기화 — 전원 대기로 */
export const clearParty = (g: GameSave): GameSave => ({ ...g, party: g.party.map(() => null) })

/** 판 전체를 바꾼다 (프리셋 불러오기). 모르는 id 는 비움, 상한 초과는 잘라냄 */
export function setGrid(g: GameSave, grid: (string | null)[]): GameSave {
  const party: (string | null)[] = Array(g.party.length).fill(null)
  let count = 0
  grid.slice(0, party.length).forEach((id, i) => {
    if (id && g.members.some((m) => m.id === id) && !party.includes(id) && count < PARTY_MAX) {
      party[i] = id
      count++
    }
  })
  const members = g.members.map((m) => (party.includes(m.id) ? { ...m, row: cellRow(party.indexOf(m.id)) } : m))
  return { ...g, party, members }
}

// ───────────────────────────── 모집소 (M2-3)

/** 지금 고용하면 몇 레벨로 오는가 */
export const currentHireLevel = (g: GameSave): number => hireLevel(partySummary(g).avgLevel || 1)

export const currentHirePrice = (g: GameSave, job: string): number => hirePrice(job, currentHireLevel(g))

export function canHire(g: GameSave, job: string): boolean {
  // 고용 목록(HIRE)에 있는 직업만 — 주인공(모험가)은 고용할 수 없다
  return g.members.length < MEMBER_MAX && !!PRESETS[job] && !!HIRE[job] && g.gold >= currentHirePrice(g, job)
}

/** 고용. 이름은 플레이어가 짓는다. 편차는 seed 로 굴린다 (웹은 시각) */
export function hireMember(g: GameSave, job: string, name: string, seed: number): GameSave {
  if (!canHire(g, job)) return g
  const p = PRESETS[job]
  const level = currentHireLevel(g)
  const price = currentHirePrice(g, job)
  const m: Member = {
    id: `m${seed.toString(36)}${g.members.length}`,
    name: name.trim().slice(0, 12) || p.name,
    job,
    level,
    exp: 0,
    alloc: { str: 0, int: 0, dex: 0, spd: 0, luk: 0 },
    statPoints: (level - 1) * STAT_POINTS_PER_LEVEL,
    skillPoints: (level - 1) * SKILL_POINTS_PER_LEVEL,
    skills: [...(STARTER_SKILLS[job] ?? p.skills)],
    spentSkillPoints: 0,
    quirk: rollQuirk(job, createRng(seed)),
    hiredFor: price,
    gear: {},
    row: p.row,
    guard: structuredClone(p.guard),
    rules: structuredClone(p.rules),
  }
  return { ...g, gold: g.gold - price, members: [...g.members, m] }
}

export const dismissRefund = (m: Member): number => Math.floor(((m.hiredFor ?? 0) * DISMISS_REFUND_PCT) / 100)

/** 해고 = 삭제. 편성 판에서도 빠진다. 고용가의 일부 환급. 장비는 창고로. 주인공과 마지막 한 명은 못 보낸다 */
export function dismissMember(g: GameSave, id: string): GameSave {
  const m = g.members.find((x) => x.id === id)
  if (!m || m.hero || g.members.length <= 1) return g
  return {
    ...g,
    inventory: [...g.inventory, ...Object.values(m.gear ?? {}).filter((x): x is ItemInstance => !!x)],
    gold: g.gold + dismissRefund(m),
    members: g.members.filter((x) => x.id !== id),
    party: g.party.map((p) => (p === id ? null : p)),
    partyPresets: g.partyPresets.map((p) => (p ? { ...p, party: p.party.map((x) => (x === id ? null : x)) } : p)),
  }
}

export function renameMember(g: GameSave, m: Member, name: string): GameSave {
  const n = name.trim().slice(0, 12)
  if (!n || n === m.name || g.gold < RENAME_GOLD) return g
  return { ...updateMember(g, { ...m, name: n }), gold: g.gold - RENAME_GOLD }
}

export function allocateStat(m: Member, key: StatKey): Member {
  if (m.statPoints <= 0) return m
  if (memberStats(m)[key] >= STAT_CAP) return m
  return { ...m, statPoints: m.statPoints - 1, alloc: { ...m.alloc, [key]: m.alloc[key] + 1 } }
}

/** 여러 포인트를 한 번에 분배 (미리보기 → 확정). 포인트·상한을 넘는 요청은 무시 */
export function allocateMany(m: Member, add: Alloc): Member {
  let cur = m
  for (const k of Object.keys(add) as StatKey[]) {
    for (let i = 0; i < add[k]; i++) cur = allocateStat(cur, k)
  }
  return cur
}

export interface ExpApplied {
  member: Member
  levelsGained: number
}

export function applyExp(m: Member, gained: number): ExpApplied {
  const r = grantExp(m.level, m.exp, gained)
  return {
    member: {
      ...m,
      level: r.level,
      exp: r.exp,
      statPoints: m.statPoints + r.levelsGained * STAT_POINTS_PER_LEVEL,
      skillPoints: m.skillPoints + r.levelsGained * SKILL_POINTS_PER_LEVEL,
    },
    levelsGained: r.levelsGained,
  }
}

export function updateMember(g: GameSave, next: Member): GameSave {
  return { ...g, members: g.members.map((m) => (m.id === next.id ? next : m)) }
}
