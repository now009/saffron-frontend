// ============================================================
// DataSource 관리 — DB 어댑터가 참조하는 JDBC 연결 마스터
// 라우트: /eai/datasources
// 주요 기능: CRUD + Connection Test (실제 DB에 쿼리 발송하여 연결 검증)
// 필수 검증: 기본정보 8개 + 풀설정 4개 — 저장/Connection Test 모두 동일한 validate() 통과 필요
// ============================================================
import { useEffect, useRef, useState } from 'react'
import eaiApi, { handleEaiResponse } from '../../api/eaiApi'
import '../../eai.css'

// ─── 행별 수정/삭제 드롭다운 메뉴 (그리드 마지막 컬럼) ───
// 그리드 하단 근처에서 열릴 때 드롭다운이 잘리지 않도록 위/아래 자동 전환
function ActionMenu({ row, onEdit, onDelete }) {
  const [open, setOpen]     = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const ref    = useRef(null)
  const btnRef = useRef(null)

  // 드롭다운 높이가 약 110px이므로 그리드 하단까지 여유 없으면 위쪽으로 펼침
  const toggle = () => {
    if (!open && btnRef.current) {
      const wrap      = btnRef.current.closest('.grid-wrap')
      const bottom    = wrap ? wrap.getBoundingClientRect().bottom : window.innerHeight
      const btnBottom = btnRef.current.getBoundingClientRect().bottom
      setOpenUp(bottom - btnBottom < 110)
    }
    setOpen(v => !v)
  }

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className="action-menu" ref={ref}>
      <button ref={btnRef} className="action-btn" onClick={e => { e.stopPropagation(); toggle() }}>
        <svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
      </button>
      {open && (
        <div className={`action-dropdown ${openUp ? 'up' : ''}`}>
          <button className="action-item edit"   onClick={() => { onEdit(row);   setOpen(false) }}>수정</button>
          <button className="action-item delete" onClick={() => { onDelete(row); setOpen(false) }}>삭제</button>
        </div>
      )}
    </div>
  )
}

const DB_TYPES = ['POSTGRESQL', 'ORACLE', 'MSSQL', 'MYSQL', 'MARIADB', 'H2']

const defaultForm = {
  datasourceId: '', datasourceName: '', dbType: 'MARIADB', jdbcUrl: '', dbUsername: '',
  dbPassword: '', driverClass: '', poolMinSize: 5, poolMaxSize: 20, poolTimeoutMs: 30000,
  queryTimeoutSec: 30, defaultSchema: '', connectionProps: '', isActive: true, description: '',
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M10 18a7.952 7.952 0 004.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A8 8 0 1010 18zm0-14a6 6 0 110 12A6 6 0 0110 4z" />
    </svg>
  )
}

// 필수 입력 필드 정의 — key는 form 키, value는 한국어 라벨(에러 메시지에 그대로 사용)
const REQUIRED_FIELDS = {
  datasourceId:    'DataSource ID',
  datasourceName:  'DataSource명',
  jdbcUrl:         'JDBC URL',
  dbUsername:      'DB 사용자명',
  dbPassword:      'DB 비밀번호',
  driverClass:     'Driver Class',
  poolMinSize:     '최소 풀 크기',
  poolMaxSize:     '최대 풀 크기',
  poolTimeoutMs:   '연결 대기 타임아웃',
  queryTimeoutSec: '쿼리 타임아웃',
}

const isEmpty = (v) =>
  v === '' || v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v))

