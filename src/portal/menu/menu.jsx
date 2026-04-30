import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import apiUri from '../../api/apiUri'
import serverConfig from '../../config/serverConfig'
import { TOP_MENUS, getCurrentSite } from '../main/menuConfig.js'
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
  { key: 'menuDirYn',    label: '디렉토리',      width: '80px'  },
  { key: 'useYn',        label: '사용',          width: '80px'  },
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
  if (colKey === 'useYn' || colKey === 'menuDirYn') {
    return <span className={`grid-badge ${value === 'Y' ? 'on' : 'off'}`}>{value ?? '-'}</span>
  }
  return <>{value ?? '-'}</>
}

function ActionMenu({ row, onEdit, onDelete, canDelete = true }) {
  const [open, setOpen]     = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const ref    = useRef(null)
  const btnRef = useRef(null)

  const toggle = () => {
    if (!open && btnRef.current) {
      const wrap = btnRef.current.closest('.grid-wrap')
      const bottom    = wrap ? wrap.getBoundingClientRect().bottom : window.innerHeight
      const btnBottom = btnRef.current.getBoundingClientRect().bottom
      setOpenUp(bottom - btnBottom < 110)
    }
    setOpen((v) => !v)
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
        <svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
      </button>
      {open && (
        <div className={`action-dropdown ${openUp ? 'up' : ''}`}>
          <button className="action-item edit" onClick={() => { onEdit(row); setOpen(false) }}>수정</button>
          {canDelete && (
            <button className="action-item delete" onClick={() => { onDelete(row); setOpen(false) }}>삭제</button>
          )}
        </div>
      )}
    </div>
  )
}

