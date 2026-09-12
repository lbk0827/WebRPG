// 본부 (ADR-004, 탭 개편 2026-09-11). 시작 화면 — 할 일, 편성 판, 훈련 진행, 최근 전투 기록, 용병단 관리.
import { useMemo, useState } from 'react'
import { UnitPortrait } from './UnitPortrait'
import { ADVENTURES, DEFAULT_CONFIG, ITEMS, MEMBER_MAX, MISSIONS, PRESETS, REGIONS, REGION_BY_ID, SKILLS, isRegionUnlocked, simulate } from '@webrpg/engine'
import type { BattleRecord, GameSave } from '../game/save'
import { DEFAULT_NAME, PARTY_MAX, exportGame, importGame, newGame } from '../game/save'
import { adventureGate, canHire, canLearnSomething, craftableNow, partyMembers } from '../game/members'
import type { MissionProgress } from '../missionState'
import { jobOf, outcomeText, timeAgo, type Names } from '../lib/labels'
import { Replay } from './Replay'
import { Board } from './Board'
import type { Facility } from './Town'

export type Tab = 'home' | 'formation' | 'characters' | 'battle' | 'adventure' | 'town' | 'training'

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
  progress: MissionProgress
  onGo: (tab: Tab) => void
  onGoTown: (f?: Facility) => void
}

interface Todo {
  text: string
  action: string
  go: () => void
}

