// ============================================================
// SOAP 어댑터 설정 — WSDL 기반 레거시 SOAP 서비스 연동 정보
// 라우트: /eai/soap-configs
// 보안 유형: NONE / USERNAME_TOKEN / X509 / SAML — 선택값에 따라 추가 필드 조건부 노출
// 필수 검증: WSDL/서비스 6개 + SOAP 프로토콜 3개 + 보안유형별 동적 필수
// ============================================================
import { useEffect, useState } from 'react'
import eaiApi, { handleEaiResponse } from '../../api/eaiApi'
import '../../eai.css'
import ActionMenu from '../../../portal/common/ActionMenu'

const WS_SEC_TYPES = ['NONE', 'USERNAME_TOKEN', 'X509', 'SAML']

const defaultForm = {
  interfaceId: '', configName: '', wsdlUrl: '', serviceUrl: '', namespace: '',
  operationName: '', portName: '', soapVersion: '1.1', soapAction: '', mtomEnabled: false,
  wsSecurityType: 'NONE', wsUsername: '', wsPassword: '', wsPasswordType: 'PasswordText',
  keystorePath: '', keystorePassword: '', timeoutMs: 10000,
  requestTemplate: '', responsePath: '', isActive: true,
}

// WSDL/서비스 연결 필수 (portName은 선택 — WSDL이 단일 포트일 때 생략 가능)
const REQUIRED_WSDL = {
  interfaceId:   '인터페이스ID',
  configName:    '설정명',
  wsdlUrl:       'WSDL URL',
  serviceUrl:    '서비스 URL',
  namespace:     'Namespace',
  operationName: 'Operation 이름',
}

// SOAP 프로토콜 필수 (mtomEnabled는 boolean이므로 검증 불요)
const REQUIRED_PROTO = {
  soapVersion: 'SOAP 버전',
  soapAction:  'SOAP Action',
  timeoutMs:   '타임아웃(ms)',
}

const isEmpty = (v) => v === '' || v === null || v === undefined

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M10 18a7.952 7.952 0 004.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A8 8 0 1010 18zm0-14a6 6 0 110 12A6 6 0 0110 4z" />
    </svg>
  )
}

