// ============================================================
// REST 어댑터 설정 — HTTP/HTTPS 기반 인터페이스 호출 정보
// 라우트: /eai/rest-configs
// 인증 방식: NONE / BEARER / API_KEY / BASIC / OAUTH2 — 선택값에 따라 추가 필드가 조건부 노출
// 필수 검증: 기본정보 7개 + 인증유형별 동적 필수 (validate() 참고)
// ============================================================
import { useEffect, useState } from 'react'
import eaiApi, { handleEaiResponse } from '../../api/eaiApi'
import '../../eai.css'
import ActionMenu from '../../../portal/common/ActionMenu'

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD']
const AUTH_TYPES   = ['NONE', 'BEARER', 'API_KEY', 'BASIC', 'OAUTH2']

const defaultForm = {
  interfaceId: '', configName: '', url: '', httpMethod: 'POST', timeoutMs: 5000,
  authType: 'NONE', authValue: '', apiKeyHeader: '',
  tokenUrl: '', clientId: '', clientSecret: '', tokenScope: '',
  contentType: 'application/json', requestHeaders: '', requestTemplate: '',
  successHttpCodes: '200,201,202', responsePath: '',
  sslVerify: true, proxyHost: '', proxyPort: '', proxyUser: '', proxyPassword: '',
  isActive: true,
}

// 기본정보 박스 필수 — responsePath만 선택 (응답을 통째로 사용하는 케이스 허용)
const REQUIRED_BASIC = {
  interfaceId:      '인터페이스ID',
  configName:       '설정명',
  url:              'URL',
  httpMethod:       'HTTP Method',
  contentType:      'Content-Type',
  timeoutMs:        '타임아웃(ms)',
  successHttpCodes: '성공 HTTP 코드',
}

const isEmpty = (v) => v === '' || v === null || v === undefined

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M10 18a7.952 7.952 0 004.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A8 8 0 1010 18zm0-14a6 6 0 110 12A6 6 0 0110 4z" />
    </svg>
  )
}

