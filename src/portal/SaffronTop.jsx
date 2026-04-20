import './common/css/SaffronTop.css'
import portalLogo from './images/portal-logo.svg'
import token from '../config/token.js'

const MENUS = ['사용자', '메뉴권한', '시스템']

function SaffronTop({ activeMenu, onMenuClick }) {
  const handleLogout = () => {
    token.remove()
    window.location.href = '/'
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
              onClick={() => onMenuClick(menu)}
            >
              {menu}
            </button>
          ))}
        </nav>
      </div>
      <div className="top-right">
        <div className="user-info" onClick={handleLogout} title="로그아웃">
          <div className="user-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </div>
          <span className="user-label">User</span>
        </div>
      </div>
    </header>
  )
}

export default SaffronTop
