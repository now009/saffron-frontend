import serverConfig from '../../config/serverConfig'

const base = serverConfig.portal.baseUrl
const h = () => ({ ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' })
const qs = (p) => Object.keys(p).filter(k => p[k] != null && p[k] !== '').map(k => `${k}=${encodeURIComponent(p[k])}`).join('&')

const eaiApi = {
  interface: {
    list:   (params = {}) => fetch(`${base}/eai/api/interfaces?${qs(params)}`, { headers: serverConfig.token.authHeader() }).then(r => r.json()),
    get:    (id)          => fetch(`${base}/eai/api/interfaces/${id}`, { headers: serverConfig.token.authHeader() }).then(r => r.json()),
    create: (data)        => fetch(`${base}/eai/api/interfaces`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    update: (id, data)    => fetch(`${base}/eai/api/interfaces/${id}`, { method: 'PUT', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    toggle: (id, active)  => fetch(`${base}/eai/api/interfaces/${id}/toggle`, { method: 'PATCH', headers: h(), body: JSON.stringify({ isActive: active }) }).then(r => r.json()),
    test:   (id, payload) => fetch(`${base}/eai/api/interfaces/${id}/test`, { method: 'POST', headers: h(), body: JSON.stringify({ payload }) }).then(r => r.json()),
  },
  adapter: {
    get:  (interfaceId) => fetch(`${base}/eai/api/adapters/${interfaceId}`, { headers: serverConfig.token.authHeader() }).then(r => r.json()),
    save: (data)        => fetch(`${base}/eai/api/adapters`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
  },
  mapping: {
    list: (interfaceId)        => fetch(`${base}/eai/api/mappings/${interfaceId}`, { headers: serverConfig.token.authHeader() }).then(r => r.json()),
    save: (interfaceId, rules) => fetch(`${base}/eai/api/mappings/${interfaceId}`, { method: 'POST', headers: h(), body: JSON.stringify(rules) }).then(r => r.json()),
  },
  message: {
    list:  (params = {}) => fetch(`${base}/eai/api/messages?${qs(params)}`, { headers: serverConfig.token.authHeader() }).then(r => r.json()),
    retry: (id)          => fetch(`${base}/eai/api/messages/${id}/retry`, { method: 'POST', headers: h() }).then(r => r.json()),
  },
  monitoring: {
    snapshot: () => fetch(`${base}/eai/api/monitoring/snapshot`, { headers: serverConfig.token.authHeader() }).then(r => r.json()),
  },
  schedule: {
    list:   ()           => fetch(`${base}/eai/api/schedules`, { headers: serverConfig.token.authHeader() }).then(r => r.json()),
    run:    (id)         => fetch(`${base}/eai/api/schedules/${id}/run`, { method: 'POST', headers: h() }).then(r => r.json()),
    toggle: (id, active) => fetch(`${base}/eai/api/schedules/${id}/toggle`, { method: 'PATCH', headers: h(), body: JSON.stringify({ isActive: active }) }).then(r => r.json()),
  },
}

export default eaiApi
