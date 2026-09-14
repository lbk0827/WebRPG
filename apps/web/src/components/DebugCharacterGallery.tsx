// 디버그 · 모든 캐릭터 도트 (2026-09-14 단장 요청 — 도트 검수와 테스트용).
// 보유 단원과 상관없이 게임에 있는 캐릭터 그림을 전부 깐다. 포즈 셋을 나란히(상자 밖까지 잘리지 않게), 1배 · 2배, 밝은 · 어두운 바탕.
// 주소에 ?debug 를 붙였을 때만 캐릭터 탭 아래에 나온다 (lib/debug.ts).
import { useMemo, useState } from 'react'
import { HERO_JOB, JOB_ADVANCES, MONSTER_ICONS, MONSTER_LIST, PRESETS, advanceChain, advancesFor } from '@webrpg/engine'
import { artKey, jobIcon, jobName } from '../lib/labels'
import { useUnitSprite } from '../lib/sprites'

/** 스프라이트 상자. 그림은 이 상자 기준으로 그려지고, 무기 · 머리칼은 상자 밖으로 나갈 수 있다 (docs/16) */
const BOX_W = 48
const BOX_H = 64

/** 한 포즈(<g class="f fN">)의 사각형들이 차지하는 범위 — 상자 밖으로 나간 칸 수 */
function poseExtent(svg: string, pose: number): { l: number; r: number; t: number; b: number } {
  const start = svg.indexOf(`class="f f${pose}"`)
  const end = start < 0 ? -1 : svg.indexOf('</g>', start)
  const out = { l: 0, r: 0, t: 0, b: 0 }
  if (start < 0 || end < 0) return out
  const rect = /<rect x="(-?\d+)" y="(-?\d+)" width="(\d+)" height="(\d+)"/g
  for (const m of svg.slice(start, end).matchAll(rect)) {
    const [x, y, w, h] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])]
    out.l = Math.max(out.l, -x)
    out.t = Math.max(out.t, -y)
    out.r = Math.max(out.r, x + w - BOX_W)
    out.b = Math.max(out.b, y + h - BOX_H)
  }
  return out
}

/**
 * 포즈 하나를 **잘리지 않게** 보여 준다. 게임의 초상(.portrait)은 48×64 상자로 자르므로
 * 내리침 포즈의 뻗은 무기(오른쪽 최대 54칸) · 치켜든 무기(위 최대 17칸)가 잘렸다.
 * 여기서는 포즈마다 실제 범위만큼 틀을 넓히고, 게임 상자는 점선으로 겹쳐 그린다.
 */
function PoseFrame({ icon, pose, scale }: { icon: string; pose: number; scale: number }) {
  const svg = useUnitSprite(icon)
  const ext = useMemo(() => (svg ? poseExtent(svg, pose) : null), [svg, pose])
  if (!svg || !ext) return <img className="debug-frame fallback" src={jobIcon(icon)} alt="" />
  return (
    <span
      className={`debug-frame p${pose}`}
      title={`pose${pose} — 상자 밖 왼쪽 ${ext.l} · 오른쪽 ${ext.r} · 위 ${ext.t}`}
      style={{ width: (ext.l + BOX_W + ext.r) * scale, height: (ext.t + BOX_H + ext.b) * scale }}
    >
      <span
        className="art"
        style={{ left: ext.l * scale, top: ext.t * scale, width: BOX_W * scale, height: BOX_H * scale }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <i className="box" style={{ left: ext.l * scale, top: ext.t * scale, width: BOX_W * scale, height: BOX_H * scale }} />
    </span>
  )
}

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
                      <PoseFrame key={p} icon={e.key} pose={p} scale={scale} />
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
