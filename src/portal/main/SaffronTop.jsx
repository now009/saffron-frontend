import { useNavigate, useLocation } from 'react-router-dom'
import '../common/css/SaffronTop.css'
import portalLogo from '../images/portal-logo.svg'
import serverConfig from '../../config/serverConfig.js'
import { MENUS, MENU_CONFIG, PATH_TO_MENU } from './menuConfig.js'

function SaffronTop() {
  const navigate = useNavigate()
  const location = useLocation()

  const pathKey = location.pathname.split('/')[1]
  const activeMenu = PATH_TO_MENU[pathKey] || ''

  const handleLogout = () => {
    serverConfig.token.remove()
    window.location.href = '/'
  }

  const handleMenuClick = (menu) => {
    const config = MENU_CONFIG[menu]
    if (config?.submenus.length > 0) {
      navigate(config.submenus[0].path)
    }
  }

  return (
    <header className="top-header">
      <div className="top-left">
        <img src={portalLogo} alt="Saffron Portal" className="portal-logo" />
        <nav className="top-nav">
          {MENUS.map((menu) => (
            <button
              key={menu}
              className={`nav-item ${activeMenu === menu ? 'active' : ''}`}
              onClick={() => handleMenuClick(menu)}
            >
              {menu}
            </button>
          ))}
        </nav>
      </div>
      <div className="top-right">
        <div className="user-info">
          <div className="user-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </div>
          <span className="user-label">User</span>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="로그아웃">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zm-5 12H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h7v-2z"/>
          </svg>
        </button>
      </div>
    </header>
  )
}

export default SaffronTop
