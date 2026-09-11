// 장비 칸 3개 — 착용 · 해제 · 바꾸기. 캐릭터 탭이 쓴다 (M2-4a, 탭 개편으로 편성에서 이사).
import type { GearSlot } from '@webrpg/engine'
import { ITEMS, SLOT_LABEL } from '@webrpg/engine'
import type { GameSave, Member } from '../game/save'
import { equipItem, equippableFor, unequipItem } from '../game/members'
import { itemBrief, itemName } from '../lib/labels'

const GEAR_SLOTS: GearSlot[] = ['weapon', 'armor', 'trinket']

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
  member: Member
  onGoShop: () => void
}

export function GearPanel({ save, onSave, member, onGoShop }: Props) {
  return (
    <div className="gear">
      <ul className="gear-slots">
        {GEAR_SLOTS.map((slot) => {
          const it = member.gear?.[slot]
          const d = it ? ITEMS[it.itemId] : undefined
          const options = equippableFor(save, member, slot)
          return (
            <li key={slot}>
              <b>{SLOT_LABEL[slot]}</b>
              {d && it ? (
                <span className="worn">
                  <span className="nm">{itemName(it)}</span>
                  <small>{itemBrief(d, it)}</small>
                </span>
              ) : (
                <span className="empty">— 비어 있음</span>
              )}
              <span className="gear-tools">
                {options.length > 0 && (
                  <select value="" onChange={(e) => { if (e.target.value) onSave(equipItem(save, member.id, e.target.value)) }}>
                    <option value="">{d ? '바꾸기…' : '착용…'}</option>
                    {options.map((o) => (
                      <option key={o.uid} value={o.uid}>{itemName(o)} — {itemBrief(ITEMS[o.itemId], o)}</option>
                    ))}
                  </select>
                )}
                {d && <button className="mini" onClick={() => onSave(unequipItem(save, member.id, slot))}>해제</button>}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="hint">
        무기는 직업에 맞는 종류만 낍니다. 창고에 낄 것이 없으면 <button className="link" onClick={onGoShop}>마을 → 상점 →</button>
        {save.inventory.length > 0 && ` (창고 ${save.inventory.length}개)`}
      </p>
    </div>
  )
}
