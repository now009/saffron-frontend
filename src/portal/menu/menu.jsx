import { useState, useEffect } from 'react'
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
  { key: 'menuNameTree', label: '메뉴명',        width: '240px' },
  { key: 'programId',    label: '프로그램 ID',   width: '120px' },
  { key: 'programName',  label: '프로그램명',    width: '160px' },
  { key: 'programUrl',   label: '프로그램 URI',  width: '220px' },
  { key: 'useYn',        label: '메뉴사용여부',  width: '100px' },
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
    return <span className={`grid-badge ${value === 'Y' ? 'on' : 'off'}`}>{value === 'Y' ? '사용' : '미사용'}</span>
  }
  return <>{value ?? '-'}</>
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
  const [error, setError]     = useState(null)

  const [searchField, setSearchField] = useState(SEARCH_FIELDS[0].value)
  const [searchInput, setSearchInput] = useState('')

  const [currentPage, setCurrentPage] = useState(1)

  const fetchData = async (field = '', keyword = '') => {
    setLoading(true)
    setError(null)
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
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchData(searchField, searchInput)
  }

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
                    {COLUMNS.map((col) => <th key={col.key}>{col.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={COLUMNS.length} className="grid-loading">데이터를 불러오는 중...</td></tr>
                  ) : error ? (
                    <tr><td colSpan={COLUMNS.length} className="grid-error">오류: {error}</td></tr>
                  ) : pageRows.length === 0 ? (
                    <tr><td colSpan={COLUMNS.length} className="grid-empty">
                      {searchInput ? '검색 결과가 없습니다.' : '데이터가 없습니다.'}
                    </td></tr>
                  ) : (
                    pageRows.map((row, idx) => (
                      <tr key={row.menuId ?? idx}>
                        {COLUMNS.map((col) => (
                          <td key={col.key}>
                            {col.key === 'menuNameTree'
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
    </div>
  )
}

export default Menu
