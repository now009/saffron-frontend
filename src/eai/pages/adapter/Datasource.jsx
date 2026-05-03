import { useEffect, useRef, useState } from 'react'
import eaiApi from '../../api/eaiApi'
import '../../eai.css'

function ActionMenu({ row, onEdit, onDelete }) {
  const [open, setOpen]     = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const ref    = useRef(null)
  const btnRef = useRef(null)

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

function Datasource() {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState({ dbType: '', isActive: '' })
  const [modal, setModal]     = useState(null)
  const [form, setForm]       = useState(defaultForm)
  const [saving, setSaving]   = useState(false)

  const load = () => {
    setLoading(true)
    eaiApi.datasource.list(filter)
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
      if (modal === 'edit') await eaiApi.datasource.update(form.id, form)
      else                  await eaiApi.datasource.create(form)
      closeModal(); load()
    } catch { alert('저장 중 오류가 발생했습니다.') }
    finally { setSaving(false) }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`DataSource [${item.datasourceId}]를 삭제하시겠습니까?`)) return
    await eaiApi.datasource.delete(item.id).catch(() => alert('삭제 중 오류가 발생했습니다.'))
    load()
  }

  const f = (key, label, type = 'text', placeholder = '') => (
    <div className="modal-field" key={key}>
      <label>{label}</label>
      <input type={type} value={form[key] ?? ''} placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
    </div>
  )

  const fi = (key, label) => (
    <div className="modal-field" key={key}>
      <label>{label}</label>
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
                    <td style={{ fontSize: 12, color: '#6b7280' }}>{item.jdbcUrl}</td>
                    <td>{item.dbUsername}</td>
                    <td style={{ textAlign: 'center' }}>
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

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" style={{ width: 880 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>{modal === 'edit' ? 'DataSource 수정' : 'DataSource 등록'}</span>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="eai-form-section">
                  <h4>기본 정보</h4>
                  {f('datasourceId',   'DataSource ID', 'text', 'DS_ERP')}
                  {f('datasourceName', 'DataSource명')}
                  <div className="modal-field">
                    <label>DB 유형</label>
                    <select value={form.dbType} onChange={e => setForm(f => ({ ...f, dbType: e.target.value }))}>
                      {DB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  {f('jdbcUrl',       'JDBC URL',     'text', 'jdbc:mariadb://host:3306/dbname')}
                  {f('dbUsername',    'DB 사용자명')}
                  {f('dbPassword',    'DB 비밀번호',   'password')}
                  {f('driverClass',   'Driver Class', 'text', 'org.mariadb.jdbc.Driver')}
                  {f('defaultSchema', '기본 스키마')}
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="eai-form-section">
                  <h4>풀 설정</h4>
                  {fi('poolMinSize',     '최소 풀 크기')}
                  {fi('poolMaxSize',     '최대 풀 크기')}
                  {fi('poolTimeoutMs',   '연결 대기 타임아웃(ms)')}
                  {fi('queryTimeoutSec', '쿼리 타임아웃(초)')}
                </div>
                <div className="eai-form-section">
                  <h4>추가 설정</h4>
                  <div className="modal-field">
                    <label>추가 JDBC 속성 (JSON)</label>
                    <textarea rows={3} value={form.connectionProps ?? ''}
                      onChange={e => setForm(f => ({ ...f, connectionProps: e.target.value }))} />
                  </div>
                  <div className="modal-field">
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