export function Home({ save, onSave, progress, onGo, onGoTown }: Props) {
  const [replayAt, setReplayAt] = useState<number | null>(null)
  const [io, setIo] = useState('')
  const [msg, setMsg] = useState('')
  const party = partyMembers(save)
  const clearedCount = MISSIONS.filter((m) => progress.cleared[m.id]).length
  const nextMission = MISSIONS.find((m) => !progress.cleared[m.id])
  const fresh = clearedCount === 0 && save.battles === 0

  const todos: Todo[] = []
  if (nextMission) todos.push({ text: `훈련 과제 ${nextMission.no}. ${nextMission.title}`, action: '훈련소', go: () => onGoTown('missions') })
  const unallocated = save.members.filter((m) => m.statPoints > 0)
  if (unallocated.length) todos.push({ text: `${unallocated.map((m) => m.name).join('·')} — 스탯 포인트 미분배`, action: '캐릭터', go: () => onGo('characters') })
  const learners = save.members.filter(canLearnSomething)
  if (learners.length) todos.push({ text: `${learners.map((m) => m.name).join('·')} — 배울 수 있는 스킬 있음`, action: '캐릭터', go: () => onGo('characters') })
  if (party.length < PARTY_MAX && save.members.length > party.length) {
    todos.push({ text: `출전 ${party.length}/${PARTY_MAX}명 — 대기 단원 ${save.members.length - party.length}명`, action: '편성', go: () => onGo('formation') })
  }
  if (party.length < PARTY_MAX && save.members.length === party.length && save.members.length < MEMBER_MAX && Object.keys(PRESETS).some((j) => canHire(save, j))) {
    todos.push({ text: `출전 자리가 남았고 금 ${save.gold} — 용병소에서 고용 가능`, action: '용병소', go: () => onGoTown('recruit') })
  }
  const unarmed = party.filter((m) => !m.gear?.weapon)
  if (unarmed.length && save.gold >= 60) todos.push({ text: `${unarmed.map((m) => m.name).join('·')} — 무기 없음`, action: '상점', go: () => onGoTown('shop') })
  if (save.inventory.length > 0) todos.push({ text: `창고에 장비 ${save.inventory.length}개 — 착용은 캐릭터 탭`, action: '캐릭터', go: () => onGo('characters') })
  const craftable = craftableNow(save)
  if (craftable.length > 0) todos.push({ text: `공방에서 만들 수 있는 것 ${craftable.length}가지 — ${craftable.map((r) => ITEMS[r.itemId].label).join('·')}`, action: '공방', go: () => onGoTown('workshop') })
  const newRegion = REGIONS.find((r) => isRegionUnlocked(r, save.regionWins) && (save.regionWins[r.id] ?? 0) === 0 && r.no > 1)
  if (newRegion) todos.push({ text: `새로 열린 지역 — ${newRegion.name}`, action: '전투', go: () => onGo('battle') })
  const readyAdv = ADVENTURES.filter((a) => adventureGate(save, a).ready)
  if (readyAdv.length) todos.push({ text: `지금 갈 수 있는 모험 — ${readyAdv.map((a) => a.name).join('·')}`, action: '모험', go: () => onGo('adventure') })
  const lockedRegion = REGIONS.find((r) => r.unlock && !isRegionUnlocked(r, save.regionWins))
  if (lockedRegion && lockedRegion.unlock && (clearedCount >= 3 || save.battles > 0)) {
    const from = REGION_BY_ID[lockedRegion.unlock.regionId]
    const have = save.regionWins[lockedRegion.unlock.regionId] ?? 0
    todos.push({ text: `${from?.name ?? ''} ${have}/${lockedRegion.unlock.wins}승 → ${lockedRegion.name} 해금`, action: '전투', go: () => onGo('battle') })
  }

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
            <dd>마을의 훈련소에서 과제 1번. 과제 하나에 개념 하나, 열두 개면 끝. 세 개만 마쳐도 전투가 열린다.</dd>
          </dl>
        </div>
      )}

      {/* 편성이 맨 위 (단장 지시). 훈련 과제 카드는 없앴다 — 할 일과 마을 훈련소로 충분하다 */}
      <div className="card hq-formation">
        <h3>편성 <small>{party.length}/{PARTY_MAX}명 · 판이나 이름을 누르면 편성 탭</small></h3>
        <div className="hq-formation-body">
          <Board save={save} compact onCell={() => onGo('formation')} />
          {party.length === 0 ? (
            <p className="hint">아직 아무도 세우지 않았다. 편성 탭에서 단원을 판에 올리자.</p>
          ) : (
            <ul className="party-lineup">
              {party.map((m) => (
                <li key={m.id} className={m.row}>
                  <button onClick={() => onGo('formation')}>
                    <UnitPortrait icon={m.job} size="sm" />
                    <span className="nm">{m.name}</span>
                    <small>Lv {m.level} · {m.row === 'front' ? '전열' : '후열'} · 패턴 {m.rules.rows.length}{m.gear?.weapon ? '' : ' · 무기 없음'}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="run-bar">
          <button onClick={() => onGo('formation')}>편성</button>
          <button onClick={() => onGo('characters')}>캐릭터</button>
          <button onClick={() => onGo('battle')}>전투</button>
          <button onClick={() => onGoTown()}>마을</button>
        </div>
      </div>

      {/* 할 일은 길어지기 쉬워서 기본으로 접어 둔다 (단장 지시). 요약 줄에 개수와 첫 항목을 남긴다 */}
      <details className="todo-box">
        <summary>
          할 일 {todos.length > 0 && <span className="badge">{todos.length}</span>}
          <small>{todos.length === 0 ? '지금은 급한 게 없다' : `${todos[0].text}${todos.length > 1 ? ` 외 ${todos.length - 1}` : ''}`}</small>
        </summary>
        {todos.length === 0 ? (
          <p className="hint">훈련장에서 수칙을 다듬거나, 마을 자료실을 읽어 두자.</p>
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
      </details>

      <h2>최근 전투 <small>{save.battles}전 {save.wins}승 · 기록 {save.log.length}건</small></h2>
      {save.log.length === 0 ? (
        <p className="hint">아직 나간 적이 없다. 기록은 여기 쌓인다 — 언제든 다시 볼 수 있다.</p>
      ) : (
        <ol className="records">
          {save.log.map((r) => (
            <RecordRow key={r.at} r={r} open={r.at === replayAt} onToggle={() => setReplayAt(r.at === replayAt ? null : r.at)} />
          ))}
        </ol>
      )}
      {replay && record && (
        <div className="record-replay">
          <p className="hint">{recordPlace(record)} · {outcomeText(record.outcome)} · 시드 {record.seed}</p>
          <Replay result={replay.result} names={replay.names} jobs={replay.jobs} autoPlay={false} />
        </div>
      )}

      <h2>용병단</h2>
      <label className="rename">
        <span>이름</span>
        <input
          value={save.name}
          maxLength={20}
          placeholder={DEFAULT_NAME}
          onChange={(e) => onSave({ ...save, name: e.target.value })}
          onBlur={(e) => { if (!e.target.value.trim()) onSave({ ...save, name: DEFAULT_NAME }) }}
        />
      </label>
      <details className="saveio">
        <summary>저장 관리</summary>
        <p className="hint">진행은 이 브라우저에 저장됩니다. 다른 기기로 옮기거나 백업하려면 내보내기 → 가져오기. 단원 · 장비 · 재료 · 전투 기록 · 수칙 프리셋이 전부 함께 갑니다.</p>
        <div className="run-bar">
          <button onClick={() => { setIo(exportGame(save)); setMsg('아래 상자의 내용을 복사해 두세요.') }}>내보내기</button>
          <button onClick={() => { const g = importGame(io); if (g) { onSave(g); setMsg('가져왔습니다.') } else setMsg('형식이 맞지 않습니다.') }}>가져오기</button>
          <button onClick={() => { if (window.confirm('진행을 지우고 새로 시작할까요?')) { onSave(newGame()); setMsg('새 게임.') } }}>새 게임</button>
          <small>{msg}</small>
        </div>
        <textarea value={io} onChange={(e) => setIo(e.target.value)} rows={4} placeholder="내보내기를 누르거나, 저장 JSON 을 붙여넣으세요" />
      </details>
    </section>
  )
}

/** 기록의 장소 이름 — 지역이면 지역명, 모험이면 모험명 */
function recordPlace(r: BattleRecord): string {
  if (r.regionId.startsWith('adv:')) return ADVENTURES.find((a) => a.id === r.regionId.slice(4))?.name ?? '모험'
  return REGION_BY_ID[r.regionId]?.name ?? r.regionId
}

function RecordRow({ r, open, onToggle }: { r: BattleRecord; open: boolean; onToggle: () => void }) {
  const cls = r.outcome === 'team0' ? 'win' : r.outcome === 'team1' ? 'lose' : 'draw'
  return (
    <li className={`record ${cls} ${open ? 'on' : ''}`}>
      <button onClick={onToggle}>
        <span className="res">{outcomeText(r.outcome)}</span>
        <span className="body">
          <span className="title">{recordPlace(r)} <small>· {r.enemy.members.length}명 상대 · {r.actions}회 행동</small></span>
          <span className="lesson">{timeAgo(r.at)} · 경험치 +{r.exp} · 금 +{r.gold}</span>
        </span>
        <span className="cast">
          {r.enemy.members.map((m, i) => (
            <UnitPortrait key={i} icon={jobOf(m.id)} size="xs" />
          ))}
        </span>
      </button>
    </li>
  )
}
