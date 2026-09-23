// 능력치 정보 한 줄을 색으로 갈라 그린다 (단장 지시 2026-09-17, docs/11 §5.20).
//
// 제로식은 능력치 이름마다 색을 고정해 두고 장비 옵션 · 스킬 · 버프/디버프 어디서나 같은 색을 쓴다.
// 우리도 같은 방식이다. 색이 붙을 축은 `labels.ts` 의 `Axis` 여덟 개뿐이고, 어느 값이 어느 축인지는
// `itemParts()` · `skillPartList()` 가 정한다 — 화면은 그걸 그리기만 한다. 그래서 색 규칙이 한 곳에 모인다.
import { Fragment } from 'react'
import type { ItemDef, ItemInstance } from '@webrpg/engine'
import { itemParts, skillPartList, type Part } from '../lib/labels'

/** 색 토막들을 " · " 로 이어 그린다. 구분자에는 색을 주지 않는다 */
export function Spec({ parts }: { parts: Part[] }) {
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && ' · '}
          <span className={p.axis === 'plain' ? undefined : `ax-${p.axis}`}>{p.text}</span>
        </Fragment>
      ))}
    </>
  )
}

/** 장비 옵션 줄 — "물리 +18 · 방어 5% +10 · 마방 +5 · 운 +10 · [방벽]" */
export const ItemSpec = ({ def, inst }: { def: ItemDef; inst?: ItemInstance }) => <Spec parts={itemParts(def, inst)} />

/** 스킬 정보 줄 — "SP 8 · 적 1명 · 즉시 · 물리 300% · 엄호 무시" */
export const SkillSpec = ({ id }: { id: string }) => <Spec parts={skillPartList(id)} />
