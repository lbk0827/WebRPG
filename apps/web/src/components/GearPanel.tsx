// 장비 (M2-4a · 2026-09-12 비교 목록으로 개편, 단장 지시).
//
// 전에는 슬롯마다 드롭다운 하나였다. 열어야 목록이 보이고, 열어도 "뭐가 더 나은지"는 안 보였다.
// 제로식 장비 화면처럼 **낄 수 있는 것을 전부 펼쳐 놓고** 고르게 한다.
//
// 다만 제로식에도 없는 것을 하나 더한다 — **지금 낀 것 대비 증감**.
// 그쪽은 카테고리 드롭다운에서 고르고 Equip 을 누를 뿐이라 비교가 없다.
// 우리는 후보마다 `물리 +18 · 힘 −2` 를 색으로 보여 준다. 그게 이 화면이 있는 이유다.
//
// 창고만 보면 모자라다 — 좋은 건 대개 다른 단원이 끼고 있다. 그것도 같이 보여 주고 바로 가져온다.
import type { GearSlot, ItemInstance } from '@webrpg/engine'
import { ITEMS, SLOT_LABEL, WEAPON_TYPE_LABEL } from '@webrpg/engine'
import type { GameSave, Member } from '../game/save'
import { equipItem, equippableFor, gearSummary, takeFrom, unequipItem, wornByOthers } from '../game/members'
import { gearDelta, gearWorth, itemBrief, itemName, traitDelta, traitLabel } from '../lib/labels'

const GEAR_SLOTS: GearSlot[] = ['weapon', 'armor', 'trinket']
const STAT_LABEL: Record<string, string> = { str: '힘', int: '지능', dex: '손재주', spd: '속도', luk: '운', maxHp: 'HP', maxSp: 'SP', def: '방어', mdef: '마방' }

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
  member: Member
  onGoShop: () => void
}

/** 후보 한 줄이 보여 줄 증감 칩들 */
function DeltaChips({ next, cur }: { next?: ItemInstance; cur?: ItemInstance }) {
  const d = gearDelta(next, cur)
  const t = traitDelta(next, cur)
  if (d.length === 0 && t.gain.length === 0 && t.lose.length === 0) return <small className="same">차이 없음</small>
  return (
    <span className="deltas">
      {d.map((x) => (
        <small key={x.label} className={x.value > 0 ? 'up' : 'down'}>
          {x.label} {x.value > 0 ? '+' : ''}{x.value}
        </small>
      ))}
      {t.gain.map((id) => (
        <small key={`g${id}`} className="up">＋[{traitLabel(id)}]</small>
      ))}
      {t.lose.map((id) => (
        <small key={`l${id}`} className="down">－[{traitLabel(id)}]</small>
      ))}
    </span>
  )
}

export function GearPanel({ save, onSave, member, onGoShop }: Props) {
  const g = gearSummary(member)
  const [pp, pf, mp, mf] = g.def
  const totals: string[] = []
  if (g.atk[0]) totals.push(`물리 +${g.atk[0]}`)
  if (g.atk[1]) totals.push(`마법 +${g.atk[1]}`)
  if (pp || pf) totals.push(`방어${pp ? ` ${pp}%` : ''}${pf ? ` +${pf}` : ''}`)
  if (mp || mf) totals.push(`마방${mp ? ` ${mp}%` : ''}${mf ? ` +${mf}` : ''}`)
  for (const [k, v] of Object.entries(g.stats)) if (v) totals.push(`${STAT_LABEL[k] ?? k} ${v > 0 ? '+' : ''}${v}`)

  return (
    <div className="gear">
      {/* 지금 착용 합계 — 제로식의 Current Equip's 자리 */}
      <div className="gear-total">
        <b>지금 합계</b>
        {totals.length ? <span>{totals.join(' · ')}</span> : <small className="empty">낀 장비가 없습니다</small>}
        {g.traits.length > 0 && <span className="traits">특성 {g.traits.map((t) => `[${traitLabel(t)}]`).join(' ')}</span>}
      </div>

      {GEAR_SLOTS.map((slot) => {
        const cur = member.gear?.[slot]
        const curDef = cur ? ITEMS[cur.itemId] : undefined
        const stock = equippableFor(save, member, slot)
        const others = wornByOthers(save, member, slot)
        // 대체로 나은 것이 위로 오게만 정렬한다. 판단은 아래 증감을 보고 플레이어가 한다
        const sorted = [...stock].sort((a, b) => gearWorth(b) - gearWorth(a))
        const wearable = slot === 'weapon' ? WEAPON_TYPE_LABEL[g.weapon !== 'none' ? g.weapon : 'none'] : ''
        return (
          <div key={slot} className="gear-slot">
            <div className="gear-slot-head">
              <b>{SLOT_LABEL[slot]}</b>
              {curDef && cur ? (
                <>
                  <span className="nm">{itemName(cur)}</span>
                  <small>{itemBrief(curDef, cur)}</small>
                  <button className="mini" onClick={() => onSave(unequipItem(save, member.id, slot))}>해제</button>
                </>
              ) : (
                <small className="empty">— 비어 있음{slot === 'weapon' && wearable ? '' : ''}</small>
              )}
            </div>

            {sorted.length === 0 && others.length === 0 ? (
              <p className="hint">창고에도, 다른 단원에게도 낄 것이 없습니다.</p>
            ) : (
              <ul className="gear-options">
                {sorted.map((it) => (
                  <li key={it.uid}>
                    <span className="nm">{itemName(it)}</span>
                    <small className="spec">{itemBrief(ITEMS[it.itemId], it)}</small>
                    <DeltaChips next={it} cur={cur} />
                    <button className="primary mini" onClick={() => onSave(equipItem(save, member.id, it.uid))}>끼기</button>
                  </li>
                ))}
                {others.map(({ it, owner }) => (
                  <li key={it.uid} className="borrowed">
                    <span className="nm">{itemName(it)}</span>
                    <small className="spec">{itemBrief(ITEMS[it.itemId], it)}</small>
                    <DeltaChips next={it} cur={cur} />
                    <button
                      className="mini"
                      title={`${owner.name} 에게서 벗겨 옵니다`}
                      onClick={() => onSave(takeFrom(save, owner.id, member.id, slot))}
                    >
                      {owner.name}에게서
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}

      <p className="hint">
        무기는 직업에 맞는 종류만 낍니다. 초록은 지금 낀 것보다 오르는 값, 빨강은 내려가는 값입니다.
        창고에 낄 것이 없으면 <button className="link" onClick={onGoShop}>마을 → 상점 →</button>
        {save.inventory.length > 0 && ` (창고 ${save.inventory.length}개)`}
      </p>
    </div>
  )
}
