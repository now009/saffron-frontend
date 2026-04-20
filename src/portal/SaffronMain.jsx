import './common/css/SaffronMain.css'

function SaffronMain({ activeMenu, activeSubMenu }) {
  return (
    <main className="main-content">
      {activeSubMenu ? (
        <div className="content-area">
          <div className="content-breadcrumb">
            {activeMenu} &gt; {activeSubMenu}
          </div>
          <div className="content-body">
            <h2 className="content-title">{activeSubMenu}</h2>
            <p className="content-placeholder">콘텐츠 영역입니다.</p>
          </div>
        </div>
      ) : (
        <div className="dashboard-area">
          <div className="dashboard-welcome">
            <h2>Saffron Portal에 오신 것을 환영합니다.</h2>
            <p>상단 메뉴를 클릭하여 시작하세요.</p>
          </div>
          <div className="dashboard-cards">
            <div className="dashboard-card">
              <span className="card-icon">👤</span>
              <span className="card-label">사용자 관리</span>
            </div>
            <div className="dashboard-card">
              <span className="card-icon">🔐</span>
              <span className="card-label">메뉴 권한</span>
            </div>
            <div className="dashboard-card">
              <span className="card-icon">⚙️</span>
              <span className="card-label">시스템 설정</span>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default SaffronMain