function ProgramSelectModal({ onClose, onSelect }) {
  const [programs, setPrograms]   = useState([])
  const [loading, setLoading]     = useState(false)
  const [keyword, setKeyword]     = useState('')
  const [selected, setSelected]   = useState(null)

  const fetchPrograms = (programId = '') => {
    setLoading(true)
    setSelected(null)
    fetch(apiUri.program.list(), {
      method: 'POST',
      headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ programId, programName: '', programUrl: '' }),
    })
      .then((r) => r.json())
      .then((data) => setPrograms(Array.isArray(data) ? data : data.list ?? data.content ?? []))
      .catch(() => alert('프로그램 목록 조회 실패'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPrograms() }, [])

  const handleConfirm = () => {
    if (!selected) { alert('프로그램을 선택하세요'); return }
    onSelect(selected)
  }

  return (
    <div className="modal-overlay modal-overlay-top" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">프로그램 목록</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-program-search">
          <div className="grid-search-bar">
            <input
              type="text"
              placeholder="프로그램 ID"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchPrograms(keyword)}
            />
            <button className="grid-search-btn" onClick={() => fetchPrograms(keyword)}>
              <SearchIcon />
            </button>
          </div>
        </div>
        <div className="modal-program-list">
          {loading ? (
            <div className="modal-program-empty">조회 중...</div>
          ) : programs.length === 0 ? (
            <div className="modal-program-empty">데이터가 없습니다.</div>
          ) : (
            <table className="modal-program-table">
              <thead>
                <tr>
                  <th className="radio-cell"></th>
                  <th>프로그램 ID</th>
                  <th>프로그램명</th>
                  <th>프로그램 URL</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((p) => (
                  <tr key={p.programId} className={`modal-program-row${selected?.programId === p.programId ? ' selected' : ''}`} onClick={() => setSelected(p)}>
                    <td className="radio-cell">
                      <input type="radio" readOnly checked={selected?.programId === p.programId} />
                    </td>
                    <td>{p.programId}</td>
                    <td>{p.programName ?? '-'}</td>
                    <td>{p.programUrl ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose}>취소</button>
          <button className="modal-btn-save" onClick={handleConfirm}>선택</button>
        </div>
      </div>
    </div>
  )
}

function MenuModal({ mode, form: initialForm, onClose, onSave }) {
  const [form, setForm]               = useState(initialForm)
  const [parentMenus, setParentMenus] = useState([])
  const [programModal, setProgramModal] = useState(false)
  const isEdit = mode === 'edit'

  useEffect(() => {
    if (!isEdit) {
      fetch(apiUri.menus.nextId(), { headers: serverConfig.token.authHeader() })
        .then((r) => r.json())
        .then((data) => setForm((prev) => ({ ...prev, menuId: data.menuId ?? data.nextId ?? String(data) })))
        .catch(() => {})
    }
    fetch(apiUri.menus.parentMenus(), { headers: serverConfig.token.authHeader() })
      .then((r) => r.json())
      .then((data) => setParentMenus(Array.isArray(data) ? data : data.list ?? []))
      .catch(() => {})
  }, [isEdit])

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  const handleParentChange = (val) => {
    const parent = parentMenus.find((m) => m.menuId === val)
    setForm((prev) => ({
      ...prev,
      parentMenuId: val,
      menuLevel: parent ? (parent.menuLevel ?? 0) + 1 : 1,
    }))
  }

  const handleProgramSelect = (p) => {
    setForm((prev) => ({ ...prev, programId: p.programId ?? '', programUrl: p.programUrl ?? '' }))
    setProgramModal(false)
  }

  const handleSubmit = () => {
    if (!form.menuId)   { alert('메뉴 ID를 입력하세요');  return }
    if (!form.menuName) { alert('메뉴명을 입력하세요');   return }
    if (!isEdit && (form.menuLevel ?? 1) > 1 && !form.parentMenuId) { alert('상위메뉴를 선택하세요'); return }
    if (form.menuDirYn !== 'Y' && !form.programId) { alert('프로그램 ID를 입력하세요'); return }
    const payload = form.menuDirYn === 'Y'
      ? { ...form, programId: '', programUrl: '' }
      : form
    onSave(payload)
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
              <label>Site</label>
              <select value={form.site ?? ''} onChange={(e) => set('site', e.target.value)}>
                {TOP_MENUS.map((m) => (
                  <option key={m.label} value={m.label.toLowerCase()}>{m.label}</option>
                ))}
              </select>
            </div>
          )}
          {(!isEdit || (form.menuLevel ?? 1) <= 2) && (
            <div className="modal-field">
              <label>상위 메뉴 ID</label>
              <select value={form.parentMenuId ?? ''} onChange={(e) => handleParentChange(e.target.value)}>
                <option value="">없음 (최상위)</option>
                {parentMenus.filter((m) => m.menuId !== form.menuId).map((m) => (
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
          <div className="modal-field-row">
            <div className="modal-field modal-field-v">
              <label>메뉴 레벨</label>
              <select value={form.menuLevel} onChange={(e) => set('menuLevel', Number(e.target.value))}>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </div>
            <div className="modal-field modal-field-v">
              <label>정렬 순서</label>
              <input
                type="number"
                min={1}
                value={form.sortOrder}
                onChange={(e) => set('sortOrder', e.target.value.replace(/\D/g, '') === '' ? 1 : Number(e.target.value.replace(/\D/g, '')))}
              />
            </div>
            <div className="modal-field modal-field-v">
              <label>디렉토리 여부</label>
              <select value={form.menuDirYn ?? 'N'} onChange={(e) => set('menuDirYn', e.target.value)}>
                <option value="Y">Y</option>
                <option value="N">N</option>
              </select>
            </div>
          </div>
          <div className="modal-field">
            <label>프로그램 ID</label>
            <div className="modal-input-row">
              <input value={form.programId} readOnly disabled={form.menuDirYn === 'Y'} placeholder={form.menuDirYn === 'Y' ? '' : '프로그램을 선택하세요'} />
              <button className="modal-lookup-btn" disabled={form.menuDirYn === 'Y'} onClick={() => setProgramModal(true)}>
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="modal-field">
            <label>프로그램 URL</label>
            <input value={form.programUrl ?? ''} readOnly disabled={form.menuDirYn === 'Y'} placeholder={form.menuDirYn === 'Y' ? '' : '프로그램 선택 시 자동 입력'} />
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
      {programModal && (
        <ProgramSelectModal onClose={() => setProgramModal(false)} onSelect={handleProgramSelect} />
      )}
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
  const location = useLocation()
  const initialSite =
    getCurrentSite(location.pathname) ?? TOP_MENUS[0].label.toLowerCase()

  const [site, setSite]       = useState(initialSite)
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)

  const [searchField, setSearchField] = useState(SEARCH_FIELDS[0].value)
  const [searchInput, setSearchInput] = useState('')

  const [currentPage, setCurrentPage] = useState(1)

  const fetchData = async (field = '', keyword = '', selectedSite = site) => {
    setLoading(true)
    try {
      const queryParam = SEARCH_FIELDS.find((f) => f.value === field)?.queryParam ?? field
      const params = new URLSearchParams()
      if (keyword) params.set(queryParam, keyword)
      if (selectedSite) params.set('site', selectedSite)

      const url = params.toString()
        ? `${apiUri.menus.list()}?${params}`
        : apiUri.menus.list()

      const res = await fetch(url, {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ site: selectedSite }),
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

  useEffect(() => { fetchData('', '', site) }, [site])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchData(searchField, searchInput, site)
  }

  const handleSiteChange = (newSite) => {
    setSite(newSite)
    setCurrentPage(1)
    setSearchInput('')
  }

  const handleEdit = (row) => {
    setModal({
      mode: 'edit',
      form: {
        menuId:       row.menuId       ?? '',
        parentMenuId: row.parentMenuId ?? '',
        menuName:     row.menuName     ?? '',
        menuLevel:    row.menuLevel    ?? 1,
        sortOrder:    row.sortOrder    ?? 1,
        menuDirYn:    row.menuDirYn    ?? 'N',
        programId:    row.programId    ?? '',
        programUrl:   row.programUrl   ?? '',
        useYn:        row.useYn        ?? 'Y',
      },
    })
  }

  const handleAdd = () => {
    setModal({
      mode: 'add',
      form: { menuId: '', parentMenuId: '', menuName: '', menuLevel: 1, menuDirYn: 'N', programId: '', programUrl: '', sortOrder: 1, useYn: 'Y', site },
    })
  }

  const handleSave = async (form) => {
    const isEdit = modal.mode === 'edit'
    try {
      const url = isEdit ? apiUri.menus.update() : apiUri.menus.create()
      const res = await fetch(url, {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ site, ...form }),
      })
      const data = await res.json()
      setModal(null)
      if (data.messageCode === 'fail') {
        alert(data.message)
        return
      }
      fetchData(searchField, searchInput, site)
    } catch (err) {
      setModal(null)
      alert(`저장 실패 (${err.message})`)
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm('삭제하시겠습니까?')) return
    try {
      const res = await fetch(apiUri.menus.delete(row.menuId), {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ site }),
      })
      const data = await res.json()
      if (data.messageCode === 'fail') {
        alert(data.message)
        return
      }
      fetchData(searchField, searchInput, site)
    } catch (err) {
      alert(`삭제 실패 (${err.message})`)
    }
  }

  const hasChildIds = new Set(rows.map((r) => r.parentMenuId).filter(Boolean))
  const canDelete   = (row) => !hasChildIds.has(row.menuId)

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageRows   = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="content-area">
      <div className="content-body">
        <div className="grid-container">
            <div className="grid-toolbar">
              <div className="grid-toolbar-left">
                <span className="grid-title">메뉴관리</span>
                <select
                  className="site-select"
                  value={site}
                  onChange={(e) => handleSiteChange(e.target.value)}
                >
                  {TOP_MENUS.map((m) => (
                    <option key={m.label} value={m.label.toLowerCase()}>{m.label}</option>
                  ))}
                </select>
              </div>
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

            <div className="grid-wrap" style={{ minHeight: '453px' }}>
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
                              ? <ActionMenu row={row} onEdit={handleEdit} onDelete={handleDelete} canDelete={canDelete(row)} />
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
