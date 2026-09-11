// 전투 스테이지의 캐릭터 그림. 리그 스프라이트가 있으면 인라인 SVG(움직인다), 없으면 원형 엠블럼(가만히 있다).
// 둘을 섞어도 화면이 깨지지 않는다 — 리소스를 하나씩 만들어 가며 교체할 수 있다 (docs/15).
import { jobIcon } from '../lib/labels'
import { useUnitSprite } from '../lib/sprites'

export function UnitSprite({ icon }: { icon: string }) {
  const svg = useUnitSprite(icon)
  if (!svg) return <img className="emblem" src={jobIcon(icon)} alt="" />
  return <span className="unit" dangerouslySetInnerHTML={{ __html: svg }} />
}