function Datasource() {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState({ dbType: '', isActive: '' })
  const [modal, setModal]     = useState(null)
  const [form, setForm]       = useState(defaultForm)
  const [saving, setSaving]   = useState(false)
  const [testing, setTesting]       = useState(false)
  const [testResult, setTestResult] = useState(null)

  const load = () => {
    setLoading(true)
    eaiApi.datasource.list(filter)
      .then(data => setList(Array.isArray(data) ? data : (data.content ?? [])))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openNew  = () => { setForm(defaultForm); setTestResult(null); setModal('new') }
  const openEdit = (item) => { setForm({ ...defaultForm, ...item }); setTestResult(null); setModal('edit') }
  const closeModal = () => { setModal(null); setTestResult(null) }

  const validate = () => {
    for (const [key, label] of Object.entries(REQUIRED_FIELDS)) {
      if (isEmpty(form[key])) return `${label} 항목은 필수입니다.`
    }
    return null
  }

  const handleSave = async () => {
    const err = validate()
    if (err) { alert(err); return }
    setSaving(true)
    try {
      const res = modal === 'edit'
        ? await eaiApi.datasource.update(form.id, form)
        : await eaiApi.datasource.create(form)
      if (!handleEaiResponse(res)) return
      closeModal(); load()
    } catch { alert('저장 중 오류가 발생했습니다.') }
    finally { setSaving(false) }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`DataSource [${item.datasourceId}]를 삭제하시겠습니까?`)) return
    try {
      const res = await eaiApi.datasource.delete(item.id)
      if (!handleEaiResponse(res)) return
      load()
    } catch { alert('삭제 중 오류가 발생했습니다.') }
  }

  // Connection Test — 저장 없이 현재 폼 값으로 백엔드가 실제 DB에 쿼리(SELECT 1 등) 발송.
  // 응답 형식은 { success | ok, message } 두 형태 모두 호환되도록 처리.
  const handleConnectionTest = async () => {
    const err = validate()
    if (err) { setTestResult({ ok: false, msg: err }); return }
    setTesting(true)
    setTestResult(null)
    try {
      // Connection Test는 success가 "연결 성공/실패"의 정상 결과이므로
      // alert 없이 인라인으로 결과만 표시 (handleEaiResponse 미사용)
      const res = await eaiApi.datasource.test(form)
      const ok  = res?.success === true
      const msg = res?.message ?? (ok ? '연결 성공' : '연결 실패')
      setTestResult({ ok, msg })
    } catch {
      setTestResult({ ok: false, msg: '연결 테스트 중 오류가 발생했습니다.' })
    } finally {
      setTesting(false)
    }
  }

  // 텍스트/비밀번호 필드 빌더 — req=true 시 라벨에 'req' 클래스 추가(빨간 별표 자동 부착)
  const f = (key, label, type = 'text', placeholder = '', req = false) => (
    <div className="modal-field" key={key}>
      <label className={req ? 'req' : ''}>{label}</label>
      <input type={type} value={form[key] ?? ''} placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
    </div>
  )

  // 숫자 필드 빌더 — Number() 변환으로 form에 number 타입 보장 (풀 사이즈/타임아웃)
  const fi = (key, label, req = false) => (
    <div className="modal-field" key={key}>
      <label className={req ? 'req' : ''}>{label}</label>
      <input type="number" value={form[key] ?? ''} style={{ width: 100 }}
        onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))} />
    </div>
  )

  return (
    <div className="content-area">
      <div className="content-body">
        <div className="grid-container">
          <div className="grid-toolbar">
            <div className="grid-toolbar-left">
              <span className="grid-title">DataSource 관리</span>
            </div>
            <div className="grid-toolbar-right">
              <select className="site-select" value={filter.dbType}
                onChange={e => setFilter(f => ({ ...f, dbType: e.target.value }))}>
                <option value="">전체 DB유형</option>
                {DB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select className="site-select" value={filter.isActive}
                onChange={e => setFilter(f => ({ ...f, isActive: e.target.value }))}>
                <option value="">전체 상태</option>
                <option value="true">활성</option>
                <option value="false">비활성</option>
              </select>
              <button className="grid-search-btn" onClick={load} style={{ borderRadius: 8, padding: '7px 12px' }}>
                <SearchIcon />
              </button>
              <button className="grid-add-btn" onClick={openNew}>+ 등록</button>
            </div>
          </div>

          <div className="grid-wrap">
            <table className="grid-table">
              <colgroup>
                <col style={{ width: 130 }} />
                <col />
                <col style={{ width: 100 }} />
                <col style={{ width: 280 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 60 }} />
                <col style={{ width: 48 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>DataSource ID</th>
                  <th>DataSource명</th>
                  <th>DB유형</th>
                  <th>JDBC URL</th>
                  <th>사용자명</th>
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
                    <td>{item.datasourceId}</td>
                    <td>{item.datasourceName}</td>
                    <td>{item.dbType}</td>
                    <td className="eai-cell-mute">{item.jdbcUrl}</td>
                    <td>{item.dbUsername}</td>
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

      {/* ─── 등록/수정 모달 — 좌: 기본정보 + Connection Test, 우: 풀설정 + 추가설정 ─── */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" style={{ width: 920 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{modal === 'edit' ? 'DataSource 수정' : 'DataSource 등록'}</span>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="eai-modal-grid">
                <div className="eai-modal-col">
                  <div className="eai-form-section">
                    <h4>기본 정보</h4>
                    {f('datasourceId',   'DataSource ID', 'text', 'DS_ERP', true)}
                    {f('datasourceName', 'DataSource명',  'text', '',       true)}
                    <div className="modal-field">
                      <label className="req">DB 유형</label>
                      <select value={form.dbType} onChange={e => setForm(f => ({ ...f, dbType: e.target.value }))}>
                        {DB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    {f('jdbcUrl',       'JDBC URL',     'text',     'jdbc:mariadb://host:3306/dbname', true)}
                    {f('dbUsername',    'DB 사용자명',   'text',     '',                                true)}
                    {f('dbPassword',    'DB 비밀번호',   'password', '',                                true)}
                    {f('driverClass',   'Driver Class', 'text',     'org.mariadb.jdbc.Driver',         true)}
                    {f('defaultSchema', '기본 스키마')}
                  </div>
                  <div className="eai-test-row">
                    <button type="button" className="eai-test-btn" onClick={handleConnectionTest} disabled={testing}>
                      {testing ? '테스트 중...' : 'Connection Test'}
                    </button>
                    {testResult && (
                      <span className={`eai-test-result ${testResult.ok ? 'ok' : 'err'}`}>
                        {testResult.ok ? '✓' : '✕'} {testResult.msg}
                      </span>
                    )}
                  </div>
                </div>
                <div className="eai-modal-col">
                  <div className="eai-form-section wide-label">
                    <h4>풀 설정</h4>
                    {fi('poolMinSize',     '최소 풀 크기',         true)}
                    {fi('poolMaxSize',     '최대 풀 크기',         true)}
                    {fi('poolTimeoutMs',   '연결 대기 타임아웃(ms)', true)}
                    {fi('queryTimeoutSec', '쿼리 타임아웃(초)',     true)}
                  </div>
                  <div className="eai-form-section">
                    <h4>추가 설정</h4>
                    <div className="modal-field modal-field-v">
                      <label>추가 JDBC 속성 (JSON)</label>
                      <textarea rows={3} value={form.connectionProps ?? ''}
                        onChange={e => setForm(f => ({ ...f, connectionProps: e.target.value }))} />
                    </div>
                    <div className="modal-field modal-field-v">
                      <label>설명</label>
                      <textarea rows={2} value={form.description ?? ''}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
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

export default Datasource
