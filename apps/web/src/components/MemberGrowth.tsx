// 단원 성장 카드의 알맹이 — 레벨·경험치·스탯 분배(미리보기→확정)·파생 수치. 단원 탭과 편성 패널이 같이 쓴다.
import { useState } from 'react'
import type { Alloc, StatKey } from '@webrpg/engine'
import { CRAFT_TRAIT_PCT, EMPTY_ALLOC, STAT_CAP, craftLukBonusPct, derivedStats, expToNext, lootBonusPct, maxRuleRows, nextRuleRowInt } from '@webrpg/engine'
import type { Member } from '../game/save'
import { allocateMany, gearSummary, memberStats } from '../game/members'
import { STAT_HELP } from '../lib/labels'
import { STAT_LABEL } from '../lib/condition'

interface Props {
  member: Member
  onChange: (m: Member) => void
  /** 이름·아이콘 헤더를 밖에서 그리면 true */
  compact?: boolean
}

const STAT_KEYS: StatKey[] = ['str', 'int', 'dex', 'spd', 'luk']
const sumAlloc = (a: Alloc): number => STAT_KEYS.reduce((s, k) => s + a[k], 0)

export function MemberGrowth({ member: m, onChange, compact }: Props) {
  /** 미확정 분배 (ADR-004 §5 O) */
  const [pend, setPend] = useState<Alloc>(EMPTY_ALLOC)
  const used = sumAlloc(pend)
  const left = m.statPoints - used
  const previewMember: Member = used > 0 ? { ...m, alloc: { ...m.alloc, ...Object.fromEntries(STAT_KEYS.map((k) => [k, m.alloc[k] + pend[k]])) } } : m
  const s = memberStats(previewMember)
  const base = memberStats(m)
  const d = derivedStats(s)
  const gear = gearSummary(m)
  const next = expToNext(m.level)

  const bump = (k: StatKey, dir: 1 | -1) => {
    const n = { ...pend, [k]: Math.max(0, pend[k] + dir) }
    if (dir > 0 && sumAlloc(n) > m.statPoints) return
    setPend(n)
  }
  const confirm = () => { onChange(allocateMany(m, pend)); setPend(EMPTY_ALLOC) }

  return (
    <div className={`growth ${used > 0 ? 'previewing' : ''}`}>
      {!compact && (
        <div className="bar exp"><i style={{ width: next ? `${Math.min(100, (m.exp / next) * 100)}%` : '100%' }} /></div>
      )}
      <small className="line">
        {next ? `경험치 ${m.exp}/${next}` : '만렙'} · HP {s.maxHp} · SP {s.maxSp} · 패턴 {m.rules.rows.length}/{maxRuleRows(s)}{nextRuleRowInt(s) !== null ? ` (지능 ${nextRuleRowInt(s)}에서 +1)` : ''}
        {m.statPoints > 0 && <span className="badge">포인트 {left}{used > 0 ? `/${m.statPoints}` : ''}</span>}
      </small>
      <div className="stats">
        {STAT_KEYS.map((k) => (
          <span key={k} className={`stat ${pend[k] > 0 ? 'pend' : ''}`} title={STAT_HELP[k]}>
            <b>{STAT_LABEL[k]}</b> {s[k]}
            {pend[k] > 0 ? <small className="delta">(+{pend[k]})</small> : m.alloc[k] > 0 ? <small>(+{m.alloc[k]})</small> : null}
            {m.statPoints > 0 && (
              <span className="pm">
                <button disabled={pend[k] <= 0} onClick={() => bump(k, -1)} title="되돌리기">−</button>
                <button disabled={left <= 0 || base[k] + pend[k] >= STAT_CAP} onClick={() => bump(k, 1)} title={`${STAT_LABEL[k]} +1 — ${STAT_HELP[k]}`}>+</button>
              </span>
            )}
          </span>
        ))}
      </div>
      <div className="derived">
        <span title="힘 기술의 기본 위력 (+ 무기 가산)">물리 {d.physBase}{gear.atk[0] ? <i> +{gear.atk[0]}</i> : null}</span>
        <span title="손재주 기술의 기본 위력 (+ 무기 가산)">손재주 {d.dexBase}{gear.atk[0] ? <i> +{gear.atk[0]}</i> : null}</span>
        <span title="마법·회복의 기본 위력 (+ 무기 가산)">마법 {d.magicBase}{gear.atk[1] ? <i> +{gear.atk[1]}</i> : null}</span>
        {(gear.def[0] || gear.def[1]) ? <span title="장비 물리 방어">방어 {gear.def[0] ? `${gear.def[0]}%` : ''}{gear.def[1] ? ` +${gear.def[1]}` : ''}</span> : null}
        {(gear.def[2] || gear.def[3]) ? <span title="장비 마법 방어">마방 {gear.def[2] ? `${gear.def[2]}%` : ''}{gear.def[3] ? ` +${gear.def[3]}` : ''}</span> : null}
        <span title="틱당 행동 게이지 충전량 (1000 이면 행동)">충전 {d.chargePerTick}/틱</span>
        <span title="시전 준비 시간 단축">선딜 −{d.castReductionPct}%</span>
        <span title="운 0 인 상대의 상태이상을 막을 확률">저항 ≤{d.resistMaxPct}%</span>
        {/* 운의 값은 전투보다 전투 밖에 있다 — 2026-09-13 까지 화면에 없었다 (docs/18 §14) */}
        <span title="단원 중 가장 높은 운이 출전 드롭 확률에 붙는다">드롭 +{lootBonusPct(s.luk)}%</span>
        <span title="제작 시 보너스 특성이 붙을 확률. 단원 중 가장 높은 운이 쓰인다">제작 특성 {CRAFT_TRAIT_PCT + craftLukBonusPct(s.luk)}%</span>
      </div>
      {used > 0 && (
        <div className="run-bar confirm">
          <button className="primary" onClick={confirm}>확정 ({used}포인트)</button>
          <button onClick={() => setPend(EMPTY_ALLOC)}>되돌리기</button>
          <small>확정 전엔 저장되지 않습니다.</small>
        </div>
      )}
    </div>
  )
}
