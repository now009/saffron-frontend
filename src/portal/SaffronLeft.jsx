import './common/css/SaffronLeft.css'

const SUBMENU_MAP = {
  '사용자': ['사용자 목록', '사용자 등록', '권한 설정'],
  '메뉴권한': ['메뉴 관리', '권한 그룹', '접근 제어'],
  '시스템': ['시스템 설정', '코드 관리', '로그 조회'],
}

function SaffronLeft({ activeMenu, activeSubMenu, onSubMenuClick }) {
  const subMenus = SUBMENU_MAP[activeMenu] || []

  return (
    <aside className="left-sidebar">
      {activeMenu && (
        <>
          <div className="sidebar-title">{activeMenu}</div>
          <ul className="submenu-list">
            {subMenus.map((sub) => (
              <li
                key={sub}
                className={`submenu-item ${activeSubMenu === sub ? 'active' : ''}`}
                onClick={() => onSubMenuClick(sub)}
              >
                <span className="submenu-dot" />
                {sub}
              </li>
            ))}
          </ul>
        </>
      )}
      {!activeMenu && (
        <div className="sidebar-empty">메뉴를 선택하세요</div>
      )}
    </aside>
  )
}

export default SaffronLeft
