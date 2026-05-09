import serverConfig from '../../config/serverConfig'

const base = serverConfig.portal.baseUrl
const h    = () => ({ ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' })
const hx   = () => ({ 'Content-Type': 'application/json' }) // 응시자 API — 인증 불필요
const qs   = (p) => Object.keys(p).filter(k => p[k] != null && p[k] !== '').map(k => `${k}=${encodeURIComponent(p[k])}`).join('&')

export const handleQbankResponse = (res) => {
  if (res?.success === false) {
    alert(res?.message ?? '처리 중 오류가 발생했습니다.')
    return false
  }
  return true
}

const unwrap = (res) => {
  if (!res) return res
  if (Array.isArray(res)) return res
  if (typeof res === 'object' && 'success' in res) return res.data
  return res
}

const getJson   = (url) => fetch(url, { headers: h()  }).then(r => r.json()).then(unwrap)
const getJsonX  = (url) => fetch(url, { headers: hx() }).then(r => r.json()).then(unwrap)

const qbankApi = {
  // ─── 관리자: 시험종류 ───
  examType: {
    list:   ()         => getJson(`${base}/api/qbank/admin/exam-types`),
    create: (data)     => fetch(`${base}/api/qbank/admin/exam-types`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    update: (id, data) => fetch(`${base}/api/qbank/admin/exam-types/${id}`, { method: 'PUT', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id)       => fetch(`${base}/api/qbank/admin/exam-types/${id}`, { method: 'DELETE', headers: h() }).then(r => r.json()),
  },
  // ─── 관리자: 시험대상 ───
  examSubject: {
    list:   ()         => getJson(`${base}/api/qbank/admin/exam-subjects`),
    create: (data)     => fetch(`${base}/api/qbank/admin/exam-subjects`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    update: (id, data) => fetch(`${base}/api/qbank/admin/exam-subjects/${id}`, { method: 'PUT', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id)       => fetch(`${base}/api/qbank/admin/exam-subjects/${id}`, { method: 'DELETE', headers: h() }).then(r => r.json()),
  },
  // ─── 관리자: 시험지 ───
  paper: {
    list:   ()         => getJson(`${base}/api/qbank/admin/papers`),
    get:    (id)       => getJson(`${base}/api/qbank/admin/papers/${id}`),
    create: (data)     => fetch(`${base}/api/qbank/admin/papers`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    update: (id, data) => fetch(`${base}/api/qbank/admin/papers/${id}`, { method: 'PUT', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id)       => fetch(`${base}/api/qbank/admin/papers/${id}`, { method: 'DELETE', headers: h() }).then(r => r.json()),
  },
  // ─── 관리자: 문항 ───
  question: {
    list:   (paperId)        => getJson(`${base}/api/qbank/admin/papers/${paperId}/questions`),
    create: (paperId, data)  => fetch(`${base}/api/qbank/admin/papers/${paperId}/questions`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    update: (id, data)       => fetch(`${base}/api/qbank/admin/questions/${id}`, { method: 'PUT', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id)             => fetch(`${base}/api/qbank/admin/questions/${id}`, { method: 'DELETE', headers: h() }).then(r => r.json()),
  },
  // ─── 관리자: 보기 ───
  choice: {
    create: (questionId, data) => fetch(`${base}/api/qbank/admin/questions/${questionId}/choices`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    update: (id, data)         => fetch(`${base}/api/qbank/admin/choices/${id}`, { method: 'PUT', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id)               => fetch(`${base}/api/qbank/admin/choices/${id}`, { method: 'DELETE', headers: h() }).then(r => r.json()),
  },
  // ─── 관리자: 채점 ───
  session: {
    list:    (params = {}) => getJson(`${base}/api/qbank/admin/sessions?${qs(params)}`),
    answers: (id)          => getJson(`${base}/api/qbank/admin/sessions/${id}/answers`),
    grade:   (id, data)    => fetch(`${base}/api/qbank/admin/sessions/${id}/grade`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
  },
  // ─── 응시자: 인증 불필요 ───
  exam: {
    types:    ()                => getJsonX(`${base}/api/qbank/exam/types`),
    subjects: ()                => getJsonX(`${base}/api/qbank/exam/subjects`),
    papers:   (params = {})     => getJsonX(`${base}/api/qbank/exam/papers?${qs(params)}`),
    start:    (data)            => fetch(`${base}/api/qbank/exam/sessions`, { method: 'POST', headers: hx(), body: JSON.stringify(data) }).then(r => r.json()),
    submit:   (sessionId, data) => fetch(`${base}/api/qbank/exam/sessions/${sessionId}/submit`, { method: 'POST', headers: hx(), body: JSON.stringify(data) }).then(r => r.json()),
  },
}

export default qbankApi
