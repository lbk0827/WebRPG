// 공유된 전투 보기 (docs/26 §5.2). 주소 ?log=<id> 로 들어온다 — 로그인 없이 볼 수 있다.
// 서버에는 시드 + 양 팀 편성만 있고, 이 브라우저의 엔진이 그 전투를 다시 계산해 재생한다.
import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_CONFIG, SKILLS, simulate } from '@webrpg/engine'
import { fetchSharedLog, type SharedLog } from '../account/sharedLogs'
import { BATTLE_DATA_VERSION } from '../lib/dataVersion'
import { jobOf, outcomeText, type Names } from '../lib/labels'
import { DEFAULT_NAME } from '../game/save'
import { recordPlace } from './Home'
import { Replay } from './Replay'
import { FrontShell } from './Title'

type State = { kind: 'loading' } | { kind: 'missing' } | { kind: 'error'; message: string } | { kind: 'ok'; log: SharedLog }

const day = (iso: string) => new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

export function SharedLogView({ id, onExit }: { id: string; onExit: () => void }) {
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    fetchSharedLog(id).then(
      (log) => setState(log ? { kind: 'ok', log } : { kind: 'missing' }),
      (e: unknown) => setState({ kind: 'error', message: e instanceof Error ? e.message : '불러오지 못했습니다' }),
    )
  }, [id])

  const replay = useMemo(() => {
    if (state.kind !== 'ok') return null
    const r = state.log.record
    try {
      const result = simulate({ seed: r.seed, teams: [r.player, r.enemy], config: DEFAULT_CONFIG, skills: SKILLS })
      const names: Names = [r.player.members.map((m) => m.name), r.enemy.members.map((m) => m.name)]
      const jobs: [string[], string[]] = [r.player.members.map((m) => jobOf(m.id)), r.enemy.members.map((m) => jobOf(m.id))]
      return { result, names, jobs }
    } catch {
      return null
    }
  }, [state])

  return (
    <FrontShell wide>
      <section className="shared-log">
        <h2>공유된 전투</h2>

        {state.kind === 'loading' && <p className="hint">불러오는 중…</p>}
        {state.kind === 'missing' && <p className="auth-error">이 링크의 전투를 찾을 수 없습니다. 공유한 지 30일이 지났거나, 공유한 사람이 새 전투를 20개 넘게 공유해 밀려났을 수 있습니다.</p>}
        {state.kind === 'error' && <p className="auth-error">{state.message}</p>}

        {state.kind === 'ok' && (
          <>
            <p className="shared-log-head">
              <b>{state.log.teamName ?? DEFAULT_NAME}</b> 의 전투 · {recordPlace(state.log.record)} · <b>{outcomeText(state.log.record.outcome)}</b>
              <small> · {state.log.record.enemy.members.length}명 상대 · {state.log.record.actions}회 행동</small>
            </p>
            <p className="hint">{day(state.log.createdAt)} 공유 · {day(state.log.expiresAt)}까지 열림</p>
            {state.log.dataVersion !== BATTLE_DATA_VERSION && (
              <div className="auth-warn">이전 버전에서 공유된 전투입니다. 그 뒤 스킬이나 전투 규칙이 바뀌어 <b>실제 결과와 다르게 재생될 수 있습니다.</b></div>
            )}
            {replay ? (
              <Replay result={replay.result} names={replay.names} jobs={replay.jobs} backdrop={state.log.record.regionId.replace(/^adv:/, '')} />
            ) : (
              <p className="auth-error">이 전투를 재생하지 못했습니다. 게임 버전이 많이 바뀌었을 수 있습니다.</p>
            )}
          </>
        )}

        <div className="run-bar shared-log-exit">
          <button className="primary big" onClick={onExit}>오더 앤 블레이드 하러 가기 →</button>
        </div>
      </section>
    </FrontShell>
  )
}
