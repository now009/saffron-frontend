import '../common/css/SaffronTop.css'
import portalLogo from '../images/portal-logo.svg'
import serverConfig from '../../config/serverConfig.js'

function SaffronTop({ onToggleSidebar }) {
  const user = serverConfig.token.payload()
  const displayName = user?.userName || user?.userId || user?.sub || 'User'

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
        <img src={portalLogo} alt="Saffron Portal" className="portal-logo" />
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
