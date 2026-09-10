import { useMemo, useState } from 'react'
import type { BattleResult, Mission, SlotOverride, Verdict } from '@webrpg/engine'
import { DEFAULT_CONFIG, PRESETS, SKILLS, analyze, judgeMission, missionTeams, simulate } from '@webrpg/engine'
import type { MissionProgress } from '../missionState'
import type { SlotState } from '../state'
import { jobIcon, jobOf, type Names } from '../lib/labels'
import { describeCondition } from '../lib/condition'
import { skillLabel } from '../lib/labels'
import { diagnose } from '../lib/diagnose'
import { RuleEditor } from './RuleEditor'
import { Replay } from './Replay'

interface Props {
  mission: Mission
  progress: MissionProgress
  onProgress: (next: MissionProgress) => void
  onBack: () => void
  onNext: (() => void) | null
}

export function MissionPlay({ mission: m, progress, onProgress, onBack, onNext }: Props) {
  const overrides = progress.work[m.id] ?? {}
  const [result, setResult] = useState<BattleResult | null>(null)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [showHint, setShowHint] = useState(false)
  const attempts = progress.attempts[m.id] ?? 0
  const cleared = progress.cleared[m.id] === true

  // 편집기용 슬롯 상태 (과제 정의 + 작업분)
  const slots: SlotState[] = useMemo(
    () =>
      m.player.map((c, i) => {
        const p = PRESETS[c.job]
        const o = overrides[i]
        return { job: c.job, row: o?.row ?? c.row ?? p.row, guard: o?.guard ?? c.guard ?? p.guard, rules: o?.rules ?? c.rules }
      }),
    [m, overrides],
  )
  const names = useMemo(() => m.player.map((c) => c.name ?? PRESETS[c.job].name), [m])

  const setSlot = (i: number, next: SlotState) => {
    const o: SlotOverride = { rules: next.rules, guard: next.guard, row: next.row }
    onProgress({ ...progress, work: { ...progress.work, [m.id]: { ...overrides, [i]: o } } })
  }
  const resetWork = () => {
    const work = { ...progress.work }
    delete work[m.id]
    onProgress({ ...progress, work })
    setResult(null)
    setVerdict(null)
  }

  const run = () => {
    const teams = missionTeams(m, overrides)
    const r = simulate({ seed: m.seed, teams, config: DEFAULT_CONFIG, skills: SKILLS })
    const v = judgeMission(m, r)
    setResult(r)
    setVerdict(v)
    const next: MissionProgress = { ...progress, attempts: { ...progress.attempts, [m.id]: attempts + 1 } }
    if (v.cleared) next.cleared = { ...progress.cleared, [m.id]: true }
    onProgress(next)
  }

  const teams = useMemo(() => missionTeams(m, overrides), [m, overrides])
  const replayNames: Names = [teams[0].members.map((c) => c.name), teams[1].members.map((c) => c.name)]
  const jobs: [string[], string[]] = [teams[0].members.map((c) => jobOf(c.id)), teams[1].members.map((c) => jobOf(c.id))]
  const analysis = result ? analyze(result, [teams[0].members.length, teams[1].members.length]) : null

  return (
    <section className="mission">
      <div className="mission-head">
        <button className="link" onClick={onBack}>← 과제 목록</button>
        <h2>과제 {m.no}. {m.title} {cleared && <span className="badge">완료</span>}</h2>
        <p className="brief">{m.brief}</p>
        <p className="goal">🎯 {m.goal}</p>
      </div>

      <div className="mission-enemy">
        <span className="label">상대</span>
        {teams[1].members.map((c, i) => (
          <span key={i} className="foe">
            <img src={jobIcon(jobs[1][i])} alt="" width={28} height={28} />
            <span>{c.name}<small> {c.row === 'front' ? '전열' : '후열'} · HP {c.stats.maxHp}</small></span>
          </span>
        ))}
      </div>

      <RuleEditor slots={slots} onChange={setSlot} editable={m.editable} limits={m.limits} initial={m.editable[0]} names={names} />

      {m.player.length > 1 && (
        <details className="fixed-rules">
          <summary>고정 단원의 수칙 보기</summary>
          {m.player.map((c, i) =>
            m.editable.includes(i) ? null : (
              <div key={i} className="fixed-one">
                <b>{names[i]}</b>
                <ol>
                  {c.rules.rows.map((r, j) => (
                    <li key={j}>{describeCondition(r.condition)} → {skillLabel(r.skillId)}</li>
                  ))}
                </ol>
              </div>
            ),
          )}
        </details>
      )}

      <div className="run-bar">
        <button className="primary big" onClick={run}>출전</button>
        <button onClick={resetWork}>처음 수칙으로</button>
        {attempts > 0 && !cleared && <button onClick={() => setShowHint((h) => !h)}>{showHint ? '힌트 닫기' : '힌트'}</button>}
        <small>{attempts > 0 && `${attempts}번 출전`}</small>
      </div>
      {showHint && <p className="hintbox">💡 {m.hint}</p>}

      {verdict && result && analysis && (
        <div className={`verdict ${verdict.cleared ? 'ok' : 'fail'}`}>
          {verdict.cleared ? (
            <>
              <b>과제 완료!</b> {m.lesson}
              {onNext && <button className="primary" onClick={onNext}>다음 과제 →</button>}
            </>
          ) : (
            <>
              <b>미달.</b> {verdict.failed.join(' ')}
              <ul>
                {diagnose(analysis, names).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
              <small>아래 보고서에서 <b>우물쭈물</b>·<b>불가</b> 줄을 찾아보세요.</small>
            </>
          )}
        </div>
      )}

      {result && <Replay result={result} names={replayNames} jobs={jobs} />}
    </section>
  )
}
