// 24×24 도트 아이콘 (M2-8, 2026-09-13 · 09-14 제로식 규격 — 24px 1배 · 48px 2배로만 쓴다, docs/14 §1). 리소스는 Codex 가 만들고 여기서 화면에 붙인다.
//
// 경로는 `assets/manifest.json` 과 같은 규칙이다 — `<종류>/<id>.png`.
// 매니페스트를 런타임에 읽지 않는 이유는 `jobIcon()` 과 같다: assets 는 Vite 의 publicDir 이라
// 번들이 아니라 그대로 실려 나가고, id 만 알면 경로가 정해진다.
//
// 다만 PNG 가 없는 id 가 생길 수 있으므로(새 스킬을 넣고 그림을 아직 안 만든 경우)
// **onError 로 같은 이름의 SVG 로 물러선다.** 87종은 PNG·SVG 가 둘 다 있다.
import { useState } from 'react'
import { COMMON_LEARNABLE } from '@webrpg/engine'

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

/** 누구나 0포인트로 배우는 스킬인가 — 직업별 목록은 전부 1~4 포인트라 공용 목록만 보면 된다 */
const isFreeSkill = (id: string): boolean => COMMON_LEARNABLE.some((l) => l.skillId === id && l.cost === 0)

/**
 * 스킬 아이콘은 **프레임(슬롯)에 담는다** (단장 지시 2026-09-13).
 * 스킬은 "고르는 것"이라 칸에 놓인 물건처럼 보여야 한다 — 장비·재료와 구별되는 이유이기도 하다.
 *
 * 프레임 색이 종류를 말한다 (단장 지시 2026-09-14, docs/11 §5.18):
 *   갈색 = 포인트로 배우거나 직업이 주는 스킬 · **회색 = 공짜로 배우는 스킬** · 하늘색 = 패시브(TraitIcon)
 */
export function SkillIcon({ id, alt = '', size = 'md', inline }: IconProps) {
  return (
    <span className={`skill-frame ${size}${isFreeSkill(id) ? ' free' : ''}${inline ? ' inline' : ''}`} aria-hidden={alt ? undefined : true}>
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

/**
 * 특성 = **패시브 스킬**. 수칙 없이 늘 붙어 있다 (data/traits.ts — 패시브 스킬과 장비 특성이 공용으로 쓰는 장치).
 * 그래서 스킬과 같은 프레임에 담되 **하늘색**이다 (단장 지시 2026-09-14). 글줄 안에 섞이는 일이 많아 기본이 작다
 */
export function TraitIcon({ id, alt = '', size = 'sm', inline }: IconProps) {
  return (
    <span className={`skill-frame passive ${size}${inline ? ' inline' : ''}`} aria-hidden={alt ? undefined : true}>
      <Img kind="traits" id={id} alt={alt} size={size} />
    </span>
  )
}
