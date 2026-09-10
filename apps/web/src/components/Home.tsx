// 본부 (ADR-004). 시작 화면 — 처음이면 3문답 소개, 할 일, 훈련 과제 진행, 최근 전투 기록(재생).
import { useMemo, useState } from 'react'
import { DEFAULT_CONFIG, MISSIONS, REGIONS, REGION_BY_ID, SKILLS, isRegionUnlocked, simulate } from '@webrpg/engine'
import type { BattleRecord, GameSave } from '../game/save'
import { PARTY_MAX } from '../game/save'
import { partyMembers } from '../game/members'
import type { MissionProgress } from '../missionState'
import { jobIcon, jobOf, outcomeText, timeAgo, type Names } from '../lib/labels'
import { Replay } from './Replay'
import { Board } from './Board'

export type Tab = 'home' | 'quest' | 'formation' | 'roster' | 'train'

interface Props {
  save: GameSave
  progress: MissionProgress
  onGo: (tab: Tab) => void
  onOpenMissions: () => void
  onOpenMission: (id: string) => void
  onOpenCodex: () => void
}

interface Todo {
  text: string
  action: string
  go: () => void
}

export function Home({ save, progress, onGo, onOpenMissions, onOpenMission, onOpenCodex }: Props) {
  const [replayAt, setReplayAt] = useState<number | null>(null)
  const party = partyMembers(save)
  const clearedCount = MISSIONS.filter((m) => progress.cleared[m.id]).length
  const nextMission = MISSIONS.find((m) => !progress.cleared[m.id])
  const fresh = clearedCount === 0 && save.battles === 0

  const todos: Todo[] = []
  if (nextMission) todos.push({ text: `훈련 과제 ${nextMission.no}. ${nextMission.title}`, action: clearedCount === 0 ? '시작' : '이어서', go: () => onOpenMission(nextMission.id) })
  const unallocated = save.members.filter((m) => m.statPoints > 0)
  if (unallocated.length) todos.push({ text: `${unallocated.map((m) => m.name).join('·')} — 스탯 포인트 미분배`, action: '단원', go: () => onGo('roster') })
  if (party.length < PARTY_MAX && save.members.length > party.length) todos.push({ text: `출전 ${party.length}/${PARTY_MAX}명 — 대기 단원 ${save.members.length - party.length}명`, action: '편성', go: () => onGo('formation') })
  const newRegion = REGIONS.find((r) => isRegionUnlocked(r, save.regionWins) && (save.regionWins[r.id] ?? 0) === 0 && r.no > 1)
  if (newRegion) todos.push({ text: `새로 열린 지역 — ${newRegion.name}`, action: '의뢰', go: () => onGo('quest') })
  const lockedRegion = REGIONS.find((r) => r.unlock && !isRegionUnlocked(r, save.regionWins))
  if (lockedRegion && lockedRegion.unlock && (clearedCount >= 3 || save.battles > 0)) {
    const from = REGION_BY_ID[lockedRegion.unlock.regionId]
    const have = save.regionWins[lockedRegion.unlock.regionId] ?? 0
    todos.push({ text: `${from?.name ?? ''} ${have}/${lockedRegion.unlock.wins}승 → ${lockedRegion.name} 해금`, action: '의뢰', go: () => onGo('quest') })
  }
  if (todos.length === 0 && clearedCount >= 3) todos.push({ text: '의뢰를 돌아 단원을 키운다', action: '의뢰', go: () => onGo('quest') })

  const record = replayAt !== null ? save.log.find((r) => r.at === replayAt) ?? null : null
  const replay = useMemo(() => {
    if (!record) return null
    const result = simulate({ seed: record.seed, teams: [record.player, record.enemy], config: DEFAULT_CONFIG, skills: SKILLS })
    const names: Names = [record.player.members.map((m) => m.name), record.enemy.members.map((m) => m.name)]
    const jobs: [string[], string[]] = [record.player.members.map((m) => jobOf(m.id)), record.enemy.members.map((m) => jobOf(m.id))]
    return { result, names, jobs }
  }, [record])

  return (
    <section className="home">
      {fresh && (
        <div className="faq">
          <h2>{save.name}</h2>
          <dl>
            <dt>이건 무슨 게임?</dt>
            <dd>용병단을 이끌고 의뢰를 받아 싸우는 게임. 다만 전투 중엔 손을 못 댄다.</dd>
            <dt>그럼 뭘 하나?</dt>
            <dd>출전 전에 단원마다 <b>교전 수칙</b>을 적는다 — "이런 상황이면 이걸 해라" 목록. 실력은 반사신경이 아니라 설계다.</dd>
            <dt>뭐부터?</dt>
            <dd>훈련 과제 1번. 과제 하나에 개념 하나, 열두 개면 끝. 세 개만 마쳐도 의뢰가 열린다.</dd>
          </dl>
        </div>
      )}

      <h2>할 일</h2>
      {todos.length === 0 ? (
        <p className="hint">지금은 급한 게 없다. 훈련장에서 수칙을 다듬거나, 도감을 읽어 두자.</p>
      ) : (
        <ul className="todos">
          {todos.map((t, i) => (
            <li key={i}>
              <span>{t.text}</span>
              <button className={i === 0 ? 'primary' : ''} onClick={t.go}>{t.action} →</button>
            </li>
          ))}
        </ul>
      )}

      <div className="hq-grid">
        <div className="card">
          <h3>훈련 과제 <small>{clearedCount}/{MISSIONS.length}</small></h3>
          <div className="bar exp"><i style={{ width: `${(clearedCount / MISSIONS.length) * 100}%` }} /></div>
          <p className="hint">{nextMission ? `다음: ${nextMission.no}. ${nextMission.title}` : '전부 마쳤다. 수칙 체계를 다 익힌 상태.'}</p>
          <div className="run-bar">
            {nextMission && <button className="primary" onClick={() => onOpenMission(nextMission.id)}>과제 열기</button>}
            <button onClick={onOpenMissions}>과제 목록</button>
          </div>
        </div>

        <div className="card">
          <h3>편성 <small>{party.length}/{PARTY_MAX}명 · 판을 누르면 편성 탭</small></h3>
          <Board save={save} compact onCell={() => onGo('formation')} />
          <div className="run-bar">
            <button onClick={() => onGo('formation')}>편성</button>
            <button onClick={() => onGo('roster')}>단원</button>
            <button onClick={onOpenCodex}>도감</button>
          </div>
        </div>
      </div>

      <h2>최근 전투 <small>{save.battles}전 {save.wins}승 · 기록 {save.log.length}건</small></h2>
      {save.log.length === 0 ? (
        <p className="hint">아직 의뢰를 나간 적이 없다. 기록은 여기 쌓인다 — 언제든 다시 볼 수 있다.</p>
      ) : (
        <ol className="records">
          {save.log.map((r) => (
            <RecordRow key={r.at} r={r} open={r.at === replayAt} onToggle={() => setReplayAt(r.at === replayAt ? null : r.at)} />
          ))}
        </ol>
      )}
      {replay && record && (
        <div className="record-replay">
          <p className="hint">{REGION_BY_ID[record.regionId]?.name ?? record.regionId} · {outcomeText(record.outcome)} · 시드 {record.seed}</p>
          <Replay result={replay.result} names={replay.names} jobs={replay.jobs} autoPlay={false} />
        </div>
      )}
    </section>
  )
}

function RecordRow({ r, open, onToggle }: { r: BattleRecord; open: boolean; onToggle: () => void }) {
  const region = REGION_BY_ID[r.regionId]
  const cls = r.outcome === 'team0' ? 'win' : r.outcome === 'team1' ? 'lose' : 'draw'
  return (
    <li className={`record ${cls} ${open ? 'on' : ''}`}>
      <button onClick={onToggle}>
        <span className="res">{outcomeText(r.outcome)}</span>
        <span className="body">
          <span className="title">{region?.name ?? r.regionId} <small>· {r.enemy.members.length}명 상대 · {r.actions}회 행동</small></span>
          <span className="lesson">{timeAgo(r.at)} · 경험치 +{r.exp} · 금 +{r.gold}</span>
        </span>
        <span className="cast">
          {r.enemy.members.map((m, i) => (
            <img key={i} src={jobIcon(jobOf(m.id))} alt="" width={18} height={18} />
          ))}
        </span>
      </button>
    </li>
  )
}
