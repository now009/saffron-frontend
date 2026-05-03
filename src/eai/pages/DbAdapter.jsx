import { useState, useEffect, useRef } from 'react'
import eaiApi from '../api/eaiApi'
import '../eai.css'

const DB_TYPES   = ['', 'ORACLE', 'MYSQL', 'MARIADB', 'MSSQL', 'POSTGRESQL']
const DIRECTIONS = ['', 'SEND', 'RECEIVE', 'BOTH']

const EMPTY_FORM = {
  dbAdapterId: '', dbType: 'ORACLE', dbName: '', dbIp: '',
  dbPort: '', dbId: '', dbPw: '', direction: 'SEND',
}

/* ── 수정/삭제 액션 드롭다운 ── */
function ActionMenu({ row, onEdit, onDelete }) {
  const [open, setOpen]   = useState(false)
  const [up, setUp]       = useState(false)
  const ref               = useRef(null)
  const btnRef            = useRef(null)

  const toggle = () => {
    if (!open && btnRef.current) {
      const wrap      = btnRef.current.closest('.grid-wrap')
      const bottom    = wrap ? wrap.getBoundingClientRect().bottom : window.innerHeight
      const btnBottom = btnRef.current.getBoundingClientRect().bottom
      setUp(bottom - btnBottom < 100)
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
      <button ref={btnRef} className="action-btn" onClick={toggle}>
        <svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z" /></svg>
      </button>
      {open && (
        <div className={`action-dropdown ${up ? 'up' : ''}`}>
          <button className="action-item edit"   onClick={() => { onEdit(row);   setOpen(false) }}>수정</button>
          <button className="action-item delete" onClick={() => { onDelete(row); setOpen(false) }}>삭제</button>
        </div>
      )}
    </div>
  )
}

/* ── 등록/수정 모달 ── */
function DbAdapterModal({ mode, form: init, onClose, onSave }) {
  const [form, setForm]   = useState(init)
  const [saving, setSaving] = useState(false)
  const isEdit = mode === 'edit'

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.dbAdapterId) { alert('어댑터 ID를 입력하세요'); return }
    if (!form.dbType)      { alert('DB 유형을 선택하세요');  return }
    if (!form.dbName)      { alert('DB명을 입력하세요');     return }
    if (!form.dbIp)        { alert('IP를 입력하세요');       return }
    if (!form.dbPort)      { alert('포트를 입력하세요');     return }
    if (!form.dbId)        { alert('DB 계정을 입력하세요');  return }
    if (!isEdit && !form.dbPw) { alert('비밀번호를 입력하세요'); return }

    setSaving(true)
    try {
      // 수정 시 dbPw가 비어있으면 전송하지 않음 (기존 값 유지)
      const payload = { ...form }
      if (isEdit && !payload.dbPw) delete payload.dbPw
      await onSave(payload)
    } finally {
      setSaving(false)
    }
  }

  const fields = [
    { key: 'dbAdapterId', label: '어댑터 ID',  type: 'text',   readOnly: isEdit },
    { key: 'dbName',      label: 'DB명',       type: 'text'   },
    { key: 'dbIp',        label: 'IP',         type: 'text',   placeholder: '192.168.0.1' },
    { key: 'dbPort',      label: '포트',       type: 'text',   placeholder: '3306' },
    { key: 'dbId',        label: 'DB 계정',    type: 'text'   },
    { key: 'dbPw',        label: isEdit ? '비밀번호 (변경 시만 입력)' : '비밀번호', type: 'password' },
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'DB 어댑터 수정' : 'DB 어댑터 등록'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {/* DB 유형 */}
          <div className="modal-field">
            <label>DB 유형</label>
            <select value={form.dbType} onChange={e => set('dbType', e.target.value)}>
              {DB_TYPES.slice(1).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {/* 방향 */}
          <div className="modal-field">
            <label>방향</label>
            <select value={form.direction} onChange={e => set('direction', e.target.value)}>
              {DIRECTIONS.slice(1).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {/* 나머지 필드 */}
          {fields.map(({ key, label, type, placeholder, readOnly }) => (
            <div className="modal-field" key={key}>
              <label>{label}</label>
              <input
                type={type}
                value={form[key] ?? ''}
                placeholder={placeholder ?? ''}
                readOnly={readOnly}
                onChange={e => set(key, e.target.value)}
                style={readOnly ? { background: '#f8fafc', color: '#94a3b8' } : {}}
              />
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="modal-btn-save" onClick={handleSubmit} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </button>
          <button className="modal-btn-cancel" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  )
}

/* ── 메인 페이지 ── */
function DbAdapter() {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState({ dbType: '', direction: '' })
  const [modal, setModal]     = useState(null)  // null | { mode: 'add'|'edit', form }

  const load = (f = filter) => {
    setLoading(true)
    eaiApi.dbAdapter.list(f)
      .then(data => setList(Array.isArray(data) ? data : (data.content ?? [])))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openAdd  = () => setModal({ mode: 'add',  form: { ...EMPTY_FORM } })
  const openEdit = (row) => setModal({ mode: 'edit', form: { ...row, dbPw: '' } })

  const handleDelete = (row) => {
    if (!window.confirm(`'${row.dbAdapterId}' 어댑터를 삭제하시겠습니까?`)) return
    eaiApi.dbAdapter.delete(row.id)
      .then(() => load())
      .catch(() => alert('삭제 중 오류가 발생했습니다.'))
  }

  const handleSave = async (payload) => {
    try {
      if (modal.mode === 'add') {
        await eaiApi.dbAdapter.create(payload)
      } else {
        await eaiApi.dbAdapter.update(modal.form.id, payload)
      }
      setModal(null)
      load()
    } catch {
      alert('저장 중 오류가 발생했습니다.')
      throw new Error('save failed')
    }
  }

  return (
    <div className="dashboard-area">
      <div className="grid-container">
        <div className="grid-toolbar">
          <span className="grid-title">DB 어댑터 관리</span>
          <div className="grid-toolbar-right">
            <select
              className="grid-search-input"
              value={filter.dbType}
              onChange={e => setFilter(f => ({ ...f, dbType: e.target.value }))}
            >
              <option value="">전체 DB 유형</option>
              {DB_TYPES.slice(1).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              className="grid-search-input"
              value={filter.direction}
              onChange={e => setFilter(f => ({ ...f, direction: e.target.value }))}
            >
              <option value="">전체 방향</option>
              {DIRECTIONS.slice(1).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <button className="grid-search-btn" onClick={() => load(filter)}>검색</button>
            <button className="grid-add-btn" onClick={openAdd}>+ 등록</button>
          </div>
        </div>

        <div className="grid-wrap">
          <table className="grid-table">
            <colgroup>
              <col style={{ width: 60 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 100 }} />
              <col />
              <col style={{ width: 140 }} />
              <col style={{ width: 70 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 48 }} />
            </colgroup>
            <thead>
              <tr>
                <th>ID</th>
                <th>어댑터 ID</th>
                <th>DB 유형</th>
                <th>DB명</th>
                <th>IP</th>
                <th>포트</th>
                <th>DB 계정</th>
                <th>방향</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="grid-loading">로딩 중...</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={9} className="grid-empty">데이터가 없습니다.</td></tr>
              ) : list.map(row => (
                <tr key={row.id}>
                  <td style={{ textAlign: 'center' }}>{row.id}</td>
                  <td>{row.dbAdapterId}</td>
                  <td>{row.dbType}</td>
                  <td>{row.dbName}</td>
                  <td>{row.dbIp}</td>
                  <td style={{ textAlign: 'center' }}>{row.dbPort}</td>
                  <td>{row.dbId}</td>
                  <td style={{ textAlign: 'center' }}>{row.direction}</td>
                  <td>
                    <ActionMenu row={row} onEdit={openEdit} onDelete={handleDelete} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <DbAdapterModal
          mode={modal.mode}
          form={modal.form}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

export default DbAdapter
