import { useEffect, useState } from 'react'
import './Main.css'
import token from '../config/token.js'
import SaffronTop from '../portal/SaffronTop.jsx'
import SaffronLeft from '../portal/SaffronLeft.jsx'
import SaffronMain from '../portal/SaffronMain.jsx'

function Main() {
  const [activeMenu, setActiveMenu] = useState('')
  const [activeSubMenu, setActiveSubMenu] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('access_token')
    if (urlToken) {
      token.save(urlToken)
      window.history.replaceState({}, '', '/main')
      return
    }
    if (!token.get()) {
      window.location.href = '/'
    }
  }, [])

  const handleMenuClick = (menu) => {
    setActiveMenu(menu)
    setActiveSubMenu('')
  }

  return (
    <div className="portal-wrapper">
      <SaffronTop activeMenu={activeMenu} onMenuClick={handleMenuClick} />
      <div className="portal-body">
        <SaffronLeft
          activeMenu={activeMenu}
          activeSubMenu={activeSubMenu}
          onSubMenuClick={setActiveSubMenu}
        />
        <SaffronMain activeMenu={activeMenu} activeSubMenu={activeSubMenu} />
      </div>
    </div>
  )
}

export default Main
