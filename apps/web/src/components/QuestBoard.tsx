// 전투 — 지역 목록 (M2-1 · 2026-09-12 접이식 · 2026-09-13 제로식 HOF 방식으로 개편, 단장 지시).
//
// 제로식 전투 탭은 두 단계다: 지역 목록 → 맵을 누르면 **전투 맵 페이지**로 넘어가 거기서 편성하고 싸운다.
// 전에는 이 한 페이지에 출전 명단(PartyBar)과 접이식 지역 블록을 다 넣었다. 지역이 10곳이 되니
// 편성판·펼친 블록·결과가 한 화면에 섞여 길어졌다. 제로식처럼 목록과 맵을 나눈다 (BattleMap).
//
// 목록은 제로식의 "지역 (적정 레벨 : a-b)( n )" 묶음을 따른다. 제로식은 한 지역 안에 맵이 여럿이지만
// 우리 지역은 맵 하나씩이라 **레벨대로 묶는다** (입문 · 중반 · 후반 · 전직 전제).
// 잠긴 지역도 누르면 들어가 볼 수 있다 — 등장 몬스터를 미리 보는 것도 준비다. 싸우자만 막힌다.
import { useMemo, useState } from 'react'
import { MONSTERS, REGIONS, isRegionUnlocked, type RegionDef } from '@webrpg/engine'
import type { GameSave } from '../game/save'
import { partyMembers, partySummary } from '../game/members'
import { BattleMap } from './BattleMap'
import { UnitPortrait } from './UnitPortrait'

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
  onGoFormation: () => void
}

const GROUPS: { name: string; test: (r: RegionDef) => boolean }[] = [
  { name: '입문', test: (r) => r.expects !== 'advanced' && r.recommended[0] < 12 },
  { name: '중반', test: (r) => r.expects !== 'advanced' && r.recommended[0] >= 12 && r.recommended[0] < 23 },
  { name: '후반', test: (r) => r.expects !== 'advanced' && r.recommended[0] >= 23 },
  { name: '전직 전제', test: (r) => r.expects === 'advanced' },
]

const groupOf = (r: RegionDef): string => GROUPS.find((g) => g.test(r))?.name ?? ''

/** 목록·제목에 쓰는 얼굴 — 그 지역의 첫 번째 보이는 상대 */
const regionIcon = (r: RegionDef): string => {
  const d = r.table.map((t) => MONSTERS[t.monsterId]).find((m) => m && !m.hidden)
  return d ? d.icon ?? d.job : 'warrior'
}

export function QuestBoard({ save, onSave, onGoFormation }: Props) {
  const [sel, setSel] = useState<string | null>(null)
  const party = partyMembers(save)
  const us = partySummary(save)
  // 해금된 것 중 가장 깊은 곳 — 지금 할 곳이다
  const deepest = useMemo(() => {
    const open = REGIONS.filter((r) => isRegionUnlocked(r, save.regionWins))
    return open[open.length - 1]?.id
  }, [save.regionWins])

  const region = sel ? REGIONS.find((r) => r.id === sel) : undefined
  if (region) {
    return (
      <BattleMap
        key={region.id}
        save={save}
        onSave={onSave}
        region={region}
        group={groupOf(region)}
        icon={regionIcon(region)}
        onBack={() => {
          setSel(null)
          window.scrollTo(0, 0)
        }}
        onGoFormation={onGoFormation}
      />
    )
  }

  const enter = (id: string) => {
    setSel(id)
    window.scrollTo(0, 0)
  }

  return (
    <section className="quest">
      <h2>전투 <small>금 {save.gold} · 편성 {party.length}명 · 평균 레벨 {us.avgLevel}</small></h2>
      <h3 className="bar-title">전투 지역 <small>누르면 그 지역으로 이동합니다. 편성과 출전은 지역 안에서</small></h3>
      <ol className="map-groups">
        {GROUPS.map((g) => {
          const list = REGIONS.filter(g.test)
          if (list.length === 0) return null
          const lo = Math.min(...list.map((r) => r.recommended[0]))
          const hi = Math.max(...list.map((r) => r.recommended[1]))
          return (
            <li key={g.name} className="map-group">
              <h3>
                <UnitPortrait icon={regionIcon(list[0])} size="xs" inline />
                {g.name} <small>(적정 레벨 {lo}–{hi}) ( {list.length} )</small>
              </h3>
              <ul className="map-list">
                {list.map((r) => {
                  const unlocked = isRegionUnlocked(r, save.regionWins)
                  const wins = save.regionWins[r.id] ?? 0
                  const need = r.unlock ? save.regionWins[r.unlock.regionId] ?? 0 : 0
                  const from = r.unlock ? REGIONS.find((x) => x.id === r.unlock!.regionId)?.name : ''
                  const here = r.id === deepest
                  return (
                    <li key={r.id} className={`map-entry ${unlocked ? '' : 'locked'} ${here ? 'here' : ''}`}>
                      <button onClick={() => enter(r.id)}>
                        <UnitPortrait icon={regionIcon(r)} size="xs" />
                        <span className="nm">{r.name}</span>
                        <span className="tags">
                          {here && <small className="here-badge">지금 여기</small>}
                          {r.expects === 'advanced' && <small className="adv-badge">전직 전제</small>}
                        </span>
                        <small className="meta">
                          {unlocked ? `권장 Lv ${r.recommended[0]}–${r.recommended[1]} · ${wins}승` : `🔒 ${from} ${need}/${r.unlock!.wins}승`}
                        </small>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
