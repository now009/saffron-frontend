import { useState, useEffect, useRef } from 'react'
import apiUri from '../../api/apiUri'
import serverConfig from '../../config/serverConfig'
import '../common/css/grid.css'

const PAGE_SIZE = 15

const SEARCH_FIELDS = [
  { value: 'code',     label: '코드',   bodyKey: 'code'     },
  { value: 'codeName', label: '코드명', bodyKey: 'codeName' },
]

const COLUMNS = [
  { key: 'code',       label: '코드',   width: '180px' },
  { key: '__codeName', label: '코드명', width: '400px' },
  { key: 'useYn',      label: '사용',   width: '80px'  },
  { key: '__action',    label: '',       width: '48px'  },
]

function flattenTree(nodes, depth = 0, parentCode = '') {
  const result = []
  for (const node of nodes) {
    result.push({ ...node, depth, parentCode: parentCode || node.parentCode || '' })
    if (node.children?.length) {
      result.push(...flattenTree(node.children, depth + 1, node.code))
    }
  }
  return result
}

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
          <button className="action-item edit"   onClick={() => { onEdit(row);   setOpen(false) }}>수정</button>
          <button className="action-item delete" onClick={() => { onDelete(row); setOpen(false) }}>삭제</button>
        </div>
      )}
    </div>
  )
}

function CodeModal({ mode, form: initialForm, parentCodes, onClose, onSave }) {
  const [form, setForm]           = useState(initialForm)
  const [codeStatus, setCodeStatus] = useState(null)
  const isEdit = mode === 'edit'

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }))

  const handleCodeChange = (val) => {
    set('code', val)
    setCodeStatus(null)
  }

  const handleCheckCode = async () => {
    if (!form.code) { alert('코드를 입력하세요'); return false }
    setCodeStatus('checking')
    try {
      const res = await fetch(apiUri.code.checkCode(form.code), {
        headers: serverConfig.token.authHeader(),
      })
      const data = await res.json()
      if (data.messageCode === 'fail') {
        alert(data.message)
        setCodeStatus('taken')
        return false
      } else {
        setCodeStatus('ok')
        return true
      }
    } catch {
      setCodeStatus(null)
      alert('중복 확인 중 오류가 발생했습니다')
      return false
    }
  }

  const handleSubmit = async () => {
    if (!form.code)     { alert('코드를 입력하세요');   return }
    if (!isEdit && codeStatus !== 'ok') {
      const ok = await handleCheckCode()
      if (!ok) return
    }
    if (!form.codeName) { alert('코드명을 입력하세요'); return }
    onSave({ ...form, parentCode: form.parentCode || null })
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{isEdit ? '코드 수정' : '코드 생성'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-field">
            <label>코드</label>
            {isEdit ? (
              <input value={form.code} readOnly />
            ) : (
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div className="modal-input-row">
                  <input
                    value={form.code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="코드"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="modal-lookup-btn"
                    onClick={handleCheckCode}
                    disabled={codeStatus === 'checking'}
                  >확인</button>
                </div>
                {codeStatus === 'ok'       && <span className="id-status ok">사용 가능한 코드입니다</span>}
                {codeStatus === 'taken'    && <span className="id-status taken">이미 사용중인 코드입니다</span>}
                {codeStatus === 'checking' && <span className="id-status checking">확인 중...</span>}
              </div>
            )}
          </div>
          <div className="modal-field">
            <label>코드명</label>
            <input value={form.codeName} onChange={(e) => set('codeName', e.target.value)} placeholder="코드명" autoComplete="off" />
          </div>
          <div className="modal-field">
            <label>상위코드</label>
            <select value={form.parentCode} onChange={(e) => set('parentCode', e.target.value)}>
              <option value="">없음 (최상위)</option>
              {parentCodes.map((p) => (
                <option key={p.code} value={p.code}>{p.codeName} ({p.code})</option>
              ))}
            </select>
          </div>
          <div className="modal-field-row">
            <div className="modal-field">
              <label>정렬 순서</label>
              <input
                type="number"
                min={1}
                value={form.sortOrder}
                onChange={(e) => set('sortOrder', e.target.value.replace(/\D/g, '') === '' ? 1 : Number(e.target.value.replace(/\D/g, '')))}
              />
            </div>
            <div className="modal-field">
              <label>사용 여부</label>
              <select value={form.useYn} onChange={(e) => set('useYn', e.target.value)}>
                <option value="Y">Y</option>
                <option value="N">N</option>
              </select>
            </div>
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

function Code() {
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
      const body = { code: '', codeName: '' }
      if (keyword && bodyKey) body[bodyKey] = keyword

      const res = await fetch(apiUri.code.list(), {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`)
      const data = await res.json()
      const tree = Array.isArray(data) ? data : data.list ?? data.content ?? []
      setRows(flattenTree(tree))
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

  const parentCodes = rows.filter((r) => r.depth === 0)

  const handleEdit = (row) => {
    setModal({
      mode: 'edit',
      form: {
        code:        row.code        ?? '',
        codeName:    row.codeName    ?? '',
        parentCode:  row.parentCode  ?? '',
        description: row.description ?? '',
        sortOrder:   row.sortOrder   ?? 1,
        useYn:       row.useYn       ?? 'Y',
      },
    })
  }

  const handleAdd = () => {
    setModal({
      mode: 'add',
      form: { code: '', codeName: '', parentCode: '', description: '', sortOrder: 1, useYn: 'Y' },
    })
  }

  const handleSave = async (form) => {
    const isEdit = modal.mode === 'edit'
    try {
      const url = isEdit ? apiUri.code.update() : apiUri.code.create()
      const res = await fetch(url, {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      setModal(null)
      if (Array.isArray(data)) {
        setRows(flattenTree(data))
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
      const res = await fetch(apiUri.code.delete(row.code), {
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

  const depth    = (row) => row.depth ?? 0
  const hasChild = new Set(rows.map((r) => r.parentCode).filter(Boolean))
  const showAction = (row) => !hasChild.has(row.code)

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageRows   = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="content-area">
      <div className="content-body">
        <div className="grid-container">
          <div className="grid-toolbar">
            <span className="grid-title">코드관리</span>
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
                    <tr key={row.code ?? idx}>
                      {COLUMNS.map((col) => (
                        <td key={col.key} className={col.key === '__action' ? 'action-cell' : ''}>
                          {col.key === '__action'
                            ? (showAction(row) && <ActionMenu row={row} onEdit={handleEdit} onDelete={handleDelete} />)
                            : col.key === '__codeName'
                            ? <TreeCell name={row.codeName} depth={depth(row)} />
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
        <CodeModal
          mode={modal.mode}
          form={modal.form}
          parentCodes={parentCodes}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

export default Code
