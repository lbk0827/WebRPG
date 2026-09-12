// 목록·판에 쓰는 정지 초상. 전투 스테이지의 UnitSprite 와 다르다 —
// 움직이지 않고, 상자에 맞춰 잘라 쓴다 (docs/15 §4 의 움직임은 .char 안에서만 걸린다).
//
// 도트는 정수 배율에서만 깨지지 않는다. 그래서 줄이지 않고 **1배로 두고 창을 씌운다**:
//   full — 48×64 전신 그대로
//   md   — 40×40 창으로 머리와 상체
//   sm   — 28×28 창으로 머리만
//   xs   — 22×22 창으로 얼굴만 (표 한 칸)
// 스프라이트가 아직 없는 캐릭터는 기존 원형 엠블럼으로 물러선다.
import { jobIcon } from '../lib/labels'
import { useUnitSprite } from '../lib/sprites'

type Size = 'xs' | 'sm' | 'md' | 'full'

export function UnitPortrait({
  icon,
  size = 'md',
  alt = '',
  inline,
}: {
  icon: string
  size?: Size
  alt?: string
  /** 글줄 안에 섞어 놓을 때 (표 한 칸 등) */
  inline?: boolean
}) {
  const svg = useUnitSprite(icon)
  const cls = `portrait ${size}${inline ? ' inline' : ''}`
  if (!svg) return <img className={`${cls} fallback`} src={jobIcon(icon)} alt={alt} />
  return <span className={cls} role="img" aria-label={alt} dangerouslySetInnerHTML={{ __html: svg }} />
}
