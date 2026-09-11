// 공방 (M2-4b, docs/07 §3.5 강화 · §3.6 제작). 본부에서 들어온다. 재료 · 강화 · 제작.
import { useState } from 'react'
import { CRAFT_TRAIT_PCT, ITEMS, MATERIALS, RECIPES, REFINE_MAX, refineCost, refineRate } from '@webrpg/engine'
import type { GameSave } from '../game/save'
import { allItems, canRefine, craftItem, refineItem } from '../game/members'
import { itemBrief, itemName, materialLabel, traitLabel } from '../lib/labels'

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
  onBack: () => void
  onGoQuest: () => void
}

type Tab = 'refine' | 'craft'

export function Workshop({ save, onSave, onBack, onGoQuest }: Props) {
  const [tab, setTab] = useState<Tab>('refine')
  const [sel, setSel] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'fail'; text: string } | null>(null)
  const items = allItems(save)
  const target = sel ? items.find((o) => o.it.uid === sel) : undefined
  const mats = Object.entries(save.materials).filter(([, v]) => v > 0)

  const doRefine = () => {
    if (!target) return
    const r = refineItem(save, target.it.uid, Date.now())
    if (!r) return
    onSave(r.save)
    setMsg(r.success ? { kind: 'ok', text: `성공 — ${itemName(r.item)}` } : { kind: 'fail', text: `실패. 장비는 그대로 (${itemName(r.item)}), 비용만 들었다.` })
  }
  const doCraft = (id: string) => {
    const r = craftItem(save, id, Date.now())
    if (!r) return
    onSave(r.save)
    setMsg({ kind: 'ok', text: `${ITEMS[r.item.itemId].label} 완성${r.item.trait ? ` — 보너스 특성 [${traitLabel(r.item.trait)}] 이 붙었다!` : ''} 창고에 넣었다.` })
  }

  return (
    <section className="workshop">
      <div className="mission-head">
        <button className="link" onClick={onBack}>← 본부</button>
        <h2>공방 <small>금 {save.gold}</small></h2>
      </div>

      <div className="materials">
        <span className="label">재료</span>
        {mats.length === 0 ? (
          <small>없음 — 의뢰에서 이긴 상대가 떨어뜨립니다. <button className="link" onClick={onGoQuest}>의뢰 →</button></small>
        ) : (
          mats.map(([id, n]) => (
            <span key={id} className="mat" title={MATERIALS[id]?.blurb}>{materialLabel(id)} <b>×{n}</b></span>
          ))
        )}
      </div>

      <nav className="subnav">
        <button className={tab === 'refine' ? 'on' : ''} onClick={() => { setTab('refine'); setMsg(null) }}>강화</button>
        <button className={tab === 'craft' ? 'on' : ''} onClick={() => { setTab('craft'); setMsg(null) }}>제작</button>
      </nav>

      {msg && <div className={`verdict ${msg.kind === 'ok' ? 'ok' : 'fail'}`}>{msg.text}</div>}

      {tab === 'refine' && (
        <div className="refine">
          <p className="hint">+0 → +5. 단계마다 공격·방어 고정치 +10%. 성공률 {refineRate(0)}·{refineRate(1)}·{refineRate(2)}·{refineRate(3)}·{refineRate(4)}%. <b>실패해도 장비는 깨지지도 떨어지지도 않습니다</b> — 비용만 듭니다.</p>
          {items.length === 0 ? (
            <p className="hint">강화할 장비가 없습니다.</p>
          ) : (
            <ul className="stock">
              {items.map(({ it, owner }) => {
                const d = ITEMS[it.itemId]
                const maxed = it.refine >= REFINE_MAX
                const c = maxed ? null : refineCost(d, it.refine)
                const ok = canRefine(save, it)
                return (
                  <li key={it.uid} className={`item ${sel === it.uid ? 'on' : ''} ${ok || maxed ? '' : 'far'}`}>
                    <div className="body">
                      <b>{itemName(it)}</b> <span className="tier">{owner ? `${owner.name} 착용` : '창고'}</span>
                      <small>{itemBrief(d, it)}</small>
                      {c && <small className="cost-line">다음 +{it.refine + 1}: 금 {c.gold} · {materialLabel(c.material)} ×{c.qty} · 성공 {refineRate(it.refine)}%</small>}
                      {maxed && <small className="cost-line">최대 강화</small>}
                    </div>
                    {!maxed && <button className={sel === it.uid ? 'on' : ''} onClick={() => { setSel(it.uid); setMsg(null) }}>고르기</button>}
                  </li>
                )
              })}
            </ul>
          )}
          {target && (
            <div className="run-bar">
              <button className="primary big" disabled={!canRefine(save, target.it)} onClick={doRefine}>
                {itemName(target.it)} 강화 → +{target.it.refine + 1}
              </button>
              {!canRefine(save, target.it) && <small>금 또는 재료가 모자랍니다.</small>}
            </div>
          )}
        </div>
      )}

      {tab === 'craft' && (
        <div className="craft">
          <p className="hint">재료로 장비를 만듭니다. 상점보다 싸지만 재료를 모아야 합니다. 완성품에 <b>{CRAFT_TRAIT_PCT}% 확률로 보너스 특성</b>이 붙습니다 — 이 게임의 유일한 뽑기이고, 돈으로는 못 삽니다.</p>
          <ul className="stock">
            {RECIPES.map((r) => {
              const d = ITEMS[r.itemId]
              const okGold = save.gold >= r.gold
              const okMats = r.materials.every((m) => (save.materials[m.id] ?? 0) >= m.qty)
              return (
                <li key={r.id} className={`item ${okGold && okMats ? '' : 'far'}`}>
                  <div className="body">
                    <b>{d.label}</b> <span className="tier">{d.tier}등급</span>
                    <small>{itemBrief(d)}</small>
                    <small className="cost-line">
                      금 {r.gold}{' · '}
                      {r.materials.map((m, i) => {
                        const have = save.materials[m.id] ?? 0
                        return (
                          <span key={m.id} className={have >= m.qty ? 'have' : 'lack'}>
                            {i > 0 && ' · '}{materialLabel(m.id)} {have}/{m.qty}
                          </span>
                        )
                      })}
                    </small>
                  </div>
                  <button className={okGold && okMats ? 'primary' : ''} disabled={!(okGold && okMats)} onClick={() => doCraft(r.id)}>만들기</button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
