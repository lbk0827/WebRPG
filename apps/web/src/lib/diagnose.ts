// 패배 원인을 한두 문장으로. analyze() 의 수치를 사람 말로 바꾼다.
import type { Analysis } from '@webrpg/engine'

export function diagnose(a: Analysis, names: string[]): string[] {
  const t = a.teams[0]
  const foe = a.teams[1]
  const out: string[] = []

  const maxIdx = (arr: number[]): number => arr.reduce((best, v, i) => (v > arr[best] ? i : best), 0)

  const ex = maxIdx(t.exhausted)
  if (t.exhausted[ex] > 0) out.push(`${names[ex]}가 ${t.exhausted[ex]}번 우물쭈물했다 — 맞는 조항이 없는 상황이 있다.`)

  if (t.firstDeath >= 0) out.push(`${names[t.firstDeath]}가 가장 먼저 쓰러졌다.`)

  const sp = maxIdx(t.noSp)
  if (t.noSp[sp] >= 3) out.push(`${names[sp]}의 조항이 SP 부족으로 ${t.noSp[sp]}번 불발했다.`)

  const nt = maxIdx(t.noTarget)
  if (t.noTarget[nt] >= 3 && out.length < 2) out.push(`${names[nt]}의 조항이 대상이 없어 ${t.noTarget[nt]}번 넘어갔다.`)

  if (foe.interruptsMade > 0 && out.length < 2) out.push(`적이 우리 시전을 ${foe.interruptsMade}번 끊었다.`)
  if (t.interruptsMade > 0 && out.length < 2) out.push(`우리가 적 시전을 ${t.interruptsMade}번 끊었다.`)

  if (out.length === 0) out.push(a.outcome === 'draw' ? '결판이 나지 않았다. 화력이 부족하다.' : '상대가 더 빨리 때렸다.')
  return out.slice(0, 2)
}
