// 전투 루프 (§3, §4). simulate() 는 부수효과 없는 순수 함수다.
import type { BattleInput, BattleResult, CharRef, Outcome, Skill } from './types'
import { createRng } from './rng'
import { GAUGE_MAX, pctOf } from './fixed'
import type { BattleState, CharState } from './state'
import {
  chargeRate,
  createCharState,
  effectiveCharge,
  emit,
  getChar,
  hasStatus,
  hpPct,
  snapshotTeams,
  traitRuleRows,
} from './state'
import { evalCondition } from './conditions'
import { resolveCover, selectTargets } from './targeting'
import { applyEffect, freshCtx, kill, runTriggers } from './effects'
import { maxRuleRows } from './progression'

export function simulate(input: BattleInput): BattleResult {
  const st: BattleState = {
    rng: createRng(input.seed),
    teams: [
      input.teams[0].members.map((m, i) => createCharState(m, { team: 0, index: i })),
      input.teams[1].members.map((m, i) => createCharState(m, { team: 1, index: i })),
    ],
    skills: input.skills,
    config: input.config,
    events: [],
    actionCount: 0,
    actionLimit: input.config.maxActions,
    extendsUsed: 0,
  }

  emit(st, { t: 'battleStart', teams: snapshotTeams(st) })

  let outcome: Outcome | null = checkOutcome(st)
  while (outcome === null) {
    if (st.actionCount >= st.actionLimit) {
      if (isDecisionImminent(st) && st.extendsUsed < st.config.maxExtends) {
        st.actionLimit += st.config.extendActions
        st.extendsUsed++
      } else {
        outcome = 'draw'
        break
      }
    }

    const actor = advanceToNextActor(st)
    if (!actor) {
      outcome = 'draw'
      break
    }

    takeTurn(actor, st)
    st.actionCount++

    if (st.config.statusReportInterval > 0 && st.actionCount % st.config.statusReportInterval === 0) {
      emit(st, { t: 'statusReport', actionCount: st.actionCount, teams: snapshotTeams(st) })
    }
    outcome = checkOutcome(st)
  }

  emit(st, { t: 'battleEnd', outcome, actionCount: st.actionCount })
  return { outcome, actionCount: st.actionCount, events: st.events }
}

// ───────────────────────────── 종료 판정 (§4.6)

function aliveCount(team: CharState[]): number {
  return team.reduce((n, c) => n + (c.alive ? 1 : 0), 0)
}

function checkOutcome(st: BattleState): Outcome | null {
  const a = aliveCount(st.teams[0])
  const b = aliveCount(st.teams[1])
  if (a === 0 && b === 0) return 'draw'
  if (b === 0) return 'team0'
  if (a === 0) return 'team1'
  return null
}

/** 결착 임박: 어느 한쪽이 생존자 1명 이하이거나 평균 HP 25% 이하 */
function isDecisionImminent(st: BattleState): boolean {
  for (const team of st.teams) {
    const living = team.filter((c) => c.alive)
    if (living.length <= 1) return true
    const avg = Math.floor(living.reduce((s, c) => s + hpPct(c), 0) / living.length)
    if (avg <= 25) return true
  }
  return false
}

// ───────────────────────────── 행동 순서 (§4.1) — 이벤트 점프

function advanceToNextActor(st: BattleState): CharState | null {
  let minTicks = Number.MAX_SAFE_INTEGER
  const all = [...st.teams[0], ...st.teams[1]]

  for (const c of all) {
    if (!c.alive) continue
    const rate = chargeRate(c)
    const ticks = c.gauge >= GAUGE_MAX ? 0 : Math.ceil((GAUGE_MAX - c.gauge) / rate)
    if (ticks < minTicks) minTicks = ticks
  }
  if (minTicks === Number.MAX_SAFE_INTEGER) return null

  if (minTicks > 0) {
    for (const c of all) if (c.alive) c.gauge += minTicks * chargeRate(c)
  }

  const ready = all.filter((c) => c.alive && c.gauge >= GAUGE_MAX)
  if (ready.length === 0) return null
  return ready.length === 1 ? ready[0] : ready[st.rng.int(ready.length)]
}

// ───────────────────────────── 한 차례 (§4.5)

