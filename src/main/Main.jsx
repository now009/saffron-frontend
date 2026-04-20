import { useEffect, useState } from 'react'
import './Main.css'
import saffronLogo from '../images/saffron-logo.svg'
import darkBg from '../images/dark-bg.svg'
import token from '../config/token.js'

function Main() {
  const [accessToken, setAccessToken] = useState('')

  useEffect(() => {
    // URL 쿼리에서 access_token 추출 (백엔드 redirect 방식)
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('access_token')
    if (urlToken) {
      token.save(urlToken)
      // URL에서 토큰 제거 (보안)
      window.history.replaceState({}, '', '/main')
      setAccessToken(urlToken)
      return
    }

    // 기존 저장된 토큰 확인
    const saved = token.get()
    if (!saved) {
      window.location.href = '/'
      return
    }
    setAccessToken(saved)
  }, [])

  // 백엔드 API 호출 예시
  // const fetchData = async () => {
  //   const res = await fetch('http://localhost:8090/api/data', {
  //     headers: token.authHeader(),   // Authorization: Bearer <token>
  //   })
  //   const data = await res.json()
  // }

  return (
    <div className="main-container" style={{ backgroundImage: `url(${darkBg})` }}>
      <div className="main-content">
        <img src={saffronLogo} alt="Saffron Front" className="main-logo" />
        <h1 className="main-title">Saffron Front</h1>
        <p className="main-subtitle">Welcome to the main page</p>
        {accessToken && (
          <p className="token-info">✓ 인증 완료</p>
        )}
      </div>
    </div>
  )
}

export default Main
