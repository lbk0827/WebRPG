// 도감 (ADR-004). 제로식의 "게임의 데이터" 페이지에서 착안 — 다만 전부 엔진 데이터에서 생성되어 어긋나지 않는다.
import { useState } from 'react'
import type { StatKey, StatusId } from '@webrpg/engine'
import { ARCHETYPE_LABEL, CRAFT_TRAIT_PCT, ITEMS, ITEM_LIST, MATERIALS, MONSTERS, PRESETS, RECIPES, REGIONS, RULE_ROWS_BASE, RULE_ROWS_INT_STEPS, SKILLS, SLOT_LABEL, STATUS_DEFS, TRAITS, WEAPON_TYPE_LABEL, monsterSetup } from '@webrpg/engine'
import { KIND_SPECS, PICKER_GROUPS, STAT_LABEL } from '../lib/condition'
import { STAT_HELP, STATUS_HELP, itemBrief, jobIcon, jobName, skillParts, skillSources, traitText } from '../lib/labels'

type Section = 'skills' | 'items' | 'status' | 'traits' | 'conditions' | 'stats' | 'regions'

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'skills', label: '스킬' },
  { key: 'items', label: '장비' },
  { key: 'status', label: '상태이상' },
  { key: 'traits', label: '특성' },
  { key: 'conditions', label: '조건' },
  { key: 'stats', label: '스탯' },
  { key: 'regions', label: '지역·상대' },
]

const STAT_KEYS: StatKey[] = ['str', 'int', 'dex', 'spd', 'luk']

