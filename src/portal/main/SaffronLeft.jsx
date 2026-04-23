import { Link, useLocation } from 'react-router-dom'
import '../common/css/SaffronLeft.css'
import { MENU_CONFIG, PATH_TO_MENU } from './menuConfig.js'

function SaffronLeft() {
  const location = useLocation()
  const pathKey = location.pathname.split('/')[1]
  const activeMenuLabel = PATH_TO_MENU[pathKey] || ''
  const config = MENU_CONFIG[activeMenuLabel]
  const submenus = config?.submenus ?? []

  return (
    <aside className="left-sidebar">
      {activeMenuLabel ? (
        <>
          <div className="sidebar-title">{activeMenuLabel}</div>
          <ul className="submenu-list">
            {submenus.map((sub) => (
              <li
                key={sub.path}
                className={`submenu-item ${location.pathname === sub.path ? 'active' : ''}`}
              >
                <span className="submenu-dot" />
                <Link to={sub.path}>{sub.label}</Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="sidebar-empty">메뉴를 선택하세요</div>
      )}
    </aside>
  )
}

export default SaffronLeft
