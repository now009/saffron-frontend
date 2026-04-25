import { useState, useEffect, useRef } from 'react'
import apiUri from '../../api/apiUri'
import serverConfig from '../../config/serverConfig'
import '../common/css/grid.css'

const PAGE_SIZE = 10

const SEARCH_FIELDS = [
  { value: 'menuId',   label: '메뉴 ID', queryParam: 'menuId'   },
  { value: 'menuName', label: '메뉴명',  queryParam: 'menuName' },
]

const COLUMNS = [
  { key: 'menuId',       label: '메뉴 ID',      width: '120px' },
  { key: 'menuNameTree', label: '메뉴명',        width: '220px' },
  { key: 'programId',    label: '프로그램 ID',   width: '120px' },
  { key: 'programName',  label: '프로그램명',    width: '150px' },
  { key: 'programUrl',   label: '프로그램 URI',  width: '200px' },
  { key: 'useYn',        label: '메뉴사용여부',  width: '100px' },
  { key: '__action',     label: '',             width: '48px'  },
]

function TreeCell({ name, depth }) {
  return (
    <span className="tree-cell">
      {depth > 0 && (
        <span className="tree-indent" style={{ width: depth * 18 + 'px' }} />
      )}
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

function MenuModal({ mode, form: initialForm, onClose, onSave }) {
  const [form, setForm]           = useState(initialForm)
  const [parentMenus, setParentMenus] = useState([])
  const isEdit = mode === 'edit'

  useEffect(() => {
    if (isEdit) return
    fetch(apiUri.menus.nextId(), { headers: serverConfig.token.authHeader() })
      .then((r) => r.json())
      .then((data) => setForm((prev) => ({ ...prev, menuId: data.menuId ?? data.nextId ?? String(data) })))
      .catch(() => {})
    fetch(apiUri.menus.parentMenus(), { headers: serverConfig.token.authHeader() })
      .then((r) => r.json())
      .then((data) => setParentMenus(Array.isArray(data) ? data : data.list ?? []))
      .catch(() => {})
  }, [isEdit])

  const set = (key, val) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val }
      if (key === 'parentMenuId') next.menuLevel = val ? (prev.menuLevel || 1) : 0
      return next
    })
  }

  const handleSubmit = () => {
    if (!form.menuId)    { alert('메뉴 ID를 입력하세요');     return }
    if (!form.menuName)  { alert('메뉴명을 입력하세요');      return }
    if (!form.programId) { alert('프로그램 ID를 입력하세요'); return }
    onSave(form)
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{isEdit ? '메뉴 수정' : '메뉴 생성'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-field">
            <label>메뉴 ID</label>
            <input value={form.menuId} readOnly placeholder="조회 중..." />
          </div>
          {!isEdit && (
            <div className="modal-field">
              <label>상위 메뉴 ID</label>
              <select value={form.parentMenuId} onChange={(e) => set('parentMenuId', e.target.value)}>
                <option value="">없음 (최상위)</option>
                {parentMenus.map((m) => (
                  <option key={m.menuId} value={m.menuId}>
                    {m.menuNameTree ?? m.menuName} ({m.menuId})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="modal-field">
            <label>메뉴명</label>
            <input value={form.menuName} onChange={(e) => set('menuName', e.target.value)} placeholder="메뉴명" />
          </div>
          {!isEdit && (
            <div className="modal-field-row">
              <div className="modal-field">
                <label>메뉴 레벨</label>
                <select value={form.menuLevel} onChange={(e) => set('menuLevel', Number(e.target.value))}>
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                </select>
              </div>
              <div className="modal-field">
                <label>정렬 순서</label>
                <select value={form.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))}>
                  {Array.from({ length: 21 }, (_, i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <div className="modal-field">
            <label>프로그램 ID</label>
            <input value={form.programId} onChange={(e) => set('programId', e.target.value)} placeholder="프로그램 ID" />
          </div>
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
        <button key={p} className={`grid-page-btn ${p === current ? 'active' : ''}`} onClick={() => onChange(p)}>
          {p}
        </button>
      ))}
      {end < total && <span className="grid-page-sep">…</span>}
      <button className="grid-page-btn" disabled={current === total} onClick={() => onChange(current + 1)}>›</button>
      <button className="grid-page-btn" disabled={current === total} onClick={() => onChange(total)}>»</button>
    </div>
  )
}

function Menu() {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)

  const [searchField, setSearchField] = useState(SEARCH_FIELDS[0].value)
  const [searchInput, setSearchInput] = useState('')

  const [currentPage, setCurrentPage] = useState(1)

  const fetchData = async (field = '', keyword = '') => {
    setLoading(true)
    try {
      const queryParam = SEARCH_FIELDS.find((f) => f.value === field)?.queryParam ?? field
      const params = new URLSearchParams()
      if (keyword) params.set(queryParam, keyword)

      const url = params.toString()
        ? `${apiUri.menus.list()}?${params}`
        : apiUri.menus.list()

      const res = await fetch(url, {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
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
      form: { menuId: row.menuId ?? '', menuName: row.menuName ?? '', programId: row.programId ?? '', useYn: row.useYn ?? 'Y' },
    })
  }

  const handleAdd = () => {
    setModal({
      mode: 'add',
      form: { menuId: '', parentMenuId: '', menuName: '', menuLevel: 0, programId: '', sortOrder: 0, useYn: 'Y' },
    })
  }

  const handleSave = async (form) => {
    const isEdit = modal.mode === 'edit'
    try {
      const url = isEdit ? apiUri.menus.update() : apiUri.menus.create()
      const res = await fetch(url, {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.messageCode === 'fail') {
        alert(data.message)
        return
      }
      setModal(null)
      fetchData(searchField, searchInput)
    } catch (err) {
      alert(`저장 실패 (${err.message})`)
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm('삭제하시겠습니까?')) return
    try {
      const res = await fetch(apiUri.menus.delete(row.menuId), {
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

  const hasChildIds = new Set(rows.map((r) => r.parentMenuId).filter(Boolean))
  const showAction  = (row) => !hasChildIds.has(row.menuId)

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageRows   = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="content-area">
      <div className="content-body">
        <div className="grid-container">
            <div className="grid-toolbar">
              <span className="grid-title">메뉴관리</span>
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
                  <button className="grid-search-btn" onClick={handleSearch}>
                    <SearchIcon />
                  </button>
                </div>
                <button className="grid-add-btn" onClick={handleAdd}>+ Add</button>
              </div>
            </div>

            <div className="grid-wrap">
              <table className="grid-table">
                <colgroup>
                  {COLUMNS.map((col) => (
                    <col key={col.key} style={{ width: col.width }} />
                  ))}
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
                      <tr key={row.menuId ?? idx}>
                        {COLUMNS.map((col) => (
                          <td key={col.key} className={col.key === '__action' ? 'action-cell' : ''}>
                            {col.key === '__action'
                              ? (showAction(row) && <ActionMenu row={row} onEdit={handleEdit} onDelete={handleDelete} />)
                              : col.key === 'menuNameTree'
                              ? <TreeCell name={row.menuNameTree} depth={row.depth ?? 0} />
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
        <MenuModal
          mode={modal.mode}
          form={modal.form}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

export default Menu
