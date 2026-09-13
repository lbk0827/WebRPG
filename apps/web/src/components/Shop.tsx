// 상점 (M2-4a, docs/07 §3.7). 마을에서 들어온다. 사기 · 창고 · 팔기(20%).
//
// **상점은 기본품만 판다 — 1·2등급이 상한이다** (2026-09-13 단장 결정, docs/18 §15).
// 3등급은 공방에서 제작으로만 얻는다. 전에는 상점도 3등급을 팔았는데 제작이 같은 물건을
// 2.4배 싸게 만들어서 공방이 열리면 이 화면을 아무도 안 봤다. 이제 역할이 갈린다:
// **금으로 즉시 = 상점 / 재료를 들여 더 좋은 것 = 공방.**
import { useState } from 'react'
import type { GearSlot, WeaponType } from '@webrpg/engine'
import { ITEMS, JOB_WEAPONS, PRESETS, REGIONS, SLOT_LABEL, WEAPON_TYPE_LABEL, sellPrice } from '@webrpg/engine'
import type { GameSave } from '../game/save'
import { buyItem, sellItem, shopStock, shopTier } from '../game/members'
import { itemBrief, itemName } from '../lib/labels'

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
  onBack: () => void
  onGoFormation: () => void
}

const SLOTS: GearSlot[] = ['weapon', 'armor', 'trinket']

/** 이 무기 타입을 쓰는 직업 이름 */
const whoUses = (wt: string): string => Object.keys(JOB_WEAPONS).filter((j) => JOB_WEAPONS[j].includes(wt as never)).map((j) => PRESETS[j].name).join('·')

export function Shop({ save, onSave, onBack, onGoFormation }: Props) {
  const [slot, setSlot] = useState<GearSlot>('weapon')
  const tier = shopTier(save)
  const stock = shopStock(save).filter((i) => i.slot === slot)
  const nextRegion = REGIONS.find((r) => r.no === 3)

  return (
    <section className="shop">
      <div className="mission-head">
        <button className="link" onClick={onBack}>← 본부</button>
        <h2>상점 <small>금 {save.gold} · 등급 {tier}{tier < 2 && nextRegion ? ` · 2등급은 "${nextRegion.name}" 해금 후` : ' · 전부 열림'}</small></h2>
        <p className="hint">산 장비는 창고로 갑니다. 착용은 <button className="link" onClick={onGoFormation}>편성 탭</button>의 장비 칸에서. 판매는 산 값의 20%.</p>
        <p className="hint">
          상점은 <b>기본품(1·2등급)</b>만 답니다. <b>3등급은 공방에서 만들어야</b> 합니다 — 재료가 들지만 금은 훨씬 싸고
          보너스 특성이 붙을 수도 있습니다.
        </p>
      </div>

      <nav className="subnav">
        {SLOTS.map((s) => (
          <button key={s} className={slot === s ? 'on' : ''} onClick={() => setSlot(s)}>{SLOT_LABEL[s]}</button>
        ))}
      </nav>
      <ul className="stock">
        {stock.map((i) => {
          const ok = save.gold >= i.price
          return (
            <li key={i.id} className={`item ${ok ? '' : 'far'}`}>
              <div className="body">
                <b>{i.label}</b> <span className="tier">{i.tier}등급</span>
                {i.weaponType && <small className="who">{whoUses(i.weaponType)} 용 {WEAPON_TYPE_LABEL[i.weaponType as WeaponType]}</small>}
                <small>{itemBrief(i)}</small>
                <small className="blurb">{i.blurb}</small>
              </div>
              <button className={ok ? 'primary' : ''} disabled={!ok} onClick={() => onSave(buyItem(save, i.id))}>금 {i.price}</button>
            </li>
          )
        })}
        {stock.length === 0 && <li className="hint">이 등급에는 이 종류가 없습니다.</li>}
      </ul>

      <h3>창고 <small>{save.inventory.length}개 · 착용 중인 것은 여기 없음</small></h3>
      {save.inventory.length === 0 ? (
        <p className="hint">비어 있습니다.</p>
      ) : (
        <ul className="stock">
          {save.inventory.map((it) => {
            const d = ITEMS[it.itemId]
            return (
              <li key={it.uid} className="item">
                <div className="body">
                  <b>{itemName(it)}</b> <span className="tier">{SLOT_LABEL[d.slot]}</span>
                  <small>{itemBrief(d, it)}</small>
                </div>
                <button onClick={() => { if (window.confirm(`${d.label} 을(를) 금 ${sellPrice(d)} 에 팝니다.`)) onSave(sellItem(save, it.uid)) }}>팔기 금 {sellPrice(d)}</button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
