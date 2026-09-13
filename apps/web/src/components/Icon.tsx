// 32×32 도트 아이콘 (M2-8, 2026-09-13). 리소스는 Codex 가 만들고 여기서 화면에 붙인다.
//
// 경로는 `assets/manifest.json` 과 같은 규칙이다 — `<종류>/<id>.png`.
// 매니페스트를 런타임에 읽지 않는 이유는 `jobIcon()` 과 같다: assets 는 Vite 의 publicDir 이라
// 번들이 아니라 그대로 실려 나가고, id 만 알면 경로가 정해진다.
//
// 다만 PNG 가 없는 id 가 생길 수 있으므로(새 스킬을 넣고 그림을 아직 안 만든 경우)
// **onError 로 같은 이름의 SVG 로 물러선다.** 87종은 PNG·SVG 가 둘 다 있다.
import { useState } from 'react'

type Kind = 'skills' | 'items' | 'status' | 'traits'
type Size = 'sm' | 'md' | 'lg'

const base = (): string => import.meta.env.BASE_URL

interface IconProps {
  id: string
  alt?: string
  size?: Size
  /** 글줄 안에 섞어 놓을 때 (표 한 칸, 문장 속) */
  inline?: boolean
}

function Img({ kind, id, alt, size, inline }: IconProps & { kind: Kind; alt: string; size: Size }) {
  const [ext, setExt] = useState<'png' | 'svg'>('png')
  const [gone, setGone] = useState(false)
  if (gone) return null
  return (
    <img
      className={`dot-icon ${size}${inline ? ' inline' : ''}`}
      src={`${base()}${kind}/${id}.${ext}`}
      alt={alt}
      title={alt || undefined}
      loading="lazy"
      draggable={false}
      // PNG → SVG → 포기. 그림이 없다고 글자까지 깨지면 안 된다
      onError={() => (ext === 'png' ? setExt('svg') : setGone(true))}
    />
  )
}

/**
 * 스킬 아이콘은 **프레임(슬롯)에 담는다** (단장 지시 2026-09-13).
 * 스킬은 "고르는 것"이라 칸에 놓인 물건처럼 보여야 한다 — 장비·재료와 구별되는 이유이기도 하다.
 */
export function SkillIcon({ id, alt = '', size = 'md', inline }: IconProps) {
  return (
    <span className={`skill-frame ${size}${inline ? ' inline' : ''}`} aria-hidden={alt ? undefined : true}>
      <Img kind="skills" id={id} alt={alt} size={size} />
    </span>
  )
}

/** 장비·재료. 프레임 없이 물건만 */
export function ItemIcon({ id, alt = '', size = 'md', inline }: IconProps) {
  return <Img kind="items" id={id} alt={alt} size={size} inline={inline} />
}

/** 상태이상. 전투 중 칩에 섞여 들어간다 */
export function StatusIcon({ id, alt = '', size = 'sm', inline }: IconProps) {
  return <Img kind="status" id={id} alt={alt} size={size} inline={inline} />
}

/** 특성. 글줄 안에 섞이는 일이 많아 기본이 작다 */
export function TraitIcon({ id, alt = '', size = 'sm', inline }: IconProps) {
  return <Img kind="traits" id={id} alt={alt} size={size} inline={inline} />
}
