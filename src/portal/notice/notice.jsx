// ============================================================
// 공지사항 목록 — 권한별 접근 (관리자만 등록/수정 버튼 노출)
// 라우트: /portal/notices/list
// 정렬 우선순위: 고정공지 → 등록일 역순 (백엔드 정렬 기준)
// 작성/수정/삭제 동작은 noticeView.jsx (상세/편집)
// ============================================================
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiUri from '../../api/apiUri'
import serverConfig from '../../config/serverConfig'
import '../common/css/grid.css'

const PAGE_SIZE = 10

const SEARCH_FIELDS = [
  { value: 'title',   label: '제목' },
  { value: 'content', label: '내용' },
]

const COLUMNS = [
  { key: 'noticeId',    label: '번호',   width: '120px' },
  { key: 'noticeType',  label: '유형',   width: '90px'  },
  { key: 'isPinned',    label: '고정',   width: '70px'  },
  { key: 'title',       label: '제목',   width: 'auto'  },
  { key: 'createdUser', label: '작성자', width: '110px' },
  { key: 'createdDate', label: '등록일', width: '120px' },
  { key: 'viewCount',   label: '조회',   width: '70px'  },
]

const TYPE_LABEL = { NORMAL: '일반', IMPORTANT: '중요', POPUP: '팝업' }
const TYPE_BADGE = { NORMAL: 'off', IMPORTANT: 'level1', POPUP: 'level2' }

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

function Notice() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const [searchField, setSearchField] = useState(SEARCH_FIELDS[0].value)
  const [searchInput, setSearchInput] = useState('')
  const [applied, setApplied]         = useState({ field: SEARCH_FIELDS[0].value, keyword: '' })
  const [currentPage, setCurrentPage] = useState(1)

  // 관리자 여부 — 등록 버튼·작성자 컬럼 표시 등 권한별 UI 분기에 사용
  const isAdmin = serverConfig.token.isAdmin()

  const fetchData = async (field = '', keyword = '') => {
    setLoading(true)
    try {
      const body = {}
      if (keyword) body[field] = keyword
      const res = await fetch(apiUri.notice.list(), {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`)
      const data = await res.json()
      setRows(Array.isArray(data) ? data : (data.list ?? data.content ?? data.data ?? []))
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSearch = () => {
    const kw = searchInput.trim()
    setCurrentPage(1)
    setApplied({ field: searchField, keyword: kw })
    fetchData(searchField, kw)
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageRows   = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="content-area">
      <div className="content-body">
        <div className="grid-container">
          <div className="grid-toolbar">
            <span className="grid-title">공지사항</span>
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
              {isAdmin && (
                <button className="grid-add-btn" onClick={() => navigate('/portal/notices/new')}>
                  + 등록
                </button>
              )}
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
                    <th key={col.key}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={COLUMNS.length} className="grid-loading">데이터를 불러오는 중...</td></tr>
                ) : pageRows.length === 0 ? (
                  <tr><td colSpan={COLUMNS.length} className="grid-empty">
                    {applied.keyword ? '검색 결과가 없습니다.' : '데이터가 없습니다.'}
                  </td></tr>
                ) : (
                  pageRows.map((row) => (
                    <tr key={row.noticeId} onClick={() => navigate(`/portal/notices/${row.noticeId}`)}>
                      <td>{row.noticeId}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`grid-badge ${TYPE_BADGE[row.noticeType] ?? 'off'}`}>
                          {TYPE_LABEL[row.noticeType] ?? row.noticeType ?? '-'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`grid-badge ${row.isPinned === 'Y' ? 'admin' : 'off'}`}>
                          {row.isPinned === 'Y' ? '고정' : '-'}
                        </span>
                      </td>
                      <td>{row.title ?? '-'}</td>
                      <td>{row.createdUser ?? '-'}</td>
                      <td>{row.createdDate ? row.createdDate.slice(0, 10) : '-'}</td>
                      <td style={{ textAlign: 'center' }}>{row.viewCount ?? 0}</td>
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

export default Notice
