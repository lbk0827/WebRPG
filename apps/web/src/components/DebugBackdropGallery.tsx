// 디버그 · 전투 배경 (docs/23). 주소에 ?debug 를 붙였을 때만 캐릭터 탭 아래에 나온다.
// 지역을 열지 않고도 배경 20장을 실제 전투판(.arena)과 같은 규칙으로 본다 — 캐릭터 · 이름 · HP 바를 올려 가독성까지.
// 파일은 왔는데 lib/backdrops.ts 의 BACKDROP_READY 에 아직 안 적은 그림도 미리 보여 준다.
import { useEffect, useState, type CSSProperties } from 'react'
import { ADVENTURE_BACKDROP_FALLBACK, BACKDROP_KEYS, BACKDROP_READY, backdropFor, backdropUrl, type BackdropDef } from '../lib/backdrops'
import { UnitSprite } from './UnitSprite'

/** 그 경로에 그림이 있는가 (없으면 콘솔에 404 가 찍힌다 — 디버그에서만 묻는다) */
function useFileExists(url: string, enabled: boolean): boolean | null {
  const [ok, setOk] = useState<boolean | null>(null)
  useEffect(() => {
    if (!enabled) return
    let alive = true
    const img = new Image()
    img.onload = () => alive && setOk(true)
    img.onerror = () => alive && setOk(false)
    img.src = url
    return () => {
      alive = false
    }
  }, [url, enabled])
  return ok
}

function MockChar({ icon, name, hp }: { icon: string; name: string; hp: number }) {
  return (
    <div className="char">
      <div className="sprite">
        <UnitSprite icon={icon} />
      </div>
      <div className="nm">{name}</div>
      <div className="bar hp"><i style={{ width: `${hp}%` }} /></div>
      <div className="bar sp"><i style={{ width: '45%' }} /></div>
    </div>
  )
}

function BackdropPreview({ def, probe }: { def: BackdropDef; probe: boolean }) {
  const resolved = backdropFor(def.key)
  const exists = useFileExists(backdropUrl(def.key), probe && !BACKDROP_READY[def.key])
  // 등록 전이라도 파일이 있으면 그 그림으로 미리 본다
  const own = BACKDROP_READY[def.key] || exists
  const url = own ? backdropUrl(def.key) : resolved?.url
  const top = BACKDROP_READY[def.key]?.top ?? resolved?.top ?? '#2a2a33'
  const style = url ? ({ '--backdrop': `url("${url}")`, '--backdrop-top': top } as CSSProperties) : undefined
  const status = BACKDROP_READY[def.key]
    ? '등록됨'
    : exists
      ? '파일 있음 · 등록 전 — lib/backdrops.ts 의 BACKDROP_READY 에 추가'
      : resolved
        ? `빌린 그림: ${resolved.key}`
        : exists === null && probe
          ? '확인 중'
          : '그림 없음 — 그라디언트'

  return (
    <li className={own ? 'ready' : ''}>
      <header>
        <b>{def.kind === 'region' ? def.no : `모험 ${def.no}`}. {def.name}</b>
        <code>{def.key}</code>
        {def.kind === 'adventure' && <small>없으면 → {ADVENTURE_BACKDROP_FALLBACK[def.key]}</small>}
        <em>{status}</em>
      </header>
      <div className={`arena${url ? ' has-backdrop' : ''}`} style={style}>
        <div className="side t0">
          <div className="col back"><MockChar icon="mage" name="마법사" hp={80} /></div>
          <div className="col front"><MockChar icon="adventurer-male" name="모험가" hp={55} /></div>
        </div>
        <div className="center">
          <div className="headline">3번째 행동</div>
        </div>
        <div className="side t1">
          <div className="col front"><MockChar icon="goblin" name="상대 전열" hp={35} /></div>
          <div className="col back"><MockChar icon="shaman" name="상대 후열" hp={90} /></div>
        </div>
      </div>
    </li>
  )
}

export function DebugBackdropGallery() {
  const [open, setOpen] = useState(false)
  const ready = BACKDROP_KEYS.filter((d) => BACKDROP_READY[d.key]).length
  return (
    <details className="debug-gallery debug-backdrops" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary>디버그 · 전투 배경 <small>{ready}/{BACKDROP_KEYS.length} 도착</small></summary>
      <p className="hint">실제 전투판과 같은 규칙(폰 1배 · 데스크톱 2배, 아래 가운데 기준)으로 그린다. 규격은 docs/23.</p>
      {/* 펼쳤을 때만 파일을 묻는다 — 닫혀 있으면 404 를 만들지 않는다 */}
      <ul>
        {BACKDROP_KEYS.map((d) => (
          <BackdropPreview key={d.key} def={d} probe={open} />
        ))}
      </ul>
    </details>
  )
}
