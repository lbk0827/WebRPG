// 디버그 · 모든 캐릭터 도트 (2026-09-14 단장 요청 — 도트 검수와 테스트용).
// 보유 단원과 상관없이 게임에 있는 캐릭터 그림을 전부 깐다. 포즈 셋을 나란히, 1배 · 2배, 밝은 · 어두운 바탕.
// 주소에 ?debug 를 붙였을 때만 캐릭터 탭 아래에 나온다 (lib/debug.ts).
import { useState } from 'react'
import { HERO_JOB, JOB_ADVANCES, MONSTER_ICONS, MONSTER_LIST, PRESETS, advanceChain, advancesFor } from '@webrpg/engine'
import { artKey, jobName } from '../lib/labels'
import { UnitPortrait } from './UnitPortrait'

interface Entry {
  key: string
  name: string
  note?: string
}

const GENDERS = [
  ['male', '남'],
  ['female', '여'],
] as const

/** 주인공 계보: 모험가 → 전직 사슬의 모든 단계 × 성별 */
const heroStages = [HERO_JOB, ...JOB_ADVANCES.filter((a) => advanceChain(a.id)[0]?.base === HERO_JOB).map((a) => a.id)]
const HERO: Entry[] = heroStages.flatMap((stage) =>
  GENDERS.map(([g, label]) => ({
    key: `${stage}-${g}`,
    name: `${jobName(stage)}(${label})`,
    note: stage === HERO_JOB ? 'Lv1' : `← ${jobName(advanceChain(stage).at(-1)?.base ?? HERO_JOB)}`,
  })),
)

/** 기본 직업. 2차 직업은 아직 기본 직업 그림을 같이 쓴다 */
const JOBS: Entry[] = Object.keys(PRESETS)
  .filter((j) => j !== HERO_JOB)
  .map((j) => ({ key: j, name: jobName(j), note: advancesFor(j).map((a) => a.name).join(' · ') }))

/** 몬스터 원형. 사람 적은 직업 그림을 쓰므로 원형 아이콘을 가진 몬스터만 모은다 */
const MONSTERS: Entry[] = MONSTER_ICONS.map((icon) => ({
  key: icon,
  name: icon,
  note: MONSTER_LIST.filter((m) => m.icon === icon).map((m) => m.name).join(' · '),
}))

const GROUPS: [string, Entry[]][] = [
  ['주인공 계보', HERO],
  ['기본 직업', JOBS],
  ['몬스터 원형', MONSTERS],
]

export function DebugCharacterGallery() {
  const [scale, setScale] = useState<1 | 2>(2)
  const [dark, setDark] = useState(false)

  return (
    <details className={`debug-gallery x${scale} ${dark ? 'dark' : ''}`} open>
      <summary>디버그 · 모든 캐릭터 도트</summary>
      <div className="debug-controls">
        <span>배율</span>
        {([1, 2] as const).map((s) => (
          <button key={s} className={scale === s ? 'primary' : ''} onClick={() => setScale(s)}>{s}배</button>
        ))}
        <span>바탕</span>
        <button className={!dark ? 'primary' : ''} onClick={() => setDark(false)}>밝게</button>
        <button className={dark ? 'primary' : ''} onClick={() => setDark(true)}>어둡게</button>
        <small>끄기: 주소 뒤에 ?debug=0</small>
      </div>

      {GROUPS.map(([title, entries]) => (
        <section key={title}>
          <h3>{title} <small>{entries.length}</small></h3>
          <ul className="debug-grid">
            {entries.map((e) => {
              const standIn = artKey(e.key) !== e.key
              return (
                <li key={e.key} className={standIn ? 'stand-in' : ''}>
                  <div className="poses">
                    {[0, 1, 2].map((p) => (
                      <span key={p} className={`debug-pose-${p}`} title={`pose${p}`}>
                        <UnitPortrait icon={e.key} size={scale === 2 ? 'xl' : 'full'} alt={`${e.name} pose${p}`} />
                      </span>
                    ))}
                  </div>
                  <b>{e.name}</b>
                  <code>{e.key}</code>
                  {standIn && <em>대체 그림: {jobName(artKey(e.key))}</em>}
                  {e.note && <small>{e.note}</small>}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </details>
  )
}
