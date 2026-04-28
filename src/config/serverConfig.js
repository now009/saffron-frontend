const TOKEN_KEY = 'access_token'

const decodeJwt = (token) => {
  if (!token) return null
  try {
    const seg = token.split('.')[1]
    if (!seg) return null
    const b64    = seg.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - b64.length % 4) % 4)
    const json   = decodeURIComponent(
      atob(padded)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

const serverConfig = {
  portal: {
    baseUrl: 'http://localhost:8080',
  },
  auth: {
    baseUrl: 'http://localhost:8090',
    method: 'POST',
    successUrl: '/main',
  },
  token: {
    save:       (accessToken) => localStorage.setItem(TOKEN_KEY, accessToken),
    get:        ()            => localStorage.getItem(TOKEN_KEY),
    remove:     ()            => localStorage.removeItem(TOKEN_KEY),
    authHeader: ()            => ({ Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` }),
    payload:    ()            => decodeJwt(localStorage.getItem(TOKEN_KEY)),
    isExpired:  () => {
      const p = decodeJwt(localStorage.getItem(TOKEN_KEY))
      return !p || (typeof p.exp === 'number' && p.exp * 1000 <= Date.now())
    },
  },
}

export default serverConfig
