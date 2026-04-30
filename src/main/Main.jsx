import { useState, useEffect } from 'react'
import { HashRouter, useLocation } from 'react-router-dom'
import './Main.css'
import apiUri from '../api/apiUri.js'
import serverConfig from '../config/serverConfig.js'
import { getCurrentSite } from '../portal/main/menuConfig.js'
import SaffronTop from '../SaffronTop.jsx'
import SaffronBody from '../SaffronBody.jsx'
import PortalLeft from '../portal/main/PortalLeft.jsx'
import PortalMain from '../portal/main/PortalMain.jsx'

function Layout({ sidebarOpen, onToggleSidebar }) {
  const location = useLocation()
  const isPortalView = location.pathname !== '/'
  const site = getCurrentSite(location.pathname)
  const [userMenus, setUserMenus] = useState([])

  useEffect(() => {
    const userId = serverConfig.token.payload()?.userId
    if (!userId || !site) {
      setUserMenus([])
      return
    }
    fetch(apiUri.role.userMenus(userId, site), { headers: serverConfig.token.authHeader() })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.data ?? data?.list ?? [])
        setUserMenus(list)
      })
      .catch(() => setUserMenus([]))
  }, [site])

  return (
    <div className="portal-wrapper">
      <SaffronTop onToggleSidebar={onToggleSidebar} />
      {isPortalView ? (
        <div className="portal-body">
          <PortalLeft open={sidebarOpen} menus={userMenus} />
          <PortalMain />
        </div>
      ) : (
        <SaffronBody />
      )}
    </div>
  )
}

function Main() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <HashRouter>
      <Layout
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />
    </HashRouter>
  )
}

export default Main