function SoapConfig() {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState({ interfaceId: '' })
  const [modal, setModal]     = useState(null)
  const [form, setForm]       = useState(defaultForm)
  const [saving, setSaving]   = useState(false)

  const load = () => {
    setLoading(true)
    eaiApi.soapConfig.list(filter)
      .then(data => setList(Array.isArray(data) ? data : (data.content ?? [])))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openNew  = () => { setForm(defaultForm); setModal('new') }
  const openEdit = (item) => { setForm({ ...defaultForm, ...item }); setModal('edit') }
  const closeModal = () => setModal(null)

  // 보안 유형에 따라 동적 필수
  //   USERNAME_TOKEN → wsUsername + wsPassword + wsPasswordType
  //   X509           → keystorePath + keystorePassword
  //   NONE / SAML    → 추가 필드 없음
  const validate = () => {
    for (const [key, label] of Object.entries(REQUIRED_WSDL)) {
      if (isEmpty(form[key])) return `${label} 항목은 필수입니다.`
    }
    for (const [key, label] of Object.entries(REQUIRED_PROTO)) {
      if (isEmpty(form[key])) return `${label} 항목은 필수입니다.`
    }
    if (form.wsSecurityType === 'USERNAME_TOKEN') {
      if (isEmpty(form.wsUsername))     return 'WS 사용자명 항목은 필수입니다.'
      if (isEmpty(form.wsPassword))     return 'WS 비밀번호 항목은 필수입니다.'
      if (isEmpty(form.wsPasswordType)) return '비밀번호 유형 항목은 필수입니다.'
    }
    if (form.wsSecurityType === 'X509') {
      if (isEmpty(form.keystorePath))     return '키스토어 경로 항목은 필수입니다.'
      if (isEmpty(form.keystorePassword)) return '키스토어 비밀번호 항목은 필수입니다.'
    }
    return null
  }

  const handleSave = async () => {
    const err = validate()
    if (err) { alert(err); return }
    setSaving(true)
    try {
      const res = modal === 'edit'
        ? await eaiApi.soapConfig.update(form.id, form)
        : await eaiApi.soapConfig.create(form)
      if (!handleEaiResponse(res)) return
      closeModal(); load()
    } catch { alert('저장 중 오류가 발생했습니다.') }
    finally { setSaving(false) }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`SOAP 설정 [${item.configName}]을 삭제하시겠습니까?`)) return
    try {
      const res = await eaiApi.soapConfig.delete(item.id)
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
              <span className="grid-title">SOAP 어댑터 설정</span>
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
                <col style={{ width: 220 }} />
                <col style={{ width: 70 }} />
                <col style={{ width: 60 }} />
                <col style={{ width: 48 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>인터페이스ID</th>
                  <th>설정명</th>
                  <th>WSDL URL</th>
                  <th>서비스 URL</th>
                  <th>SOAP버전</th>
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
                    <td className="eai-cell-mute">{item.wsdlUrl}</td>
                    <td className="eai-cell-mute">{item.serviceUrl}</td>
                    <td className="eai-cell-center">{item.soapVersion}</td>
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

      {/* ─── 등록/수정 모달 — 좌: WSDL+SOAP 프로토콜, 우: WS-Security+요청/응답 ─── */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" style={{ width: 920 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{modal === 'edit' ? 'SOAP 설정 수정' : 'SOAP 설정 등록'}</span>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="eai-modal-grid">
                <div className="eai-modal-col">
                  <div className="eai-form-section">
                    <h4>WSDL / 서비스 연결</h4>
                    {fv('interfaceId',   '인터페이스ID',   'IF-0001',                     true)}
                    {fv('configName',    '설정명',         '',                            true)}
                    {fv('wsdlUrl',       'WSDL URL',       'http://legacy/service?wsdl', true)}
                    {fv('serviceUrl',    '서비스 URL',      'http://legacy/service',      true)}
                    {fv('namespace',     'Namespace',       'http://example.com/schema', true)}
                    {fv('operationName', 'Operation 이름', '',                            true)}
                    {fv('portName',      'Port 이름 (선택)')}
                  </div>
                  <div className="eai-form-section">
                    <h4>SOAP 프로토콜</h4>
                    <div className="modal-field">
                      <label className="req">SOAP 버전</label>
                      <select value={form.soapVersion}
                        onChange={e => setForm(f => ({ ...f, soapVersion: e.target.value }))}>
                        <option value="1.1">1.1</option>
                        <option value="1.2">1.2</option>
                      </select>
                    </div>
                    {fv('soapAction', 'SOAP Action', '', true)}
                    <div className="modal-field">
                      <label>MTOM 사용</label>
                      <select value={form.mtomEnabled ? 'true' : 'false'}
                        onChange={e => setForm(f => ({ ...f, mtomEnabled: e.target.value === 'true' }))}>
                        <option value="false">미사용</option>
                        <option value="true">사용</option>
                      </select>
                    </div>
                    {fv('timeoutMs', '타임아웃(ms)', '', true)}
                  </div>
                </div>
                <div className="eai-modal-col">
                  <div className="eai-form-section">
                    <h4>WS-Security 인증</h4>
                    <div className="modal-field">
                      <label className="req">보안 유형</label>
                      <select value={form.wsSecurityType}
                        onChange={e => setForm(f => ({ ...f, wsSecurityType: e.target.value }))}>
                        {WS_SEC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    {form.wsSecurityType === 'USERNAME_TOKEN' && <>
                      {fv('wsUsername', 'WS 사용자명', '', true)}
                      {fp('wsPassword', 'WS 비밀번호',     true)}
                      <div className="modal-field">
                        <label className="req">비밀번호 유형</label>
                        <select value={form.wsPasswordType}
                          onChange={e => setForm(f => ({ ...f, wsPasswordType: e.target.value }))}>
                          <option value="PasswordText">PasswordText</option>
                          <option value="PasswordDigest">PasswordDigest</option>
                        </select>
                      </div>
                    </>}
                    {form.wsSecurityType === 'X509' && <>
                      {fv('keystorePath',     '키스토어 경로',     '', true)}
                      {fp('keystorePassword', '키스토어 비밀번호', true)}
                    </>}
                  </div>
                  <div className="eai-form-section">
                    <h4>요청 / 응답</h4>
                    <div className="modal-field modal-field-v">
                      <label>요청 템플릿 (XML)</label>
                      <textarea rows={6} value={form.requestTemplate ?? ''}
                        style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                        onChange={e => setForm(f => ({ ...f, requestTemplate: e.target.value }))} />
                    </div>
                    {fv('responsePath', '응답 XPath 경로')}
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

export default SoapConfig
