// 한국어 표시 문자열. 엔진은 id 만 다루고, 사람이 읽는 말은 전부 여기서 만든다.
import type { BattleEvent, CharRef, SkillFailReason, StatusId } from '@webrpg/engine'
import { PRESETS, SKILLS, STATUS_DEFS } from '@webrpg/engine'

export const jobName = (job: string): string => PRESETS[job]?.name ?? job
export const jobOf = (charId: string): string => charId.split('#')[0]
export const skillLabel = (id: string): string => SKILLS[id]?.label ?? id
export const statusLabel = (id: StatusId): string => STATUS_DEFS[id]?.label ?? id

/** 관례 경로 (assets/manifest.json 과 일치). BASE_URL 을 붙여 GitHub Pages 같은 하위 경로 배포에서도 동작 */
export const jobIcon = (job: string): string => `${import.meta.env.BASE_URL}jobs/${job}.svg`

export const failText = (r: SkillFailReason): string =>
  r === 'noSp' ? 'SP 부족' : r === 'noRequiredTarget' ? '대상 없음' : '침묵 상태'

export const outcomeText = (o: string): string =>
  o === 'team0' ? '승리' : o === 'team1' ? '패배' : '무승부'

export type Names = [string[], string[]]

export interface Line {
  kind: 'fired' | 'exhausted' | 'failed' | 'cast' | 'interrupt' | 'cover' | 'damage' | 'heal' | 'status' | 'death' | 'revive' | 'misc'
  text: string
}

export function describeEvent(e: BattleEvent, names: Names): Line | null {
  const who = (r: CharRef): string => `${r.team === 0 ? '' : '적 '}${names[r.team][r.index]}`
  switch (e.t) {
    case 'ruleFired':
      return { kind: 'fired', text: `${e.ruleIndex + 1}번 조항 발동 → ${skillLabel(e.skillId)}` }
    case 'ruleExhausted':
      return { kind: 'exhausted', text: '수칙에 없는 상황이라 우물쭈물했다' }
    case 'skillFailed':
      return { kind: 'failed', text: `${e.ruleIndex + 1}번 조항 ${skillLabel(e.skillId)} 불가 — ${failText(e.reason)}` }
    case 'castStart':
      return { kind: 'cast', text: `${skillLabel(e.skillId)} 시전 시작…` }
    case 'castResolve':
      return { kind: 'cast', text: `${skillLabel(e.skillId)} 발동!` }
    case 'castInterrupted':
      return { kind: 'interrupt', text: `${who(e.target)}의 ${skillLabel(e.skillId)} 시전이 끊겼다` }
    case 'cover':
      return { kind: 'cover', text: `${who(e.defender)}가 ${who(e.protectedChar)}를 엄호` }
    case 'damage':
      return e.nullified
        ? { kind: 'cover', text: `${who(e.target)}의 보호막이 공격을 막았다` }
        : { kind: 'damage', text: `${who(e.target)}에게 ${e.amount} 피해` }
    case 'heal':
      return { kind: 'heal', text: `${who(e.target)} HP +${e.amount}` }
    case 'spChange':
      return e.delta > 0 ? { kind: 'heal', text: `${who(e.target)} SP +${e.delta}` } : null
    case 'statusApply':
      return { kind: 'status', text: `${who(e.target)} [${statusLabel(e.status)}] ${e.duration}턴` }
    case 'statusResisted':
      return { kind: 'cover', text: `${who(e.target)}가 [${statusLabel(e.status)}]을 저항했다` }
    case 'statusTick':
      return { kind: 'damage', text: `${who(e.target)} [${statusLabel(e.status)}] ${e.amount} 피해` }
    case 'statusExpire':
      return { kind: 'status', text: `${who(e.target)} [${statusLabel(e.status)}] 해제` }
    case 'gaugeShift':
      return { kind: 'status', text: `${who(e.target)} 행동 게이지 ${e.delta > 0 ? '+' : ''}${e.delta}` }
    case 'death':
      return { kind: 'death', text: `${who(e.target)} 쓰러짐` }
    case 'revive':
      return { kind: 'revive', text: `${who(e.target)} 소생 (HP ${e.hp})` }
    default:
      return null
  }
}