function takeTurn(actor: CharState, st: BattleState): void {
  emit(st, { t: 'turnBegin', actor: actor.ref })

  tickStatuses(actor, st)
  if (!actor.alive) return
  runTriggers(actor, 'turnStart', st)

  // 예약된 시전 발동
  if (actor.pending) {
    const skill = st.skills[actor.pending.skillId]
    const targets = actor.pending.targets.map(({ ref, hits }) => ({ target: getChar(st, ref), hits }))
    actor.pending = undefined
    emit(st, { t: 'castResolve', actor: actor.ref, skillId: skill.id })
    resolveSkill(actor, skill, targets, st)
    finishAction(actor, skill)
    return
  }

  // INT 로 정해지는 최대 패턴 수를 넘는 패턴은 평가하지 않는다 (progression.ts)
  const rows = actor.setup.rules.rows
  const limit = Math.min(rows.length, maxRuleRows(actor.setup.stats) + traitRuleRows(actor))
  for (let i = 0; i < limit; i++) {
    const row = rows[i]
    if (row.disabled) continue
    if (row.maxUses !== undefined && actor.ruleUses[i] >= row.maxUses) continue
    if (!evalCondition(row.condition, actor, st)) continue

    const skill = st.skills[row.skillId]
    if (!skill) continue
    // 배우지 않은 스킬 (M2-2). 수칙에 남아 있어도 쓸 수 없다 — 다음 패턴으로
    if (!actor.setup.skills.includes(skill.id)) {
      emit(st, { t: 'skillFailed', actor: actor.ref, ruleIndex: i, skillId: skill.id, reason: 'notLearned' })
      continue
    }

    if (skill.requires?.weaponType && !skill.requires.weaponType.includes(actor.setup.weapon ?? 'none')) {
      emit(st, { t: 'skillFailed', actor: actor.ref, ruleIndex: i, skillId: skill.id, reason: 'noWeapon' })
      continue
    }
    if (
      (actor.cooldownUntil[skill.id] ?? 0) > actor.actionCount ||
      (skill.perBattle !== undefined && (actor.skillUses[skill.id] ?? 0) >= skill.perBattle)
    ) {
      emit(st, { t: 'skillFailed', actor: actor.ref, ruleIndex: i, skillId: skill.id, reason: 'cooldown' })
      continue
    }

    if (skill.spCost > 0 && hasStatus(actor, 'silence')) {
      emit(st, { t: 'skillFailed', actor: actor.ref, ruleIndex: i, skillId: skill.id, reason: 'silenced' })
      continue
    }
    if (actor.sp < skill.spCost) {
      emit(st, { t: 'skillFailed', actor: actor.ref, ruleIndex: i, skillId: skill.id, reason: 'noSp' })
      continue
    }
    const targets = selectTargets(skill, actor, st)
    if (!targets) {
      emit(st, {
        t: 'skillFailed',
        actor: actor.ref,
        ruleIndex: i,
        skillId: skill.id,
        reason: 'noRequiredTarget',
      })
      continue
    }

    actor.ruleUses[i]++
    emit(st, { t: 'ruleFired', actor: actor.ref, ruleIndex: i, skillId: skill.id })
    if (skill.spCost > 0) {
      actor.sp -= skill.spCost
      emit(st, { t: 'spChange', target: actor.ref, delta: -skill.spCost })
    }
    actor.skillUses[skill.id] = (actor.skillUses[skill.id] ?? 0) + 1
    if (skill.cooldown) actor.cooldownUntil[skill.id] = actor.actionCount + 1 + skill.cooldown
    if (skill.costHpPct) {
      const cost = Math.min(actor.hp - 1, pctOf(actor.setup.stats.maxHp, skill.costHpPct))
      if (cost > 0) {
        actor.hp -= cost
        emit(st, { t: 'damage', source: actor.ref, target: actor.ref, amount: cost, school: 'phys' })
      }
    }

    if (skill.charge > 0) {
      actor.pending = { skillId: skill.id, targets: targets.map((r) => ({ ref: r.target.ref, hits: r.hits })) }
      emit(st, { t: 'castStart', actor: actor.ref, skillId: skill.id })
      actor.actionCount++
      actor.gauge = GAUGE_MAX - effectiveCharge(skill.charge, actor)
      return
    }

    resolveSkill(actor, skill, targets, st)
    finishAction(actor, skill)
    return
  }

  // 수칙에 없는 상황 — "우물쭈물했다"
  emit(st, { t: 'ruleExhausted', actor: actor.ref })
  actor.actionCount++
  actor.gauge = 0
}

function finishAction(actor: CharState, skill: Skill): void {
  actor.actionCount++
  // 후딜 음수 = 고속 행동 (다음 차례가 빨리 온다). 즉시 재행동은 막는다
  actor.gauge = Math.min(900, -skill.stiff)
}

function resolveSkill(
  actor: CharState,
  skill: Skill,
  targets: { target: CharState; hits: number }[],
  st: BattleState,
): void {
  const isRevive = skill.effects.some((e) => e.kind === 'revive')
  const hostile = skill.target.side === 'enemy' || skill.target.side === 'any'
  // 엄호는 "후열을 노린 단일 대상 공격"만 가로막는다. 광역/다중 공격은 전열이 막아줄 수 없다.
  const coverable = hostile && skill.target.scope === 'single'

  for (const { target, hits } of targets) {
    if (!target.alive && !isRevive) continue
    const actual = coverable && target.ref.team !== actor.ref.team ? resolveCover(target, skill, st) : target
    const ctx = freshCtx()
    ctx.viaCover = actual !== target
    for (let h = 0; h < hits; h++) {
      if (!actual.alive && !isRevive) break
      ctx.hitIndex = h
      for (const effect of skill.effects) applyEffect(effect, actor, actual, st, ctx)
    }
  }
}

// ───────────────────────────── 상태 진행 (§4.6, §6.4)

function tickStatuses(c: CharState, st: BattleState): void {
  const poison = c.statuses.find((s) => s.id === 'poison')
  if (poison) {
    const amount = Math.max(1, pctOf(c.setup.stats.maxHp, poison.magnitude))
    c.hp = Math.max(0, c.hp - amount)
    emit(st, { t: 'statusTick', target: c.ref, status: 'poison', amount })
    if (c.hp === 0) {
      kill(c, st)
      return
    }
  }

  const keep: typeof c.statuses = []
  for (const s of c.statuses) {
    if (s.id === 'barrier') {
      keep.push(s)
      continue
    }
    s.remaining--
    if (s.remaining <= 0) emit(st, { t: 'statusExpire', target: c.ref, status: s.id })
    else keep.push(s)
  }
  c.statuses = keep
}

export type { CharRef }
