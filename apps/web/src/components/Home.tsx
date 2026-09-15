// 본부 (ADR-004, 탭 개편 2026-09-11). 시작 화면 — 할 일, 편성 판, 훈련 진행, 최근 전투 기록, 용병단 관리.
import { useMemo, useState } from 'react'
import { UnitPortrait } from './UnitPortrait'
import { ADVENTURES, DEFAULT_CONFIG, HIRE, ITEMS, JOB_WEAPONS, MEMBER_MAX, MISSIONS, REGIONS, REGION_BY_ID, SKILLS, isRegionUnlocked, simulate } from '@webrpg/engine'
import type { BattleRecord, GameSave } from '../game/save'
import { PARTY_MAX, exportGame, importGame } from '../game/save'
import { TEAM_NAME_MAX } from '../account/rules'
import { adventureGate, canHire, canLearnSomething, craftableNow, memberIcon, partyMembers } from '../game/members'
import type { MissionProgress } from '../missionState'
import { jobOf, outcomeText, timeAgo, type Names } from '../lib/labels'
import { Replay } from './Replay'
import { Section } from './Section'
import { Board } from './Board'
import type { Facility } from './Town'
import { DebugCheatPanel } from './DebugCheatPanel'
import { DEBUG } from '../lib/debug'

export type Tab = 'home' | 'formation' | 'characters' | 'battle' | 'adventure' | 'town' | 'training'

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
  progress: MissionProgress
  onGo: (tab: Tab) => void
  onGoTown: (f?: Facility) => void
  loginId: string
  /** 용병단 이름 바꾸기 — 다른 계정과 겹치면 문구 (docs/25 §8-4) */
  onRename: (name: string) => Promise<string | null>
  onLogout: () => void
}

interface Todo {
  text: string
  action: string
  go: () => void
}

