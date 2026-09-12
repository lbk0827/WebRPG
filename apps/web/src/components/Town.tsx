// 마을 (탭 개편 2026-09-11 · 2026-09-12 제로식 방식으로 밀도 개편).
// 시설이 전부 여기에 모인다. 앞으로 새 시설(제련·경매 등)도 이 안에 붙인다. 탭은 늘리지 않는다.
//
// 제로식 마을은 링크 **35개**를 한 줄씩 세로로 늘어놓는다. 밀도가 높아 한눈에 들어오고,
// 시설이 늘어도 구조가 그대로 버틴다. 우리도 카드 격자를 **한 줄 목록**으로 바꾼다.
// 다만 그쪽처럼 35개를 그냥 나열하면 처음 온 사람에게는 벽이다 —
// **묶음 머리글**(사람 · 물건 · 배움)을 달아 무엇을 하러 왔는지로 찾게 한다. 제로식에는 없는 것이다.
import { useEffect, useState } from 'react'
import { MEMBER_MAX, MISSIONS, PRESETS, RECIPES, canCraft } from '@webrpg/engine'
import type { GameSave } from '../game/save'
import { canHire, shopTier } from '../game/members'
import type { MissionProgress } from '../missionState'
import { Recruit } from './Recruit'
import { Shop } from './Shop'
import { Workshop } from './Workshop'
import { Codex } from './Codex'
import { MissionList } from './MissionList'
import { MissionPlay } from './MissionPlay'

export type Facility = 'hub' | 'recruit' | 'shop' | 'workshop' | 'codex' | 'missions'

/** 무엇을 하러 왔는지로 묶는다 (제로식은 35개를 그냥 나열해 벽이 된다) */
const GROUPS: { title: string; note: string; items: Exclude<Facility, 'hub'>[] }[] = [
  { title: '사람', note: '단원을 늘린다', items: ['recruit'] },
  { title: '물건', note: '장비를 구하고 다듬는다', items: ['shop', 'workshop'] },
  { title: '배움', note: '수칙을 배우고 수치를 찾아본다', items: ['missions', 'codex'] },
]

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
  progress: MissionProgress
  onProgress: (next: MissionProgress) => void
  /** 다른 탭에서 "마을 → 상점" 으로 바로 들어올 때 */
  initial?: Facility
  onGoFormation: () => void
  onGoBattle: () => void
}

export function Town({ save, onSave, progress, onProgress, initial = 'hub', onGoFormation, onGoBattle }: Props) {
  const [at, setAt] = useState<Facility>(initial)
  const [missionId, setMissionId] = useState<string | null>(null)
  useEffect(() => { setAt(initial); setMissionId(null) }, [initial])

  const go = (f: Facility) => { setAt(f); setMissionId(null); window.scrollTo(0, 0) }
  const back = () => go('hub')

  const cleared = MISSIONS.filter((m) => progress.cleared[m.id]).length
  const nextMission = MISSIONS.find((m) => !progress.cleared[m.id])
  const hireable = Object.keys(PRESETS).filter((j) => canHire(save, j)).length
  const craftable = RECIPES.filter((r) => canCraft(r, save.materials, save.gold)).length
  const matCount = Object.values(save.materials).reduce((a, b) => a + b, 0)

  if (at === 'recruit') {
    return (
      <section className="town-facility">
        <div className="mission-head">
          <button className="link" onClick={back}>← 마을</button>
          <h2>용병소 <small>새 단원을 고용한다</small></h2>
        </div>
        <Recruit save={save} onSave={onSave} />
        <p className="hint">고용한 단원은 <button className="link" onClick={onGoFormation}>편성 판</button>에 세워야 싸웁니다. 스탯·스킬·장비는 캐릭터 탭에서.</p>
      </section>
    )
  }
  if (at === 'shop') return <Shop save={save} onSave={onSave} onBack={back} onGoFormation={onGoFormation} />
  if (at === 'workshop') return <Workshop save={save} onSave={onSave} onBack={back} onGoQuest={onGoBattle} />
  if (at === 'codex') return <Codex onBack={back} />
  if (at === 'missions') {
    const mission = missionId ? MISSIONS.find((m) => m.id === missionId) ?? null : null
    const next = mission ? MISSIONS[mission.no] : undefined
    if (mission) {
      return (
        <MissionPlay
          key={mission.id}
          mission={mission}
          progress={progress}
          onProgress={onProgress}
          onBack={() => { setMissionId(null); window.scrollTo(0, 0) }}
          onNext={next ? () => { setMissionId(next.id); window.scrollTo(0, 0) } : null}
        />
      )
    }
    return <MissionList progress={progress} onOpen={(id) => { setMissionId(id); window.scrollTo(0, 0) }} onFree={onGoBattle} onBack={back} />
  }

  // 무엇을 하러 왔는지로 묶는다. 시설이 늘면 여기에만 더한다
  const desc: Record<Exclude<Facility, 'hub'>, { ico: string; name: string; what: string; state: string; warn?: boolean }> = {
    recruit: {
      ico: '🛡️', name: '용병소', what: '새 단원을 고용한다',
      state: hireable > 0 ? `고용 가능한 직업 ${hireable}종` : '금이 모자랍니다', warn: hireable === 0,
    },
    shop: {
      ico: '🏪', name: '상점', what: '장비를 사고판다',
      state: `등급 ${shopTier(save)} · 창고 ${save.inventory.length}개`,
    },
    workshop: {
      ico: '🔨', name: '공방', what: '강화하고 재료로 만든다',
      state: craftable > 0 ? `만들 수 있는 것 ${craftable}가지` : `재료 ${matCount}개`,
    },
    missions: {
      ico: '📜', name: '훈련소', what: `교전 수칙을 가르치는 과제 ${MISSIONS.length}개`,
      state: `${cleared}/${MISSIONS.length} 완료${nextMission ? ` · 다음 ${nextMission.title}` : ' · 전부 마침'}`,
      warn: cleared < MISSIONS.length,
    },
    codex: {
      ico: '📖', name: '자료실', what: '스킬 · 장비 · 조건 · 지역과 상대',
      state: '엔진 데이터에서 그대로 만든 표',
    },
  }

  return (
    <section className="town">
      <h2>마을 <small>금 {save.gold} · 단원 {save.members.length}/{MEMBER_MAX} · 재료 {matCount}개</small></h2>
      {GROUPS.map((g) => (
        <div key={g.title} className="town-group">
          <h3>{g.title} <small>{g.note}</small></h3>
          <ul className="facilities">
            {g.items.map((f) => {
              const d = desc[f]
              return (
                <li key={f} className="facility">
                  <button onClick={() => go(f)}>
                    <span className="ico">{d.ico}</span>
                    <span className="nm">{d.name}</span>
                    <small className="what">{d.what}</small>
                    <small className={`state ${d.warn ? 'warn' : ''}`}>{d.state}</small>
                    <span className="go" aria-hidden="true">→</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </section>
  )
}
