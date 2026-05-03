import { useEffect, useState } from 'react'
import eaiApi from '../../api/eaiApi'
import '../../eai.css'

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

  const handleSave = async () => {
    setSaving(true)
    try {
      if (modal === 'edit') await eaiApi.restConfig.update(form.id, form)
      else                  await eaiApi.restConfig.create(form)
      closeModal(); load()
    } catch { alert('저장 중 오류가 발생했습니다.') }
    finally { setSaving(false) }
  }

  const handleDelete = async (e, item) => {
    e.stopPropagation()
    if (!window.confirm(`REST 설정 [${item.configName}]을 삭제하시겠습니까?`)) return
    await eaiApi.restConfig.delete(item.id).catch(() => alert('삭제 중 오류가 발생했습니다.'))
    load()
  }

  const fv = (key, label, placeholder = '') => (
    <div className="modal-field" key={key}>
      <label>{label}</label>
      <input type="text" value={form[key] ?? ''} placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
    </div>
  )

  const fp = (key, label) => (
    <div className="modal-field" key={key}>
      <label>{label}</label>
      <input type="password" value={form[key] ?? ''}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
    </div>
  )

  return (
    <div className="content-area">
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
                <col style={{ width: 80 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>인터페이스ID</th>
                  <th>설정명</th>
                  <th>URL</th>
                  <th>Method</th>
                  <th>인증유형</th>
                  <th>활성</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="grid-loading">로딩 중...</td></tr>
                ) : list.length === 0 ? (
                  <tr><td colSpan={7} className="grid-empty">데이터가 없습니다.</td></tr>
                ) : list.map(item => (
                  <tr key={item.id} onClick={() => openEdit(item)} style={{ cursor: 'pointer' }}>
                    <td>{item.interfaceId}</td>
                    <td>{item.configName}</td>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>{item.url}</td>
                    <td>{item.httpMethod}</td>
                    <td>{item.authType}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`eai-status-badge ${item.isActive ? 'ACTIVE' : 'INACTIVE'}`}>
                        {item.isActive ? 'Y' : 'N'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="grid-search-btn" style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={e => handleDelete(e, item)}>삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" style={{ width: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>{modal === 'edit' ? 'REST 설정 수정' : 'REST 설정 등록'}</span>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>×</button>
            </div>
            <div className="modal-body">
              <div className="eai-form-section">
                <h4>기본 정보</h4>
                {fv('interfaceId', '인터페이스ID', 'IF-0001')}
                {fv('configName',  '설정명')}
                {fv('url',         'URL', 'https://api.example.com/data')}
                <div className="modal-field">
                  <label>HTTP Method</label>
                  <select value={form.httpMethod}
                    onChange={e => setForm(f => ({ ...f, httpMethod: e.target.value }))}>
                    {HTTP_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                {fv('contentType',      'Content-Type')}
                {fv('timeoutMs',        '타임아웃(ms)')}
                {fv('successHttpCodes', '성공 HTTP 코드')}
                {fv('responsePath',     '응답 경로 ($.data)')}
              </div>
              <div className="eai-form-section">
                <h4>인증 설정</h4>
                <div className="modal-field">
                  <label>인증 유형</label>
                  <select value={form.authType}
                    onChange={e => setForm(f => ({ ...f, authType: e.target.value }))}>
                    {AUTH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {form.authType !== 'NONE' && form.authType !== 'OAUTH2' && (
                  fp('authValue', form.authType === 'BASIC' ? 'Basic 자격증명' : form.authType === 'API_KEY' ? 'API Key 값' : 'Bearer 토큰')
                )}
                {form.authType === 'API_KEY' && fv('apiKeyHeader', 'API Key 헤더명', 'X-API-KEY')}
                {form.authType === 'OAUTH2' && <>
                  {fv('tokenUrl',     'Token URL')}
                  {fv('clientId',     'Client ID')}
                  {fp('clientSecret', 'Client Secret')}
                  {fv('tokenScope',   'Scope')}
                </>}
              </div>
              <div className="eai-form-section">
                <h4>요청 / 응답 설정</h4>
                <div className="modal-field">
                  <label>요청 헤더 (JSON)</label>
                  <textarea rows={2} value={form.requestHeaders ?? ''}
                    placeholder='[{"key":"X-Tenant","value":"T001"}]'
                    onChange={e => setForm(f => ({ ...f, requestHeaders: e.target.value }))} />
                </div>
                <div className="modal-field">
                  <label>요청 바디 템플릿</label>
                  <textarea rows={4} value={form.requestTemplate ?? ''}
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
