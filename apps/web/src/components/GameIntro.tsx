// 게임 소개 (2026-09-15 단장 문구). 로그인 전 타이틀 화면에서 보여준다 — HOF · 제로식처럼 첫 화면이 무슨 게임인지 말한다 (docs/25 §4 ①).

export function GameIntro() {
  return (
    <div className="faq">
      <dl>
        <dt>게임 소개</dt>
        <dd>
          용병단을 이끌고 몬스터와 싸우는 <b>자동 전투 시뮬레이션 RPG</b>.<br />
          전투가 시작되면 단원들은 단장이 설정한 <b>교전 수칙</b>에 따라 싸운다.
        </dd>
        <dt>단장의 임무</dt>
        <dd>
          <ul>
            <li>싸우기 전에 단원마다 <b>교전 수칙</b>을 설정한다.</li>
            <li>
              교전 수칙은 <b>상황과 조건에 따라 단원이 취할 행동</b>을 정해 두는 것이다.
              <span className="faq-example">예) 아군 HP가 절반 아래면 → 치유</span>
              <span className="faq-example">예) 적이 셋 이상이면 → 광역 공격</span>
            </li>
            <li>승패는 손놀림이 아니라 <b>수칙 설계</b>에서 갈린다.</li>
          </ul>
        </dd>
      </dl>
    </div>
  )
}
