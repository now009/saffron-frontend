import { useNavigate } from 'react-router-dom'
import './portal/common/css/SaffronTop.css'
import portalLogo from './portal/images/portal-logo.svg'
import serverConfig from './config/serverConfig.js'
import { TOP_MENUS } from './portal/main/menuConfig.js'

function SaffronTop({ onToggleSidebar }) {
  const navigate = useNavigate()
  const user = serverConfig.token.payload()
  const isAdmin = serverConfig.token.isAdmin()
  const displayName = user?.userName || user?.userId || user?.sub || 'User'

  const visibleTopMenus = TOP_MENUS.filter((m) => !m.adminOnly || isAdmin)

  const handleLogout = () => {
    serverConfig.token.remove()
    window.location.href = '/'
  }

  return (
    <header className="top-header">
      <div className="top-left">
        <button className="menu-btn" onClick={onToggleSidebar} title="메뉴">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/>
          </svg>
        </button>
        <img
          src={portalLogo}
          alt="Saffron"
          className="portal-logo"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        />
        {visibleTopMenus.map((m) => (
          <button key={m.label} className="portal-btn" onClick={() => navigate(m.path)}>
            {m.label}
          </button>
        ))}
      </div>
      <div className="top-right">
        <div className="user-info">
          <span className="user-label" title={user?.email}>{displayName}</span>
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