export function Codex({ onBack }: { onBack: () => void }) {
  const [sec, setSec] = useState<Section>('skills')
  return (
    <section className="codex">
      <div className="mission-head">
        <button className="link" onClick={onBack}>← 돌아가기</button>
        <h2>도감 <small>엔진 데이터에서 그대로 만든 표. 여기 적힌 숫자가 실제 숫자다.</small></h2>
      </div>
      <nav className="subnav">
        {SECTIONS.map((s) => (
          <button key={s.key} className={sec === s.key ? 'on' : ''} onClick={() => setSec(s.key)}>{s.label}</button>
        ))}
      </nav>

      {sec === 'skills' && (
        <div className="tablewrap">
          <table className="codex-table">
            <thead>
              <tr><th>스킬</th><th>누가 · 값</th><th>SP</th><th>대상</th><th>준비 · 경직</th><th>효과</th><th>비고</th></tr>
            </thead>
            <tbody>
              {Object.values(SKILLS).map((s) => {
                const p = skillParts(s.id)!
                return (
                  <tr key={s.id}>
                    <td className="nm">{s.label}</td>
                    <td>{skillSources(s.id)}</td>
                    <td className="num">{s.spCost}</td>
                    <td>{p.target}</td>
                    <td>{p.timing}</td>
                    <td>{p.effects}</td>
                    <td className="muted">{p.notes}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="hint">준비(선딜)가 있는 기술은 시전 중에 <b>끊길 수 있다</b>. 위력 % 는 힘(또는 손재주·지능) 기본치에 곱한다. "N pt" 는 스킬 포인트 값 — 레벨업마다 1 을 받는다.</p>
        </div>
      )}

      {sec === 'items' && (
        <div className="tablewrap">
          <table className="codex-table">
            <thead><tr><th>장비</th><th>종류</th><th>등급</th><th>값</th><th>효과</th></tr></thead>
            <tbody>
              {ITEM_LIST.map((i) => (
                <tr key={i.id}>
                  <td className="nm">{i.label}</td>
                  <td>{SLOT_LABEL[i.slot]}{i.weaponType ? ` (${WEAPON_TYPE_LABEL[i.weaponType]})` : ''}</td>
                  <td className="num">{i.tier}</td>
                  <td className="num">{i.price}</td>
                  <td>{itemBrief(i)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="hint">등급 1 은 처음부터, 2 는 가도, 3 은 폐허 요새가 열리면 상점에 나온다. 무기 종류: 전사 검 · 도적 단검 · 마법사 지팡이 · 프리스트 성물 · 엘프 활. 강화는 +5 까지, 단계마다 공격·방어 고정치 +10%.</p>
          <h3>재료 <small>의뢰에서 이긴 상대가 떨어뜨린다 (몬스터당 최대 1개)</small></h3>
          <table className="codex-table compact">
            <thead><tr><th>재료</th><th>누가 떨어뜨리나</th><th>설명</th></tr></thead>
            <tbody>
              {Object.values(MATERIALS).map((m) => (
                <tr key={m.id}>
                  <td className="nm">{m.label}</td>
                  <td>{Object.values(MONSTERS).filter((x) => x.drops?.some((d) => d.itemId === m.id)).map((x) => `${x.name}${x.hidden ? '(?)' : ''} ${(x.drops!.find((d) => d.itemId === m.id)!.permyriad / 100).toFixed(0)}%`).join(' · ') || '—'}</td>
                  <td className="muted">{m.blurb}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3>제작 <small>공방. 완성품에 {CRAFT_TRAIT_PCT}% 로 보너스 특성</small></h3>
          <table className="codex-table compact">
            <thead><tr><th>만드는 것</th><th>금</th><th>재료</th></tr></thead>
            <tbody>
              {RECIPES.map((r) => (
                <tr key={r.id}>
                  <td className="nm">{ITEMS[r.itemId].label}</td>
                  <td className="num">{r.gold}</td>
                  <td>{r.materials.map((m) => `${MATERIALS[m.id].label} ×${m.qty}`).join(' · ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sec === 'status' && (
        <div className="tablewrap">
          <table className="codex-table">
            <thead><tr><th>상태</th><th>종류</th><th>기본 크기</th><th>설명</th></tr></thead>
            <tbody>
              {(Object.keys(STATUS_DEFS) as StatusId[]).map((id) => {
                const d = STATUS_DEFS[id]
                return (
                  <tr key={id}>
                    <td className="nm">{d.label}</td>
                    <td>{d.category === 'buff' ? '강화' : '약화'}</td>
                    <td className="num">{d.defaultMagnitude}</td>
                    <td>{STATUS_HELP[id]}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="hint">약화는 상대의 <b>운</b>으로 저항될 수 있다. 정화는 약화만 지운다.</p>
        </div>
      )}

      {sec === 'traits' && (
        <div className="tablewrap">
          <table className="codex-table">
            <thead><tr><th>특성</th><th>효과</th></tr></thead>
            <tbody>
              {Object.values(TRAITS).map((t) => (
                <tr key={t.id}><td className="nm">{t.label}</td><td>{traitText(t)}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="hint">특성은 장비·전직으로 붙는다 (M2-4·M2-5). 지금은 훈련 과제의 일부 상대만 가지고 있다.</p>
        </div>
      )}

      {sec === 'conditions' && (
        <div className="tablewrap">
          <table className="codex-table">
            <thead><tr><th>묶음</th><th>조건</th><th>입력</th></tr></thead>
            <tbody>
              {PICKER_GROUPS.flatMap((g) =>
                g.items.map((it) => {
                  const spec = KIND_SPECS[it.kind]
                  const fields = spec.fields.map((f) => (f === 'cmp' ? '이상/이하' : f === 'value' ? `수치${spec.unit ? ` (${spec.unit})` : ''}` : f === 'row' ? '전열/후열' : f === 'status' ? '상태' : '능력치')).join(', ')
                  return (
                    <tr key={it.key}><td>{g.group}</td><td className="nm">{it.label}</td><td>{fields || '—'}</td></tr>
                  )
                }),
              )}
            </tbody>
          </table>
          <p className="hint">조건은 <b>그리고 / 또는 / 아님</b>으로 묶을 수 있다. 위에서부터 평가해 처음 참인 패턴 하나만 실행한다.</p>
        </div>
      )}

      {sec === 'stats' && (
        <div className="tablewrap">
          <table className="codex-table">
            <thead><tr><th>스탯</th><th>하는 일</th></tr></thead>
            <tbody>
              {STAT_KEYS.map((k) => (
                <tr key={k}><td className="nm">{STAT_LABEL[k]}</td><td>{STAT_HELP[k]}</td></tr>
              ))}
              <tr><td className="nm">HP · SP</td><td>레벨마다 HP +5%, SP +3%. 지능에 찍은 포인트 하나당 SP +2. 분배 스탯이 아니다.</td></tr>
            </tbody>
          </table>
          <h3>패턴 칸 수 <small>지능 기준</small></h3>
          <table className="codex-table compact">
            <thead><tr><th>지능</th>{RULE_ROWS_INT_STEPS.map((t) => <th key={t}>{t}+</th>)}</tr></thead>
            <tbody>
              <tr><td className="nm">패턴</td>{RULE_ROWS_INT_STEPS.map((t, i) => <td key={t} className="num">{RULE_ROWS_BASE + i + 1}</td>)}</tr>
            </tbody>
          </table>
          <p className="hint">기본 {RULE_ROWS_BASE}칸. 레벨업마다 스탯 5 · 스킬 2 포인트.</p>
          <h3>직업 기본값</h3>
          <table className="codex-table compact">
            <thead><tr><th>직업</th><th>HP</th><th>SP</th>{STAT_KEYS.map((k) => <th key={k}>{STAT_LABEL[k]}</th>)}<th>방어</th><th>마방</th></tr></thead>
            <tbody>
              {Object.values(PRESETS).map((p) => (
                <tr key={p.id}>
                  <td className="nm"><img src={jobIcon(p.id)} alt="" width={18} height={18} /> {p.name}</td>
                  <td className="num">{p.stats.maxHp}</td><td className="num">{p.stats.maxSp}</td>
                  {STAT_KEYS.map((k) => <td key={k} className="num">{p.stats[k]}</td>)}
                  <td className="num">{p.stats.def}</td><td className="num">{p.stats.mdef}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sec === 'regions' && (
        <div className="regions-codex">
          {REGIONS.map((r) => (
            <div key={r.id} className="card">
              <h3>{r.no}. {r.name} <small>권장 Lv {r.recommended[0]}–{r.recommended[1]} · {r.count[0]}~{r.count[1]}명{r.unlock ? ` · ${REGIONS.find((x) => x.id === r.unlock!.regionId)?.name} ${r.unlock.wins}승 후` : ''}</small></h3>
              <p className="hint">{r.brief}</p>
              <div className="tablewrap">
                <table className="codex-table compact">
                  <thead><tr><th>상대</th><th>원형</th><th>Lv</th><th>HP</th><th>패턴</th><th>경험치</th><th>금</th></tr></thead>
                  <tbody>
                    {r.table.filter((t) => !MONSTERS[t.monsterId].hidden).map((t) => {
                      const d = MONSTERS[t.monsterId]
                      const s = monsterSetup(d, 0)
                      return (
                        <tr key={d.id}>
                          <td className="nm"><img src={jobIcon(d.icon ?? d.job)} alt="" width={18} height={18} /> {d.name} <small>({d.icon ? ARCHETYPE_LABEL[d.archetype] : jobName(d.job)})</small></td>
                          <td>{ARCHETYPE_LABEL[d.archetype]}</td>
                          <td className="num">{d.level}</td>
                          <td className="num">{s.stats.maxHp}</td>
                          <td className="num">{d.rules.rows.length}줄</td>
                          <td className="num">{d.exp}</td>
                          <td className="num">{d.gold}</td>
                        </tr>
                      )
                    })}
                    {r.table.some((t) => MONSTERS[t.monsterId].hidden) && (
                      <tr><td colSpan={7} className="muted">+ 소문뿐인 상대. 목록에 없다.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          <p className="hint">상대도 수칙으로 움직인다. 지역이 깊어질수록 상대의 수칙이 정교해진다 — 상대가 곧 교재다.</p>
        </div>
      )}
    </section>
  )
}