export function Home({ save, onSave, progress, onGo, onGoTown, loginId, onRename, onLogout }: Props) {
  const [replayAt, setReplayAt] = useState<number | null>(null)
  const [io, setIo] = useState('')
  const [msg, setMsg] = useState('')
  const party = partyMembers(save)
  const clearedCount = MISSIONS.filter((m) => progress.cleared[m.id]).length
  const nextMission = MISSIONS.find((m) => !progress.cleared[m.id])
  const fresh = clearedCount === 0 && save.battles === 0

  const todos: Todo[] = []
  // 새 게임의 첫 할 일은 첫 전투다 — 주인공 혼자서도 이기는 지역 (docs/20 §6)
  if (save.battles === 0) todos.push({ text: `첫 전투 — ${REGIONS[0].name} (혼자서도 이길 수 있다)`, action: '전투', go: () => onGo('battle') })
  if (nextMission) todos.push({ text: `훈련 과제 ${nextMission.no}. ${nextMission.title}`, action: '훈련소', go: () => onGoTown('missions') })
  const unallocated = save.members.filter((m) => m.statPoints > 0)
  if (unallocated.length) todos.push({ text: `${unallocated.map((m) => m.name).join('·')} — 스탯 포인트 미분배`, action: '캐릭터', go: () => onGo('characters') })
  const learners = save.members.filter(canLearnSomething)
  if (learners.length) todos.push({ text: `${learners.map((m) => m.name).join('·')} — 배울 수 있는 스킬 있음`, action: '캐릭터', go: () => onGo('characters') })
  if (party.length < PARTY_MAX && save.members.length > party.length) {
    todos.push({ text: `출전 ${party.length}/${PARTY_MAX}명 — 대기 단원 ${save.members.length - party.length}명`, action: '편성', go: () => onGo('formation') })
  }
  if (party.length < PARTY_MAX && save.members.length === party.length && save.members.length < MEMBER_MAX && Object.keys(HIRE).some((j) => canHire(save, j))) {
    todos.push({ text: `출전 자리가 남았고 금 ${save.gold} — 용병소에서 동료를 고용하면 바로 출전한다`, action: '용병소', go: () => onGoTown('recruit') })
  }
  // 들 수 있는 무기가 없는 직업(주인공 — 전용 무기 기획 중)은 빼고 센다
  const unarmed = party.filter((m) => !m.gear?.weapon && (JOB_WEAPONS[m.job] ?? []).length > 0)
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
          {/* 게임 소개 · 단장의 임무는 로그인 전 타이틀로 옮겼다 (GameIntro, docs/25 §4 ①). 여기는 시작 직후 안내만 */}
          <dl>
            <dt>뭐부터?</dt>
            <dd>
              처음엔 주인공 혼자다. <b>전투 → 마을 외곽</b>은 혼자서도 이긴다. 금이 모이면 <b>마을 → 용병소</b>에서 동료를 고용하자 — 자리가 있으면 바로 출전한다.
              마을 외곽에서 3승하면 <b>가도</b>가 열리는데, 상대가 3~4명이라 동료 둘은 있어야 한다.
            </dd>
            <dt>수칙은 어디서 배우나?</dt>
            <dd>마을의 훈련소 과제. 과제 하나에 개념 하나다. 전투와 상관없이 언제든 할 수 있다.</dd>
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
                    <UnitPortrait icon={memberIcon(m)} size="full" />
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

      <Section
        title="최근 전투"
        note={`${save.battles}전 ${save.wins}승 · 기록 ${save.log.length}건`}
        help="전투는 결정론입니다. 시드와 양 팀 편성만 저장해 두면 언제든 그때 그 판을 똑같이 다시 볼 수 있습니다. 진 판을 다시 보는 것이 수칙을 고치는 가장 빠른 길입니다."
      >
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
            <Replay result={replay.result} names={replay.names} jobs={replay.jobs} autoPlay={false} backdrop={record.regionId.replace(/^adv:/, '')} />
          </div>
        )}
      </Section>

      <Section title="용병단" help="이름은 전투 기록과 비교 카드에 그대로 나옵니다. 다른 용병단과 겹칠 수 없습니다. 진행은 계정에 자동으로 저장됩니다.">
      <RenameTeam current={save.name} onRename={onRename} />
      <div className="account-row">
        <span>계정 <b>{loginId}</b></span>
        <button onClick={onLogout}>로그아웃</button>
      </div>
      <details className="saveio">
        <summary>저장 관리</summary>
        <p className="hint">백업용 내보내기 → 가져오기. 단원 · 장비 · 재료 · 전투 기록 · 수칙 프리셋이 전부 함께 갑니다. 가져와도 용병단 이름은 지금 이름을 유지합니다.</p>
        <div className="run-bar">
          <button onClick={() => { setIo(exportGame(save)); setMsg('아래 상자의 내용을 복사해 두세요.') }}>내보내기</button>
          <button onClick={() => { const g = importGame(io); if (g) { onSave({ ...g, name: save.name }); setMsg('가져왔습니다.') } else setMsg('형식이 맞지 않습니다.') }}>가져오기</button>
          <small>{msg}</small>
        </div>
        <textarea value={io} onChange={(e) => setIo(e.target.value)} rows={4} placeholder="내보내기를 누르거나, 저장 JSON 을 붙여넣으세요" />
      </details>
      </Section>
      {DEBUG && <DebugCheatPanel save={save} onSave={onSave} />}
    </section>
  )
}

/** 용병단 이름 바꾸기 — 누를 때 중복을 확인한다 (계정제 전에는 입력하는 대로 바뀌었다) */
function RenameTeam({ current, onRename }: { current: string; onRename: (name: string) => Promise<string | null> }) {
  const [draft, setDraft] = useState(current)
  const [msg, setMsg] = useState<{ bad: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const changed = draft.trim() !== current

  const submit = async () => {
    if (!changed || busy) return
    setBusy(true)
    const err = await onRename(draft)
    setBusy(false)
    setMsg(err ? { bad: true, text: err } : { bad: false, text: '바꿨습니다.' })
  }

  return (
    <div className="rename">
      <span>이름</span>
      <input value={draft} maxLength={TEAM_NAME_MAX} onChange={(e) => { setDraft(e.target.value); setMsg(null) }} onKeyDown={(e) => { if (e.key === 'Enter') void submit() }} />
      <button disabled={!changed || busy} onClick={() => void submit()}>바꾸기</button>
      {msg && <small className={msg.bad ? 'auth-error' : ''}>{msg.text}</small>}
    </div>
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
