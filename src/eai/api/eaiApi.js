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

const eaiApi = {
  // ─── 인터페이스 마스터 ───
  // toggle: 활성/비활성 전환, test: 테스트 페이로드 전송 후 결과 반환
  interface: {
    list:   (params = {}) => fetch(`${base}/eai/api/interfaces?${qs(params)}`, { headers: serverConfig.token.authHeader() }).then(r => r.json()),
    get:    (id)          => fetch(`${base}/eai/api/interfaces/${id}`, { headers: serverConfig.token.authHeader() }).then(r => r.json()),
    create: (data)        => fetch(`${base}/eai/api/interfaces`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    update: (id, data)    => fetch(`${base}/eai/api/interfaces/${id}`, { method: 'PUT', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    toggle: (id, active)  => fetch(`${base}/eai/api/interfaces/${id}/toggle`, { method: 'PATCH', headers: h(), body: JSON.stringify({ isActive: active }) }).then(r => r.json()),
    test:   (id, payload) => fetch(`${base}/eai/api/interfaces/${id}/test`, { method: 'POST', headers: h(), body: JSON.stringify({ payload }) }).then(r => r.json()),
  },
  // ─── 인터페이스에 종속된 어댑터 1:1 설정 (REST/SOAP/DB/FILE 다형) ───
  adapter: {
    get:  (interfaceId) => fetch(`${base}/eai/api/adapters/${interfaceId}`, { headers: serverConfig.token.authHeader() }).then(r => r.json()),
    save: (data)        => fetch(`${base}/eai/api/adapters`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
  },
  // ─── 매핑 규칙 (인터페이스 1개 = 규칙 N개, save는 전체 교체 방식) ───
  mapping: {
    list: (interfaceId)        => fetch(`${base}/eai/api/mappings/${interfaceId}`, { headers: serverConfig.token.authHeader() }).then(r => r.json()),
    save: (interfaceId, rules) => fetch(`${base}/eai/api/mappings/${interfaceId}`, { method: 'POST', headers: h(), body: JSON.stringify(rules) }).then(r => r.json()),
  },
  // ─── 메시지 처리 이력 (retry: FAIL/DLQ 상태에서만 의미 있음) ───
  message: {
    list:  (params = {}) => fetch(`${base}/eai/api/messages?${qs(params)}`, { headers: serverConfig.token.authHeader() }).then(r => r.json()),
    retry: (id)          => fetch(`${base}/eai/api/messages/${id}/retry`, { method: 'POST', headers: h() }).then(r => r.json()),
  },
  // ─── 실시간 지표 스냅샷 (Dashboard 10초 / Monitoring 5초 폴링) ───
  monitoring: {
    snapshot: () => fetch(`${base}/eai/api/monitoring/snapshot`, { headers: serverConfig.token.authHeader() }).then(r => r.json()),
  },
  // ─── Cron 스케줄 (run: 즉시 실행 트리거, 스케줄 등록은 인터페이스 등록 시 자동 생성 가정) ───
  schedule: {
    list:   ()           => fetch(`${base}/eai/api/schedules`, { headers: serverConfig.token.authHeader() }).then(r => r.json()),
    run:    (id)         => fetch(`${base}/eai/api/schedules/${id}/run`, { method: 'POST', headers: h() }).then(r => r.json()),
    toggle: (id, active) => fetch(`${base}/eai/api/schedules/${id}/toggle`, { method: 'PATCH', headers: h(), body: JSON.stringify({ isActive: active }) }).then(r => r.json()),
  },
  // ─── DataSource 마스터 (DB 어댑터가 참조) — test: 연결 테스트, 실제 쿼리 발송 ───
  datasource: {
    list:   (params = {}) => fetch(`${base}/eai/datasources?${qs(params)}`, { headers: serverConfig.token.authHeader() }).then(r => r.json()),
    get:    (id)          => fetch(`${base}/eai/datasources/${id}`, { headers: serverConfig.token.authHeader() }).then(r => r.json()),
    create: (data)        => fetch(`${base}/eai/datasources`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    update: (id, data)    => fetch(`${base}/eai/datasources/${id}`, { method: 'PUT', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id)          => fetch(`${base}/eai/datasources/${id}`, { method: 'DELETE', headers: h() }).then(r => r.json()),
    test:   (data)        => fetch(`${base}/eai/datasources/test`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
  },
  // ─── DB 어댑터 상세 설정 (datasourceId 참조 + statementId/operationType) ───
  dbAdapterConfig: {
    list:   (params = {}) => fetch(`${base}/eai/db-adapter-configs?${qs(params)}`, { headers: serverConfig.token.authHeader() }).then(r => r.json()),
    get:    (id)          => fetch(`${base}/eai/db-adapter-configs/${id}`, { headers: serverConfig.token.authHeader() }).then(r => r.json()),
    create: (data)        => fetch(`${base}/eai/db-adapter-configs`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    update: (id, data)    => fetch(`${base}/eai/db-adapter-configs/${id}`, { method: 'PUT', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id)          => fetch(`${base}/eai/db-adapter-configs/${id}`, { method: 'DELETE', headers: h() }).then(r => r.json()),
  },
  // ─── REST 어댑터 상세 설정 (인증·SSL·프록시 포함) ───
  restConfig: {
    list:   (params = {}) => fetch(`${base}/eai/rest-configs?${qs(params)}`, { headers: serverConfig.token.authHeader() }).then(r => r.json()),
    get:    (id)          => fetch(`${base}/eai/rest-configs/${id}`, { headers: serverConfig.token.authHeader() }).then(r => r.json()),
    create: (data)        => fetch(`${base}/eai/rest-configs`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    update: (id, data)    => fetch(`${base}/eai/rest-configs/${id}`, { method: 'PUT', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id)          => fetch(`${base}/eai/rest-configs/${id}`, { method: 'DELETE', headers: h() }).then(r => r.json()),
  },
  // ─── SOAP 어댑터 상세 설정 (WS-Security·MTOM 포함) ───
  soapConfig: {
    list:   (params = {}) => fetch(`${base}/eai/soap-configs?${qs(params)}`, { headers: serverConfig.token.authHeader() }).then(r => r.json()),
    get:    (id)          => fetch(`${base}/eai/soap-configs/${id}`, { headers: serverConfig.token.authHeader() }).then(r => r.json()),
    create: (data)        => fetch(`${base}/eai/soap-configs`, { method: 'POST', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    update: (id, data)    => fetch(`${base}/eai/soap-configs/${id}`, { method: 'PUT', headers: h(), body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id)          => fetch(`${base}/eai/soap-configs/${id}`, { method: 'DELETE', headers: h() }).then(r => r.json()),
  },
}

export default eaiApi
