// ============================================================
// EAI 진입 랜딩 페이지
// 라우트: /eai (PortalMain.jsx 라우팅에서 사용)
// 별도 데이터 없이 환영 문구만 노출 — Dashboard로 직접 진입하는 동선이
// 표준이지만, 좌측 메뉴 미연결 상태에서 빈 페이지가 보이는 걸 방지하는 폴백.
// ============================================================
function EaiMain() {
  return (
    <div className="dashboard-area">
      <div className="dashboard-welcome">
        <h2>Saffron EAI에 오신 것을 환영합니다.</h2>
        <p>좌측 메뉴를 클릭하여 시작하세요.</p>
      </div>
    </div>
  )
}

export default EaiMain
