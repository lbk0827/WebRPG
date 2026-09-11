// 마을 (탭 개편 2026-09-11, 단장 지시). 시설이 전부 여기에 모인다 — 용병소 · 상점 · 공방 · 도감 · 훈련소.
// 앞으로 새 시설(제련·경매 등)도 이 안에 붙인다. 탭은 늘리지 않는다.
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

  return (
    <section className="town">
      <h2>마을 <small>금 {save.gold} · 단원 {save.members.length}/{MEMBER_MAX} · 재료 {matCount}개</small></h2>
      <ul className="facilities">
        <li className="facility">
          <button onClick={() => go('recruit')}>
            <span className="ico">🛡️</span>
            <span className="body">
              <b>용병소</b>
              <small>새 단원을 고용한다. 해고와 이름 변경은 캐릭터 탭에서.</small>
              <small className="state">{hireable > 0 ? `지금 고용 가능한 직업 ${hireable}종` : '금이 모자랍니다'}</small>
            </span>
          </button>
        </li>
        <li className="facility">
          <button onClick={() => go('shop')}>
            <span className="ico">🏪</span>
            <span className="body">
              <b>상점</b>
              <small>장비를 사고판다. 산 물건은 창고로.</small>
              <small className="state">등급 {shopTier(save)} · 창고 {save.inventory.length}개</small>
            </span>
          </button>
        </li>
        <li className="facility">
          <button onClick={() => go('workshop')}>
            <span className="ico">🔨</span>
            <span className="body">
              <b>공방</b>
              <small>장비를 강화하고 재료로 만든다. 실패해도 장비는 그대로.</small>
              <small className="state">{craftable > 0 ? `만들 수 있는 것 ${craftable}가지` : `재료 ${matCount}개`}</small>
            </span>
          </button>
        </li>
        <li className="facility">
          <button onClick={() => go('missions')}>
            <span className="ico">📜</span>
            <span className="body">
              <b>훈련소</b>
              <small>교전 수칙을 처음부터 가르치는 과제 {MISSIONS.length}개. 개념 하나에 과제 하나.</small>
              <small className="state">{cleared}/{MISSIONS.length} 완료{nextMission ? ` · 다음: ${nextMission.title}` : ' · 전부 마침'}</small>
            </span>
          </button>
        </li>
        <li className="facility">
          <button onClick={() => go('codex')}>
            <span className="ico">📖</span>
            <span className="body">
              <b>자료실</b>
              <small>스킬 · 장비 · 상태이상 · 특성 · 조건 · 스탯 · 지역과 상대.</small>
              <small className="state">엔진 데이터에서 그대로 만든 표 — 여기 적힌 숫자가 실제 숫자다</small>
            </span>
          </button>
        </li>
      </ul>
    </section>
  )
}
