import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Main from './Main.jsx'
import serverConfig from '../config/serverConfig.js'

const params   = new URLSearchParams(window.location.search)
const urlToken = params.get('access_token')
if (urlToken) {
  serverConfig.token.save(urlToken)
  window.history.replaceState({}, '', '/main')
}

if (!serverConfig.token.get() || serverConfig.token.isExpired()) {
  serverConfig.token.remove()
  window.location.href = '/'
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <Main />
    </StrictMode>,
  )
}
