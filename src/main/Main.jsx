import { useEffect } from 'react'
import { HashRouter } from 'react-router-dom'
import './Main.css'
import serverConfig from '../config/serverConfig.js'
import SaffronTop from '../portal/main/SaffronTop.jsx'
import SaffronLeft from '../portal/main/SaffronLeft.jsx'
import SaffronMain from '../portal/main/SaffronMain.jsx'

function Main() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('access_token')
    if (urlToken) {
      serverConfig.token.save(urlToken)
      window.history.replaceState({}, '', '/main')
      return
    }
    if (!serverConfig.token.get()) {
      window.location.href = '/'
    }
  }, [])

  return (
    <HashRouter>
      <div className="portal-wrapper">
        <SaffronTop />
        <div className="portal-body">
          <SaffronLeft />
          <SaffronMain />
        </div>
      </div>
    </HashRouter>
  )
}

export default Main
