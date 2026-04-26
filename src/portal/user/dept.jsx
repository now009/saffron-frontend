import { useState, useEffect, useRef } from 'react'
import apiUri from '../../api/apiUri'
import serverConfig from '../../config/serverConfig'
import '../common/css/grid.css'

const PAGE_SIZE = 10

const SEARCH_FIELDS = [
  { value: 'deptId',   label: '부서 ID',  bodyKey: 'deptId'   },
  { value: 'deptName', label: '부서명',   bodyKey: 'deptName' },
  { value: 'deptCode', label: '부서코드', bodyKey: 'deptCode' },
]

const COLUMNS = [
  { key: 'deptId',       label: '부서 ID',  width: '120px' },
  { key: 'deptNameTree', label: '부서명',   width: '240px' },
  { key: 'deptCode',     label: '부서코드', width: '120px' },
  { key: 'deptLevel',    label: '레벨',     width: '70px'  },
  { key: 'sortOrder',    label: '정렬순서', width: '80px'  },
  { key: 'useYn',        label: '사용',     width: '80px'  },
  { key: '__action',     label: '',         width: '48px'  },
]

function TreeCell({ name, depth }) {
  return (
    <span className="tree-cell">
      {depth > 0 && <span className="tree-indent" style={{ width: depth * 18 + 'px' }} />}
      {depth > 0 && <span className="tree-branch">└─</span>}
      <span className={depth === 0 ? 'tree-root' : 'tree-leaf'}>{name ?? '-'}</span>
    </span>
  )
}

function CellValue({ colKey, value }) {
  if (colKey === 'useYn') {
    return <span className={`grid-badge ${value === 'Y' ? 'on' : 'off'}`}>{value ?? '-'}</span>
  }
  return <>{value ?? '-'}</>
}

function ActionMenu({ row, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className="action-menu" ref={ref}>
      <button className="action-btn" onClick={() => setOpen((v) => !v)}>
        <svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
      </button>
      {open && (
        <div className="action-dropdown">
          <button className="action-item edit" onClick={() => { onEdit(row); setOpen(false) }}>수정</button>
          <button className="action-item delete" onClick={() => { onDelete(row); setOpen(false) }}>삭제</button>
        </div>
      )}
    </div>
  )
}

