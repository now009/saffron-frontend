// ============================================================
// EAI REST API 클라이언트
// 백엔드 엔드포인트는 두 종류로 분리됨:
//   - /eai/api/...  : 비즈니스 로직 (interface, adapter, mapping, message, monitoring, schedule)
//   - /eai/...      : 설정 마스터 (datasource, db/rest/soap-configs)
// 모든 호출은 .then(r => r.json()) 까지 처리해서 데이터 객체를 반환한다.
// 인증 토큰은 serverConfig.token.authHeader() 가 매 호출마다 주입.
// ============================================================
import serverConfig from '../../config/serverConfig'

const base = serverConfig.portal.baseUrl
// JSON 본문이 있는 요청용 헤더 (인증 + Content-Type)
const h = () => ({ ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' })
// 쿼리스트링 빌더: null/undefined/빈문자열은 자동 제외 (검색 필터에서 활용)
const qs = (p) => Object.keys(p).filter(k => p[k] != null && p[k] !== '').map(k => `${k}=${encodeURIComponent(p[k])}`).join('&')

// 백엔드 표준 응답 처리: { timestamp, success, message }
// 백엔드는 비즈니스 실패(FK 제약 등)를 HTTP 200 + success=false로 응답하므로
// .catch()로는 못 잡고, 응답 본문의 success 필드를 직접 검사해야 한다.
// success === false 시 message로 alert 후 false 반환, 그 외(true/누락)는 true 반환.
// 호출 측: const res = await api...; if (!handleEaiResponse(res)) return
export const handleEaiResponse = (res) => {
  if (res?.success === false) {
    alert(res?.message ?? '처리 중 오류가 발생했습니다.')
    return false
  }
  return true
}

// 조회 응답 envelope 자동 해제: { timestamp, success, message, data } 형태면 data 추출.
// 배열·일반 객체·null 은 그대로 반환 (envelope 미적용 엔드포인트 호환).
// list/get 류 GET 호출에만 적용 — 저장/삭제 응답은 handleEaiResponse가 envelope 그대로 봐야 함.
const unwrap = (res) => {
  if (!res) return res
  if (Array.isArray(res)) return res
  if (typeof res === 'object' && 'success' in res) return res.data
  return res
}

// GET 호출 공통: 인증 헤더 + JSON 파싱 + envelope 해제
const getJson = (url) =>
  fetch(url, { headers: serverConfig.token.authHeader() }).then(r => r.json()).then(unwrap)

const eaiApi = {
  // ─── 인터페이스 마스터 ───
  // toggle: 활성/비활성 전환, test: 테스트 페이로드 전송 후 결과 반환
  // 조회(list/get)는 getJson으로 envelope 자동 해제, 변경 계열은 envelope 그대로 반환(handleEaiResponse용)
  interface: {
    list:   (params = {}) => getJson(`${base}/eai/api/interfaces?${qs(params)}`),
    get:    (id)          => getJson(`${base}/eai/api/interfaces/${id}`),
    create: (data)        => fetch(`${base}/eai/api/interfaces`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    update: (id, data)    => fetch(`${base}/eai/api/interfaces/${id}`, { method: 'PUT', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    toggle: (id, active)  => fetch(`${base}/eai/api/interfaces/${id}/toggle`, { method: 'PATCH', headers: h(), body: JSON.stringify({ isActive: active }) }).then(r => r.json()),
    test:   (id, payload) => fetch(`${base}/eai/api/interfaces/${id}/test`, { method: 'POST', headers: h(), body: JSON.stringify({ payload }) }).then(r => r.json()),
  },
  // ─── 인터페이스에 종속된 어댑터 1:1 설정 (REST/SOAP/DB/FILE 다형) ───
  adapter: {
    get:  (interfaceId) => getJson(`${base}/eai/api/adapters/${interfaceId}`),
    save: (data)        => fetch(`${base}/eai/api/adapters`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
  },
  // ─── 매핑 규칙 (인터페이스 1개 = 규칙 N개, save는 전체 교체 방식) ───
  mapping: {
    list: (interfaceId)        => getJson(`${base}/eai/api/mappings/${interfaceId}`),
    save: (interfaceId, rules) => fetch(`${base}/eai/api/mappings/${interfaceId}`, { method: 'POST', headers: h(), body: JSON.stringify(rules) }).then(r => r.json()),
  },
  // ─── 메시지 처리 이력 (retry: FAIL/DLQ 상태에서만 의미 있음) ───
  message: {
    list:  (params = {}) => getJson(`${base}/eai/api/messages?${qs(params)}`),
    retry: (id)          => fetch(`${base}/eai/api/messages/${id}/retry`, { method: 'POST', headers: h() }).then(r => r.json()),
  },
  // ─── 실시간 지표 스냅샷 (Dashboard 10초 / Monitoring 5초 폴링) ───
  monitoring: {
    snapshot: () => getJson(`${base}/eai/api/monitoring/snapshot`),
  },
  // ─── Cron 스케줄 (run: 즉시 실행 트리거, 스케줄 등록은 인터페이스 등록 시 자동 생성 가정) ───
  schedule: {
    list:   ()           => getJson(`${base}/eai/api/schedules`),
    run:    (id)         => fetch(`${base}/eai/api/schedules/${id}/run`, { method: 'POST', headers: h() }).then(r => r.json()),
    toggle: (id, active) => fetch(`${base}/eai/api/schedules/${id}/toggle`, { method: 'PATCH', headers: h(), body: JSON.stringify({ isActive: active }) }).then(r => r.json()),
  },
  // ─── DataSource 마스터 (DB 어댑터가 참조) — test: 연결 테스트, 실제 쿼리 발송 ───
  datasource: {
    list:   (params = {}) => getJson(`${base}/eai/datasources?${qs(params)}`),
    get:    (id)          => getJson(`${base}/eai/datasources/${id}`),
    create: (data)        => fetch(`${base}/eai/datasources`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    update: (id, data)    => fetch(`${base}/eai/datasources/${id}`, { method: 'PUT', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id)          => fetch(`${base}/eai/datasources/${id}`, { method: 'DELETE', headers: h() }).then(r => r.json()),
    test:   (data)        => fetch(`${base}/eai/datasources/test`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
  },
  // ─── DB 어댑터 상세 설정 (datasourceId 참조 + query/operationType) ───
  dbAdapterConfig: {
    list:   (params = {}) => getJson(`${base}/eai/db-adapter-configs?${qs(params)}`),
    get:    (id)          => getJson(`${base}/eai/db-adapter-configs/${id}`),
    create: (data)        => fetch(`${base}/eai/db-adapter-configs`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    update: (id, data)    => fetch(`${base}/eai/db-adapter-configs/${id}`, { method: 'PUT', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id)          => fetch(`${base}/eai/db-adapter-configs/${id}`, { method: 'DELETE', headers: h() }).then(r => r.json()),
  },
  // ─── 공용 쿼리 검증 (datasourceId로 DB 방언/연결 정보 자동 결정) ───
  // validate: { datasourceId, query } 전송, 응답 { success, message } envelope
  query: {
    validate: (data) => fetch(`${base}/eai/query/validate`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
  },
  // ─── REST 어댑터 상세 설정 (인증·SSL·프록시 포함) ───
  restConfig: {
    list:   (params = {}) => getJson(`${base}/eai/rest-configs?${qs(params)}`),
    get:    (id)          => getJson(`${base}/eai/rest-configs/${id}`),
    create: (data)        => fetch(`${base}/eai/rest-configs`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    update: (id, data)    => fetch(`${base}/eai/rest-configs/${id}`, { method: 'PUT', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id)          => fetch(`${base}/eai/rest-configs/${id}`, { method: 'DELETE', headers: h() }).then(r => r.json()),
  },
  // ─── SOAP 어댑터 상세 설정 (WS-Security·MTOM 포함) ───
  soapConfig: {
    list:   (params = {}) => getJson(`${base}/eai/soap-configs?${qs(params)}`),
    get:    (id)          => getJson(`${base}/eai/soap-configs/${id}`),
    create: (data)        => fetch(`${base}/eai/soap-configs`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    update: (id, data)    => fetch(`${base}/eai/soap-configs/${id}`, { method: 'PUT', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id)          => fetch(`${base}/eai/soap-configs/${id}`, { method: 'DELETE', headers: h() }).then(r => r.json()),
  },
}

export default eaiApi
