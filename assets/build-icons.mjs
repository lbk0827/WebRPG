// docs/14 리소스 요청서의 아이콘 87종을 생성한다.
// 외부 에셋 없이 이 파일의 도형 정의만으로 SVG를 만든다.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const ink = '#1d1d24'
const paper = '#e9e4d8'
const steel = '#cfd6e0'
const leather = '#8a7550'
const wood = '#6b4b2a'
const arcane = '#8fd3ff'
const holy = '#fff5cc'
const venom = '#7bd389'

const attrs = `stroke="${ink}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`
const root = (title, inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <title>${title}</title>
  <g ${attrs}>${inner}</g>
</svg>
`
const skill = (title, color, inner) => root(title, `
    <rect x="3" y="3" width="58" height="58" rx="14" fill="${color}"/>
    ${inner}`)
const item = (title, inner) => root(title, `
    ${inner}`)
const status = (title, fill, inner) => root(title, `
    <circle cx="32" cy="32" r="25" fill="${fill}" stroke-width="4"/>
    ${inner}`)
const trait = (title, inner, fill = paper) => root(title, `
    <path d="M32 3 57 18v28L32 61 7 46V18Z" fill="${fill}"/>
    ${inner}`)

const slash = `<path d="M17 45 45 17" fill="none" stroke="${paper}" stroke-width="7"/><path d="m13 37 7 7M37 13l7 7" fill="none" stroke="${paper}"/>`
const sword = (long = false, ornate = false) => `<path d="M${long ? 10 : 15} ${long ? 51 : 48} 38 ${long ? 23 : 25}l7 7-28 ${long ? 28 : 25}Z" fill="${steel}"/><path d="m35 22 7-7 7 7-7 7Z" fill="${ornate ? holy : paper}"/><path d="m18 45 7 7M14 50l-5 5" fill="none"/>`
const dagger = (curved = false, thin = false) => `<path d="M14 49 35 ${curved ? 20 : 24}${curved ? 'q8 1 13-8' : ' 7 7'}${thin ? '-25 25' : '-22 24'}Z" fill="${steel}"/><path d="m14 43 7 7M13 49l-5 6" fill="none"/>`
const staff = (top) => `<path d="M20 56 39 15" fill="none" stroke="${wood}" stroke-width="6"/>${top}`
const bow = (tall = false, horn = false) => `<path d="M${tall ? 18 : 21} 8Q${horn ? 48 : 45} 32 ${tall ? 18 : 21} 56" fill="none" stroke="${horn ? leather : wood}" stroke-width="6"/><path d="M${tall ? 18 : 21} 8v48" fill="none" stroke="${paper}"/><path d="m12 34 30-9m-6-4 6 4-4 6" fill="none"/>`
const shield = `<path d="M32 11 49 18v15c0 11-7 18-17 22-10-4-17-11-17-22V18Z" fill="${steel}"/><path d="M32 17v31" fill="none"/>`
const up = `<path d="m21 36 11-12 11 12M32 24v22" fill="none" stroke="${paper}" stroke-width="5"/>`
const down = `<path d="m21 28 11 12 11-12M32 18v22" fill="none" stroke="${paper}" stroke-width="5"/>`

const skills = [
  ['strike','기본 공격','#b23a48',slash],
  ['heavyBlow','강타','#b23a48',`${sword(true)}<path d="m43 42 8 3m-11 3 6 7" fill="none" stroke="${paper}"/>`],
  ['flurry','연타','#b23a48',`<path d="M14 24 34 12M16 38l27-17M24 51l26-19" fill="none" stroke="${paper}" stroke-width="5"/>`],
  ['sweep','휩쓸기','#b23a48',`<path d="M10 42Q30 14 54 27" fill="none" stroke="${paper}" stroke-width="7"/><path d="m47 20 7 7-9 3" fill="${paper}"/>`],
  ['pierceShot','관통 사격','#b23a48',`<path d="M9 32h46m-9-7 9 7-9 7" fill="none" stroke="${paper}" stroke-width="4"/><path d="M27 15 40 21v11c0 7-5 12-13 16-7-4-12-9-12-16V21Z" fill="${steel}"/>`],
  ['sunder','갑주 파쇄','#b23a48',`<path d="M18 18 32 12l14 6-3 30-11 5-11-5Z" fill="${steel}"/><path d="m33 14-5 14 7 4-7 18" fill="none" stroke-width="5"/>`],
  ['shieldBash','방패 밀치기','#b23a48',`${shield}<path d="M52 24H40m7-7-7 7 7 7" fill="none" stroke="${paper}" stroke-width="4"/>`],
  ['ambush','급습','#b23a48',`${dagger()}<path d="M11 38Q8 20 27 12" fill="none" stroke="${ink}" stroke-width="7"/>`],
  ['snipe','저격','#b23a48',`<circle cx="31" cy="31" r="14" fill="none" stroke="${paper}" stroke-width="4"/><path d="M8 31h46M31 8v46m7-30 8 7-8 7" fill="none" stroke="${paper}"/>`],
  ['venom','독 바르기','#b23a48',`${dagger()}<path d="M43 39c6 7 6 10 0 13-6-3-6-6 0-13Z" fill="${venom}"/>`],
  ['venomStrong','맹독','#b23a48',`${dagger()}<path d="M39 36c5 6 5 9 0 11-5-2-5-5 0-11Zm10 7c4 5 4 7 0 9-4-2-4-4 0-9Z" fill="${venom}"/>`],
  ['poisonArrow','독화살','#b23a48',`<path d="M10 45 48 17m-10-3 10 3-3 10" fill="none" stroke="${paper}" stroke-width="4"/><path d="M29 31c5 6 5 9 0 11-5-2-5-5 0-11Z" fill="${venom}"/>`],
  ['stagger','흔들기','#b23a48',`<path d="m13 35 9-8 7 9 8-13 14 9" fill="none" stroke="${paper}" stroke-width="6"/><path d="m18 47 9-4m18 4-9-4" fill="none" stroke="${paper}"/>`],
  ['bolt','마력탄','#2f6fd6',`<circle cx="39" cy="26" r="10" fill="${arcane}"/><path d="m10 46 19-13m-16 3 10 1m-2 10 6-10" fill="none" stroke="${paper}"/>`],
  ['fireball','화염구','#2f6fd6',`<path d="M42 49c12-8 9-22 0-34-1 8-6 8-8 16-4-5-7-7-8-12-9 12-9 24 2 30Z" fill="#b23a48"/><path d="M35 45c6-4 5-10 1-16-4 5-7 9-1 16Z" fill="${holy}"/>`],
  ['inferno','대화염','#2f6fd6',`<path d="M18 53c-7-17 5-23 7-39 8 8 7 14 6 20 8-8 11-13 10-21 12 14 9 30 3 40Z" fill="#b23a48"/><path d="M29 51c-4-9 2-14 6-23 6 10 7 16 2 23Z" fill="${holy}"/>`],
  ['smite','응징','#2f6fd6',`<path d="M29 9h7l-3 18h9L24 55l5-21h-8Z" fill="${holy}"/><path d="M14 16h8m20 0h8" fill="none" stroke="${paper}"/>`],
  ['frostbind','얼음 결박','#2f6fd6',`<path d="M32 11v42M14 22l36 20M14 42l36-20" fill="none" stroke="${arcane}" stroke-width="4"/><path d="m18 47 8-7 7 6 8-7" fill="none" stroke="${steel}" stroke-width="6"/>`],
  ['manaBurn','마력 소진','#2f6fd6',`<circle cx="31" cy="30" r="15" fill="${arcane}"/><path d="m29 15-4 13 8 4-6 13m19-13 9-4m-11 13 8 5" fill="none" stroke-width="4"/>`],
  ['mend','치유','#3e8e5a',`<path d="M18 45c3-20 16-29 31-29-1 17-11 30-31 29Z" fill="${holy}"/><path d="M20 43 43 21m-16 14 8 1" fill="none"/>`],
  ['prayer','기원','#3e8e5a',`<path d="M16 42c5-9 9-13 14-7V19m18 23c-5-9-9-13-14-7V19M24 49h16" fill="none" stroke="${holy}" stroke-width="6"/><path d="M22 12v8m20-8v8M32 8v9" fill="none" stroke="${paper}"/>`],
  ['resurrect','소생','#3e8e5a',`<path d="M32 53c-13-7-14-20-4-31 2 7 6 8 8 13 4-5 5-10 4-17 12 13 8 29-8 35Z" fill="${holy}"/><path d="m18 20 6-6m22 6-6-6" fill="none" stroke="${paper}"/>`],
  ['ward','보호막','#3e8e5a',`<path d="M32 10 49 17v15c0 11-7 18-17 22-10-4-17-11-17-22V17Z" fill="${arcane}"/><path d="M32 17 43 22v10c0 7-4 11-11 15" fill="none" stroke="${paper}"/>`],
  ['cleanse','정화','#3e8e5a',`<path d="M27 13c11 13 11 21 0 26-11-5-11-13 0-26Zm16 18c8 10 8 16 0 20-8-4-8-10 0-20Z" fill="${arcane}"/><path d="m14 47 9 4" fill="none" stroke="${paper}"/>`],
  ['bless','축복','#3e8e5a',`<path d="M18 48c1-13 7-20 14-20s13 7 14 20Z" fill="${holy}"/><path d="M32 8v13m-13-7 7 9m19-9-7 9" fill="none" stroke="${paper}"/>`],
  ['warCry','전의 고양','#3e8e5a',`<path d="M14 25q13 7 0 14Z" fill="${holy}"/><path d="M29 24q9 8 0 16m10-22q15 14 0 28" fill="none" stroke="${paper}" stroke-width="4"/>`],
  ['meditate','명상','#3e8e5a',`<circle cx="32" cy="18" r="7" fill="${holy}"/><path d="M32 27v12m0-5-12 11m12-11 12 11M17 51h30" fill="none" stroke="${paper}" stroke-width="6"/>`],
  ['catchBreath','숨 고르기','#3e8e5a',`<path d="M11 30q12-10 22 0t20 0M17 42q8-6 15 0t14 0" fill="none" stroke="${paper}" stroke-width="5"/>`],
  ['guardStance','방어 자세','#3e8e5a',shield],
  ['ironSkin','굳히기','#3e8e5a',`<path d="M18 44c5-2 7-8 8-15l8-8 9 5-4 8 8 5-8 13H23Z" fill="${steel}"/><path d="m31 29 5 5-4 7" fill="none"/>`],
  ['backstep','물러서기','#3e8e5a',`<path d="M37 14c6 8 4 14-2 18-6 3-11-3-8-9l4-9Zm-14 22c6 8 4 14-2 18-6 3-11-3-8-9l4-9Z" fill="${paper}"/><path d="M48 44H32m7-7-7 7 7 7" fill="none" stroke="${paper}"/>`],
  ['hush','침묵','#5b4b8a',`<path d="M14 26q13-8 26 0v13q-13 8-26 0Z" fill="${paper}"/><path d="M11 51 52 12M44 27q8 5 0 10" fill="none" stroke="#b23a48" stroke-width="5"/>`],
]

const items = [
  ['swordTraining','훈련용 검',sword(false,false)], ['swordSteel','강철 검',sword(true,false)], ['swordLong','장검',sword(true,true)],
  ['daggerPlain','단도',dagger(false,false)], ['daggerCurved','곡도',dagger(true,false)], ['daggerAssassin','비수',dagger(false,true)],
  ['staffOak','참나무 지팡이',staff(`<path d="M31 17q10-12 18 0-7 8-18 0Z" fill="${paper}"/>`)],
  ['staffRune','룬 지팡이',staff(`<circle cx="40" cy="15" r="9" fill="${arcane}"/><path d="m35 15 5-5 5 5-5 5Z" fill="none"/>`)],
  ['staffSage','현자의 지팡이',staff(`<path d="m40 4 11 11-11 12-11-12Z" fill="${arcane}"/>`)],
  ['relicWood','목제 성표',`<path d="M32 8 47 19 42 46 32 56 22 46 17 19Z" fill="${wood}"/><circle cx="32" cy="30" r="8" fill="${paper}"/>`],
  ['relicSilver','은 성표',`<path d="M32 7 49 25 32 57 15 25Z" fill="${steel}"/><circle cx="32" cy="27" r="7" fill="${paper}"/>`],
  ['relicHoly','성유물',`<path d="m32 5 8 11 13 4-8 10 2 15-15 12-15-12 2-15-8-10 13-4Z" fill="${holy}"/><circle cx="32" cy="31" r="7" fill="${steel}"/>`],
  ['bowHunting','사냥활',bow(false,false)], ['bowLong','장궁',bow(true,false)], ['bowHorn','각궁',bow(true,true)],
  ['armorLeather','가죽 조끼',`<path d="m20 10 12 6 12-6 8 13-7 6v26H19V29l-7-6Z" fill="${leather}"/><path d="M26 18v32m12-32v32" fill="none"/>`],
  ['armorChain','사슬 갑옷',`<path d="m20 10 12 6 12-6 8 13-7 6v26H19V29l-7-6Z" fill="${steel}"/><path d="m22 25 5 5 5-5 5 5 5-5m-20 12 5 5 5-5 5 5 5-5" fill="none"/>`],
  ['armorPlate','판금 갑옷',`<path d="m19 9 13 7 13-7 9 15-9 6v25H19V30l-9-6Z" fill="${steel}"/><path d="M32 17v37M19 31h26" fill="none" stroke-width="4"/>`],
  ['robeCloth','천 로브',`<path d="m24 9 8 7 8-7 8 13-6 7 9 27H13l9-27-6-7Z" fill="${paper}"/><path d="M32 17v37" fill="none"/>`],
  ['robeEnchanted','마법 로브',`<path d="m24 9 8 7 8-7 8 13-6 7 9 27H13l9-27-6-7Z" fill="${arcane}"/><path d="m24 39 8-7 8 7-8 7Z" fill="${paper}"/>`],
  ['robeArch','대마법사 로브',`<path d="m22 8 10 8 10-8 9 14-7 8 9 27H11l9-27-7-8Z" fill="#2f6fd6"/><path d="M20 45h24M32 17v35" fill="none" stroke="${arcane}"/>`],
  ['ringSwift','신속의 반지',`<circle cx="28" cy="34" r="14" fill="none" stroke="${holy}" stroke-width="7"/><path d="M40 16h13m-16 8h18m-13 8h11" fill="none"/>`],
  ['charmGuard','수호의 부적',`<path d="M32 8v9M20 18h24l-3 28-9 10-9-10Z" fill="${steel}"/><path d="M32 25v20" fill="none"/>`],
  ['hornVanguard','선봉의 뿔피리',`<path d="M12 35c17 2 24-7 35-22l7 8C42 39 31 48 16 48Z" fill="${holy}"/><path d="m16 35-6 12 8 4" fill="none"/>`],
  ['amuletIron','철의 의지',`<path d="M16 10q16 18 32 0M32 25 45 34 40 52H24l-5-18Z" fill="${steel}"/><path d="m27 37 5-5 5 5-5 8Z" fill="none"/>`],
  ['coinLucky','행운의 동전',`<circle cx="32" cy="32" r="23" fill="${holy}"/><path d="M32 17v30m-9-22q9-8 18 0-9 8-18 14 9 8 18 0" fill="none"/>`],
  ['braceletVigor','활력 팔찌',`<path d="M17 20q15-13 30 0v24q-15 13-30 0Z" fill="${leather}"/><path d="m23 32 6 6 12-14" fill="none" stroke="${holy}" stroke-width="5"/>`],
  ['necklaceMemory','기억의 목걸이',`<path d="M14 10q18 24 36 0M22 30h20v25H22Z" fill="${paper}"/><path d="M27 36h10m-10 6h10m-10 6h7" fill="none"/>`],
  ['pendantRegen','재생의 펜던트',`<path d="M15 9q17 22 34 0M32 27c13 0 18 9 12 20-8 11-20 8-24 1-5-9 1-18 12-21Z" fill="${venom}"/><path d="M25 46q8-11 17-12" fill="none"/>`],
  ['ironScrap','철 조각',`<path d="m10 44 12-24 11 6 9-14 12 10-10 31-17-5-9 7Z" fill="${steel}"/><path d="m20 33 10 4 8-9" fill="none"/>`],
  ['leather','가죽',`<path d="M12 17q8-10 18-4 9-8 21 4-5 9 0 17-9 8-4 18-12-2-20 3-10-8 1-17Z" fill="${leather}"/>`],
  ['feather','깃털',`<path d="M13 51Q17 16 51 9 48 42 13 51Z" fill="${paper}"/><path d="M14 51 44 17M24 39l-1-12m9 4 11-2" fill="none"/>`],
  ['manaCrystal','마력 결정',`<path d="m32 5 17 18-8 31H23l-8-31Z" fill="${arcane}"/><path d="m15 23 17 8 17-8M32 31v23" fill="none"/>`],
  ['holyWater','성수',`<path d="M24 8h16v9l6 8v29H18V25l6-8Z" fill="${arcane}"/><path d="M21 34h22m-15-9h8" fill="none"/><circle cx="32" cy="43" r="5" fill="${holy}"/>`],
  ['bossSeal','두목의 인장',`<path d="M18 9h28l-4 16 9 9-8 21H21l-8-21 9-9Z" fill="${holy}"/><path d="m32 20 5 9 10 2-7 7 2 10-10-5-10 5 2-10-7-7 10-2Z" fill="${leather}"/>`],
  ['beastFang','짐승 송곳니',`<path d="M18 8q25 11 28 45-12 4-22-10-9-13-6-35Z" fill="${paper}"/><path d="M24 18q10 13 13 28" fill="none"/>`],
  ['venomSac','독주머니',`<path d="M25 9h14l-2 10c12 8 16 25 5 35H22c-11-10-7-27 5-35Z" fill="${venom}"/><path d="M23 37q9-8 18 0" fill="none"/>`],
  ['ogreCore','오우거의 핵',`<path d="M32 8c13-9 26 12 17 25-5 9-10 16-17 23-7-7-12-14-17-23C6 20 19-1 32 8Z" fill="#b23a48"/><path d="m25 17 4 11-6 9 10 3 6 11" fill="none"/>`],
]

const statuses = [
  ['poison','중독',venom,`<path d="M32 13c12 14 12 25 0 31-12-6-12-17 0-31Z" fill="#2f4a37"/><circle cx="25" cy="48" r="3" fill="${paper}"/><circle cx="39" cy="50" r="3" fill="${paper}"/>`],
  ['atkUp','공격 강화','#b23a48',up], ['atkDown','공격 약화','#b23a48',down],
  ['defUp','방어 강화',steel,`${shield}${up}`], ['defDown','방어 약화',steel,`${shield}<path d="m23 22 18 21m-8-18-5 11 8 4-5 11" fill="none"/>`],
  ['spdUp','가속',arcane,`<path d="M13 25h25m-31 9h25m-18 9h20" fill="none" stroke="${ink}" stroke-width="5"/>${up}`],
  ['spdDown','둔화',arcane,`<path d="M13 21h31M18 32h22m-16 11h12" fill="none" stroke="${ink}" stroke-width="5"/>${down}`],
  ['silence','침묵','#5b4b8a',`<path d="M16 25q12-7 24 0v13q-12 7-24 0Z" fill="${paper}"/><path d="m14 49 36-36" fill="none" stroke="#b23a48" stroke-width="5"/>`],
  ['barrier','보호막',arcane,shield],
]

const traits = [
  ['quickCast','속영창',`<path d="m31 12-9 21h9l-3 19 15-26h-9l5-14Z" fill="${arcane}"/>`],
  ['bulwark','방벽',shield],
  ['sniperEye','저격안',`<circle cx="32" cy="31" r="14" fill="${holy}"/><circle cx="32" cy="31" r="5" fill="#b23a48"/><path d="M32 10v8m0 26v8M11 31h8m26 0h8" fill="none"/>`],
  ['eager','선봉',`<path d="M13 39 35 15l10 10-22 24Z" fill="${holy}"/><path d="M39 39h12m-9-7 9 7-9 7" fill="none"/>`],
  ['extraPattern','암기',`<path d="M16 13h25l7 7v31H16Z" fill="${paper}"/><path d="M41 13v9h8M22 29h20m-20 8h20m-20 8h14" fill="none"/>`],
  ['ironWill','굳은 의지',`<path d="M32 11 47 18v14c0 10-6 16-15 21-9-5-15-11-15-21V18Z" fill="${steel}"/><path d="m24 31 6 7 11-14" fill="none"/>`],
  ['secondWind','재기',`<path d="M32 49c-10-5-11-15-3-24 2 6 5 7 7 11 3-4 4-8 3-13 10 10 7 22-7 26Z" fill="#b23a48"/><path d="M12 21q9-10 19-7m-7-6 7 6-7 6" fill="none"/>`],
  ['regen','재생',`<path d="M17 45c3-20 16-29 31-29-1 17-11 30-31 29Z" fill="${venom}"/><path d="M19 45 42 22m-24 4q-7 5-5 13" fill="none"/>`],
]

const groups = {
  skills: { dir: 'skills', defs: skills, render: ([, name, color, body]) => skill(name, color, body) },
  items: { dir: 'items', defs: items, render: ([, name, body]) => item(name, body) },
  status: { dir: 'status', defs: statuses, render: ([, name, fill, body]) => status(name, fill, body) },
  traits: { dir: 'traits', defs: traits, render: ([, name, body]) => trait(name, body) },
}

for (const { dir, defs, render } of Object.values(groups)) {
  mkdirSync(join(here, dir), { recursive: true })
  for (const def of defs) writeFileSync(join(here, dir, `${def[0]}.svg`), render(def), 'utf8')
}

const manifestPath = join(here, 'manifest.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
manifest.skills = Object.fromEntries(skills.map(([id, name, color]) => [id, { name, icon: `skills/${id}.svg`, color }]))
manifest.items = Object.fromEntries(items.map(([id, name]) => [id, { name, icon: `items/${id}.svg` }]))
manifest.status = Object.fromEntries(statuses.map(([id, name]) => [id, { name, icon: `status/${id}.svg` }]))
manifest.traits = Object.fromEntries(traits.map(([id, name]) => [id, { name, icon: `traits/${id}.svg` }]))
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

const ledgerPath = join(here, 'README.md')
let ledger = readFileSync(ledgerPath, 'utf8')
const start = '<!-- generated-icons:start -->'
const end = '<!-- generated-icons:end -->'
const rows = Object.values(groups).flatMap(({ dir, defs }) =>
  defs.map(([id, name]) => `| \`${dir}/${id}.svg\` | ${name} 아이콘 | 자체 제작 (\`build-icons.mjs\` 도형 정의) | 저장소 소유 | 2026-09-12 |`),
)
const block = `${start}\n${rows.join('\n')}\n${end}`
if (ledger.includes(start) && ledger.includes(end)) {
  ledger = ledger.replace(new RegExp(`${start}[\\s\\S]*?${end}`), block)
} else {
  ledger = ledger.replace('\n## 규약', `\n${block}\n\n## 규약`)
}
writeFileSync(ledgerPath, ledger, 'utf8')

console.log(`아이콘 ${skills.length + items.length + statuses.length + traits.length}종 생성`)
