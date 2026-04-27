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

  const handleSubmit = (e) => {
    if (!userId || !password) {
      e.preventDefault()
      setError('아이디와 비밀번호를 입력해주세요.')
      return
    }
    setError('')
  }

  return (
    <div className="container" style={{ backgroundImage: `url(${darkBg})` }}>
      <div className="content">
        <img src={saffronLogo} alt="Saffron Front" className="logo" />
        <h1 className="title">Saffron Front</h1>

        <form
          className="login-form"
          action={apiUri.auth.login()}
          method={serverConfig.auth.method}
          onSubmit={handleSubmit}
        >
          <div className="input-group">
            <label htmlFor="userId">아이디</label>
            <input
              id="userId"
              name="userId"
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
              name="password"
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
