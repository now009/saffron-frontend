import { useState } from 'react'
import '../css/App.css'
import saffronLogo from '../images/saffron-logo.svg'
import darkBg from '../images/dark-bg.svg'
import serverConfig from '../config/serverConfig.js'
import apiUri from '../api/apiUri.js'

function App() {
  const [userId, setUserId] = useState('admin')
  const [password, setPassword] = useState('1234!')
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!userId || !password) {
      setError('아이디와 비밀번호를 입력해주세요.')
      return
    }
    setError('')

    try {
      const params = new URLSearchParams()
      params.append('userId', userId)
      params.append('password', password)

      const res = await fetch(apiUri.auth.login(), {
        method: serverConfig.auth.method,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })

      if (res.ok) {
        const data = await res.json()
        serverConfig.token.save(data.access_token)
        window.location.href = serverConfig.auth.successUrl
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || `로그인 실패 (${res.status})`)
      }
    } catch (err) {
      setError('서버에 연결할 수 없습니다.')
      console.error(err)
    }
  }

  return (
    <div className="container" style={{ backgroundImage: `url(${darkBg})` }}>
      <div className="content">
        <img src={saffronLogo} alt="Saffron Front" className="logo" />
        <h1 className="title">Saffron Front</h1>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="userId">아이디</label>
            <input
              id="userId"
              type="text"
              placeholder="아이디를 입력하세요"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button type="submit" className="login-btn">Login</button>
        </form>
      </div>
    </div>
  )
}

export default App