function DeptModal({ mode, form: initialForm, onClose, onSave }) {
  const [form, setForm]         = useState(initialForm)
  const [parentDepts, setParentDepts] = useState([])
  const isEdit = mode === 'edit'

  useEffect(() => {
    if (!isEdit) {
      fetch(apiUri.dept.nextId(), { headers: serverConfig.token.authHeader() })
        .then((r) => r.json())
        .then((data) => setForm((prev) => ({ ...prev, deptId: data.deptId ?? String(data) })))
        .catch(() => {})
    }
    fetch(apiUri.dept.list(), {
      method: 'POST',
      headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ deptId: '', deptName: '', deptCode: '' }),
    })
      .then((r) => r.json())
      .then((data) => setParentDepts(Array.isArray(data) ? data : data.list ?? []))
      .catch(() => {})
  }, [isEdit])

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }))

  const handleParentChange = (val) => {
    const parent = parentDepts.find((d) => d.deptId === val)
    setForm((prev) => ({
      ...prev,
      parentDeptId: val,
      deptLevel: parent ? (parent.deptLevel ?? 0) + 1 : 1,
    }))
  }

  const handleSubmit = () => {
    if (!form.deptId)   { alert('부서 ID를 입력하세요'); return }
    if (!form.deptCode) { alert('부서코드를 입력하세요'); return }
    if (!form.deptName) { alert('부서명을 입력하세요');  return }
    onSave(form)
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{isEdit ? '부서 수정' : '부서 생성'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-field">
            <label>부서 ID</label>
            <input value={form.deptId} readOnly placeholder={isEdit ? '' : '조회 중...'} />
          </div>
          {!isEdit && (
            <div className="modal-field">
              <label>상위 부서</label>
              <select value={form.parentDeptId} onChange={(e) => handleParentChange(e.target.value)}>
                <option value="">없음 (최상위)</option>
                {parentDepts.map((d) => (
                  <option key={d.deptId} value={d.deptId}>
                    {d.deptNameTree ?? d.deptName} ({d.deptId})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="modal-field">
            <label>부서코드</label>
            <input value={form.deptCode} onChange={(e) => set('deptCode', e.target.value)} placeholder="부서코드" />
          </div>
          <div className="modal-field">
            <label>부서명</label>
            <input value={form.deptName} onChange={(e) => set('deptName', e.target.value)} placeholder="부서명" />
          </div>
          {!isEdit && (
            <div className="modal-field-row">
              <div className="modal-field">
                <label>부서 레벨</label>
                <select value={form.deptLevel} onChange={(e) => set('deptLevel', Number(e.target.value))}>
                  <option value={1}>1 (본부)</option>
                  <option value={2}>2 (부)</option>
                  <option value={3}>3 (팀)</option>
                </select>
              </div>
              <div className="modal-field">
                <label>정렬 순서</label>
                <input
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => set('sortOrder', e.target.value.replace(/\D/g, '') === '' ? 0 : Number(e.target.value.replace(/\D/g, '')))}
                />
              </div>
            </div>
          )}
          {isEdit && (
            <div className="modal-field-row">
              <div className="modal-field">
                <label>부서 레벨</label>
                <select value={form.deptLevel} onChange={(e) => set('deptLevel', Number(e.target.value))}>
                  <option value={1}>1 (본부)</option>
                  <option value={2}>2 (부)</option>
                  <option value={3}>3 (팀)</option>
                </select>
              </div>
              <div className="modal-field">
                <label>정렬 순서</label>
                <input
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => set('sortOrder', e.target.value.replace(/\D/g, '') === '' ? 0 : Number(e.target.value.replace(/\D/g, '')))}
                />
              </div>
            </div>
          )}
          <div className="modal-field">
            <label>사용 여부</label>
            <select value={form.useYn} onChange={(e) => set('useYn', e.target.value)}>
              <option value="Y">Y</option>
              <option value="N">N</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose}>취소</button>
          <button className="modal-btn-save" onClick={handleSubmit}>저장</button>
        </div>
      </div>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
    </svg>
  )
}

function Pagination({ current, total, onChange }) {
  const WINDOW = 5
  let start = Math.max(1, current - Math.floor(WINDOW / 2))
  let end   = Math.min(total, start + WINDOW - 1)
  if (end - start + 1 < WINDOW) start = Math.max(1, end - WINDOW + 1)
  const pages = []
  for (let i = start; i <= end; i++) pages.push(i)
  if (total <= 1) return null
  return (
    <div className="grid-pagination">
      <button className="grid-page-btn" disabled={current === 1} onClick={() => onChange(1)}>«</button>
      <button className="grid-page-btn" disabled={current === 1} onClick={() => onChange(current - 1)}>‹</button>
      {start > 1 && <span className="grid-page-sep">…</span>}
      {pages.map((p) => (
        <button key={p} className={`grid-page-btn ${p === current ? 'active' : ''}`} onClick={() => onChange(p)}>{p}</button>
      ))}
      {end < total && <span className="grid-page-sep">…</span>}
      <button className="grid-page-btn" disabled={current === total} onClick={() => onChange(current + 1)}>›</button>
      <button className="grid-page-btn" disabled={current === total} onClick={() => onChange(total)}>»</button>
    </div>
  )
}

function Dept() {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)

  const [searchField, setSearchField] = useState(SEARCH_FIELDS[0].value)
  const [searchInput, setSearchInput] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const fetchData = async (field = '', keyword = '') => {
    setLoading(true)
    try {
      const bodyKey = SEARCH_FIELDS.find((f) => f.value === field)?.bodyKey ?? field
      const body = { deptId: '', deptName: '', deptCode: '' }
      if (keyword && bodyKey) body[bodyKey] = keyword

      const res = await fetch(apiUri.dept.list(), {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`)
      const data = await res.json()
      setRows(Array.isArray(data) ? data : data.list ?? data.content ?? [])
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchData(searchField, searchInput)
  }

  const handleEdit = (row) => {
    setModal({
      mode: 'edit',
      form: {
        deptId:    row.deptId    ?? '',
        deptCode:  row.deptCode  ?? '',
        deptName:  row.deptName  ?? '',
        deptLevel: row.deptLevel ?? 1,
        sortOrder: row.sortOrder ?? 0,
        useYn:     row.useYn     ?? 'Y',
      },
    })
  }

  const handleAdd = () => {
    setModal({
      mode: 'add',
      form: { deptId: '', parentDeptId: '', deptCode: '', deptName: '', deptLevel: 1, sortOrder: 0, useYn: 'Y' },
    })
  }

  const handleSave = async (form) => {
    const isEdit = modal.mode === 'edit'
    try {
      const url = isEdit ? apiUri.dept.update() : apiUri.dept.create()
      const res = await fetch(url, {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      setModal(null)
      if (Array.isArray(data)) {
        setRows(data)
        setCurrentPage(1)
      } else if (data.messageCode === 'fail') {
        alert(data.message)
      } else {
        fetchData(searchField, searchInput)
      }
    } catch (err) {
      setModal(null)
      alert(`저장 실패 (${err.message})`)
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm('삭제하시겠습니까?')) return
    try {
      const res = await fetch(apiUri.dept.delete(row.deptId), {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (data.messageCode === 'fail') {
        alert(data.message)
        return
      }
      fetchData(searchField, searchInput)
    } catch (err) {
      alert(`삭제 실패 (${err.message})`)
    }
  }

  const hasChildIds = new Set(rows.map((r) => r.parentDeptId).filter(Boolean))
  const showAction  = (row) => !hasChildIds.has(row.deptId)

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageRows   = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="content-area">
      <div className="content-body">
        <div className="grid-container">
          <div className="grid-toolbar">
            <span className="grid-title">부서관리</span>
            <div className="grid-toolbar-right">
              <span className="grid-count">총 <span>{rows.length}</span>건</span>
              <div className="grid-search-bar">
                <select value={searchField} onChange={(e) => setSearchField(e.target.value)}>
                  {SEARCH_FIELDS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="검색어를 입력하세요"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button className="grid-search-btn" onClick={handleSearch}><SearchIcon /></button>
              </div>
              <button className="grid-add-btn" onClick={handleAdd}>+ Add</button>
            </div>
          </div>

          <div className="grid-wrap" style={{ minHeight: '453px' }}>
            <table className="grid-table">
              <colgroup>
                {COLUMNS.map((col) => <col key={col.key} style={{ width: col.width }} />)}
              </colgroup>
              <thead>
                <tr>
                  {COLUMNS.map((col) => (
                    <th key={col.key} className={col.key === '__action' ? 'action-cell' : ''}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={COLUMNS.length} className="grid-loading">데이터를 불러오는 중...</td></tr>
                ) : pageRows.length === 0 ? (
                  <tr><td colSpan={COLUMNS.length} className="grid-empty">
                    {searchInput ? '검색 결과가 없습니다.' : '데이터가 없습니다.'}
                  </td></tr>
                ) : (
                  pageRows.map((row, idx) => (
                    <tr key={row.deptId ?? idx}>
                      {COLUMNS.map((col) => (
                        <td key={col.key} className={col.key === '__action' ? 'action-cell' : ''}>
                          {col.key === '__action'
                            ? (showAction(row) && <ActionMenu row={row} onEdit={handleEdit} onDelete={handleDelete} />)
                            : col.key === 'deptNameTree'
                            ? <TreeCell name={row.deptNameTree} depth={row.depth ?? 0} />
                            : <CellValue colKey={col.key} value={row[col.key]} />
                          }
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
        </div>
      </div>
      {modal && (
        <DeptModal
          mode={modal.mode}
          form={modal.form}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

export default Dept
