const TOKEN_KEY = 'access_token'

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
  },
}

export default serverConfig
