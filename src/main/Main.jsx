import { useState, useEffect } from 'react'
import { HashRouter } from 'react-router-dom'
import './Main.css'
import apiUri from '../api/apiUri.js'
import serverConfig from '../config/serverConfig.js'
import SaffronTop from '../portal/main/SaffronTop.jsx'
import SaffronLeft from '../portal/main/SaffronLeft.jsx'
import SaffronMain from '../portal/main/SaffronMain.jsx'

function Main() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenus, setUserMenus]     = useState([])

  useEffect(() => {
    const userId = serverConfig.token.payload()?.userId
    if (!userId) return
    fetch(apiUri.role.userMenus(userId), { headers: serverConfig.token.authHeader() })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.data ?? data?.list ?? [])
        setUserMenus(list)
      })
      .catch(() => setUserMenus([]))
  }, [])

  return (
    <HashRouter>
      <div className="portal-wrapper">
        <SaffronTop onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <div className="portal-body">
          <SaffronLeft open={sidebarOpen} menus={userMenus} />
          <SaffronMain />
        </div>
      </div>
    </HashRouter>
  )
}

export default Main