function RestConfig() {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState({ interfaceId: '' })
  const [modal, setModal]     = useState(null)
  const [form, setForm]       = useState(defaultForm)
  const [saving, setSaving]   = useState(false)

  const load = () => {
    setLoading(true)
    eaiApi.restConfig.list(filter)
      .then(data => setList(Array.isArray(data) ? data : (data.content ?? [])))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openNew  = () => { setForm(defaultForm); setModal('new') }
  const openEdit = (item) => { setForm({ ...defaultForm, ...item }); setModal('edit') }
  const closeModal = () => setModal(null)

  // 인증 유형에 따라 동적으로 필수 필드가 달라짐
  //   BASIC/BEARER  → authValue
  //   API_KEY       → authValue + apiKeyHeader
  //   OAUTH2        → tokenUrl + clientId + clientSecret (scope는 선택)
  const validate = () => {
    for (const [key, label] of Object.entries(REQUIRED_BASIC)) {
      if (isEmpty(form[key])) return `${label} 항목은 필수입니다.`
    }
    if (form.authType === 'BASIC' || form.authType === 'BEARER') {
      if (isEmpty(form.authValue))
        return `${form.authType === 'BASIC' ? 'Basic 자격증명' : 'Bearer 토큰'} 항목은 필수입니다.`
    }
    if (form.authType === 'API_KEY') {
      if (isEmpty(form.authValue))    return 'API Key 값 항목은 필수입니다.'
      if (isEmpty(form.apiKeyHeader)) return 'API Key 헤더명 항목은 필수입니다.'
    }
    if (form.authType === 'OAUTH2') {
      if (isEmpty(form.tokenUrl))     return 'Token URL 항목은 필수입니다.'
      if (isEmpty(form.clientId))     return 'Client ID 항목은 필수입니다.'
      if (isEmpty(form.clientSecret)) return 'Client Secret 항목은 필수입니다.'
    }
    return null
  }

  const handleSave = async () => {
    const err = validate()
    if (err) { alert(err); return }
    setSaving(true)
    try {
      const res = modal === 'edit'
        ? await eaiApi.restConfig.update(form.id, form)
        : await eaiApi.restConfig.create(form)
      if (!handleEaiResponse(res)) return
      closeModal(); load()
    } catch { alert('저장 중 오류가 발생했습니다.') }
    finally { setSaving(false) }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`REST 설정 [${item.configName}]을 삭제하시겠습니까?`)) return
    try {
      const res = await eaiApi.restConfig.delete(item.id)
      if (!handleEaiResponse(res)) return
      load()
    } catch { alert('삭제 중 오류가 발생했습니다.') }
  }

  const fv = (key, label, placeholder = '', req = false) => (
    <div className="modal-field" key={key}>
      <label className={req ? 'req' : ''}>{label}</label>
      <input type="text" value={form[key] ?? ''} placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
    </div>
  )

  const fp = (key, label, req = false) => (
    <div className="modal-field" key={key}>
      <label className={req ? 'req' : ''}>{label}</label>
      <input type="password" value={form[key] ?? ''}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
    </div>
  )

  return (
    <div className="content-area eai-compact">
      <div className="content-body">
        <div className="grid-container">
          <div className="grid-toolbar">
            <div className="grid-toolbar-left">
              <span className="grid-title">REST 어댑터 설정</span>
            </div>
            <div className="grid-toolbar-right">
              <div className="grid-search-bar">
                <input type="text" placeholder="인터페이스ID" value={filter.interfaceId}
                  onChange={e => setFilter(f => ({ ...f, interfaceId: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && load()} />
                <button className="grid-search-btn" onClick={load}><SearchIcon /></button>
              </div>
              <button className="grid-add-btn" onClick={openNew}>+ 등록</button>
            </div>
          </div>

          <div className="grid-wrap">
            <table className="grid-table">
              <colgroup>
                <col style={{ width: 110 }} />
                <col style={{ width: 150 }} />
                <col />
                <col style={{ width: 70 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 60 }} />
                <col style={{ width: 48 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>인터페이스ID</th>
                  <th>설정명</th>
                  <th>URL</th>
                  <th>Method</th>
                  <th>인증유형</th>
                  <th>활성</th>
                  <th className="action-cell"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="grid-loading">로딩 중...</td></tr>
                ) : list.length === 0 ? (
                  <tr><td colSpan={7} className="grid-empty">데이터가 없습니다.</td></tr>
                ) : list.map(item => (
                  <tr key={item.id}>
                    <td>{item.interfaceId}</td>
                    <td>{item.configName}</td>
                    <td className="eai-cell-mute">{item.url}</td>
                    <td>{item.httpMethod}</td>
                    <td>{item.authType}</td>
                    <td className="eai-cell-center">
                      <span className={`eai-status-badge ${item.isActive ? 'ACTIVE' : 'INACTIVE'}`}>
                        {item.isActive ? 'Y' : 'N'}
                      </span>
                    </td>
                    <td className="action-cell">
                      <ActionMenu row={item} onEdit={openEdit} onDelete={handleDelete} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── 등록/수정 모달 — 좌: 기본정보+인증, 우: 요청·응답·SSL/프록시·상태 ─── */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" style={{ width: 920 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{modal === 'edit' ? 'REST 설정 수정' : 'REST 설정 등록'}</span>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="eai-modal-grid">
                <div className="eai-modal-col">
                  <div className="eai-form-section">
                    <h4>기본 정보</h4>
                    {fv('interfaceId', '인터페이스ID', 'IF-0001',                       true)}
                    {fv('configName',  '설정명',       '',                              true)}
                    {fv('url',         'URL',          'https://api.example.com/data', true)}
                    <div className="modal-field">
                      <label className="req">HTTP Method</label>
                      <select value={form.httpMethod}
                        onChange={e => setForm(f => ({ ...f, httpMethod: e.target.value }))}>
                        {HTTP_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    {fv('contentType',      'Content-Type',     '', true)}
                    {fv('timeoutMs',        '타임아웃(ms)',      '', true)}
                    {fv('successHttpCodes', '성공 HTTP 코드',    '', true)}
                    {fv('responsePath',     '응답 경로 ($.data)')}
                  </div>
                  <div className="eai-form-section">
                    <h4>인증 설정</h4>
                    <div className="modal-field">
                      <label className="req">인증 유형</label>
                      <select value={form.authType}
                        onChange={e => setForm(f => ({ ...f, authType: e.target.value }))}>
                        {AUTH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    {form.authType !== 'NONE' && form.authType !== 'OAUTH2' && (
                      fp('authValue', form.authType === 'BASIC' ? 'Basic 자격증명' : form.authType === 'API_KEY' ? 'API Key 값' : 'Bearer 토큰', true)
                    )}
                    {form.authType === 'API_KEY' && fv('apiKeyHeader', 'API Key 헤더명', 'X-API-KEY', true)}
                    {form.authType === 'OAUTH2' && <>
                      {fv('tokenUrl',     'Token URL',     '', true)}
                      {fv('clientId',     'Client ID',     '', true)}
                      {fp('clientSecret', 'Client Secret', true)}
                      {fv('tokenScope',   'Scope')}
                    </>}
                  </div>
                </div>
                <div className="eai-modal-col">
                  <div className="eai-form-section">
                    <h4>요청 / 응답 설정</h4>
                    <div className="modal-field modal-field-v">
                      <label>요청 헤더 (JSON)</label>
                      <textarea rows={2} value={form.requestHeaders ?? ''}
                        placeholder='[{"key":"X-Tenant","value":"T001"}]'
                        onChange={e => setForm(f => ({ ...f, requestHeaders: e.target.value }))} />
                    </div>
                    <div className="modal-field modal-field-v">
                      <label>요청 바디 템플릿</label>
                      <textarea rows={5} value={form.requestTemplate ?? ''}
                        onChange={e => setForm(f => ({ ...f, requestTemplate: e.target.value }))} />
                    </div>
                  </div>
                  <div className="eai-form-section">
                    <h4>SSL / 프록시</h4>
                    <div className="modal-field">
                      <label>SSL 검증</label>
                      <select value={form.sslVerify ? 'true' : 'false'}
                        onChange={e => setForm(f => ({ ...f, sslVerify: e.target.value === 'true' }))}>
                        <option value="true">검증</option>
                        <option value="false">무시</option>
                      </select>
                    </div>
                    {fv('proxyHost', '프록시 호스트')}
                    {fv('proxyPort', '프록시 포트')}
                    {fv('proxyUser', '프록시 사용자명')}
                    {fp('proxyPassword', '프록시 비밀번호')}
                  </div>
                  <div className="eai-form-section">
                    <h4>상태</h4>
                    <div className="modal-field">
                      <label>활성화</label>
                      <select value={form.isActive ? 'true' : 'false'}
                        onChange={e => setForm(f => ({ ...f, isActive: e.target.value === 'true' }))}>
                        <option value="true">활성</option>
                        <option value="false">비활성</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn-cancel" onClick={closeModal}>취소</button>
              <button className="modal-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RestConfig
