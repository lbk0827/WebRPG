// 디버그 · 치트 (2026-09-15 단장 요청). 주소에 ?debug 를 붙였을 때만 본부 아래에 나온다 (lib/debug.ts).
// 금 · 레벨 · 재료 · 모험 대기를 버튼 하나로. 레벨은 **경험치를 넣어서** 올린다 —
// 실제 레벨업과 같은 길(applyExp)이라 스탯 · 스킬 포인트가 정상 분량으로 붙는다.
import { useState } from 'react'
import { EXP_TABLE, MATERIALS, MAX_LEVEL } from '@webrpg/engine'
import type { GameSave, Member } from '../game/save'
import { applyExp } from '../game/members'

interface Props {
  save: GameSave
  onSave: (next: GameSave) => void
}

/** 지금 레벨 · 경험치에서 target 레벨까지 필요한 경험치 */
function expTo(m: Member, target: number): number {
  let need = -m.exp
  for (let l = m.level; l < Math.min(target, MAX_LEVEL); l++) need += EXP_TABLE[l]
  return Math.max(0, need)
}

const levelUp = (m: Member, by: number): Member => applyExp(m, expTo(m, m.level + by)).member

export function DebugCheatPanel({ save, onSave }: Props) {
  /** 레벨 치트 대상 — 'all' 이면 전 단원 */
  const [who, setWho] = useState<string>('all')

  const addGold = (n: number) => onSave({ ...save, gold: save.gold + n })
  const raise = (by: number) =>
    onSave({ ...save, members: save.members.map((m) => (who === 'all' || m.id === who ? levelUp(m, by) : m)) })
  const addMaterials = (n: number) => {
    const materials = { ...save.materials }
    for (const id of Object.keys(MATERIALS)) materials[id] = (materials[id] ?? 0) + n
    onSave({ ...save, materials })
  }

  return (
    <details className="debug-gallery" open>
      <summary>디버그 · 치트</summary>

      <h3>금 <small>지금 {save.gold}</small></h3>
      <div className="debug-controls">
        <button onClick={() => addGold(1000)}>+1,000</button>
        <button onClick={() => addGold(10000)}>+10,000</button>
        <button onClick={() => addGold(100000)}>+100,000</button>
      </div>

      <h3>레벨 <small>경험치를 넣어 올리므로 스탯 · 스킬 포인트도 함께 붙습니다</small></h3>
      <div className="debug-controls">
        <select value={who} onChange={(e) => setWho(e.target.value)}>
          <option value="all">전 단원</option>
          {save.members.map((m) => (
            <option key={m.id} value={m.id}>{m.name} (Lv {m.level})</option>
          ))}
        </select>
        <button onClick={() => raise(1)}>+1</button>
        <button onClick={() => raise(5)}>+5</button>
        <button onClick={() => raise(10)}>+10</button>
        <button onClick={() => raise(MAX_LEVEL)}>만렙 {MAX_LEVEL}</button>
      </div>

      <h3>재료 <small>모든 종류에 더합니다</small></h3>
      <div className="debug-controls">
        <button onClick={() => addMaterials(10)}>전부 +10</button>
        <button onClick={() => addMaterials(99)}>전부 +99</button>
      </div>

      <h3>모험 <small>재도전 대기 · 오늘 횟수</small></h3>
      <div className="debug-controls">
        <button onClick={() => onSave({ ...save, adventures: {} })}>대기 · 횟수 초기화</button>
      </div>
    </details>
  )
}
