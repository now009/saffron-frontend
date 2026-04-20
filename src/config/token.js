const TOKEN_KEY = 'access_token'

const token = {
  save: (accessToken) => localStorage.setItem(TOKEN_KEY, accessToken),
  get: () => localStorage.getItem(TOKEN_KEY),
  remove: () => localStorage.removeItem(TOKEN_KEY),
  authHeader: () => ({ Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` }),
}

export default token
