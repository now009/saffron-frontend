import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import apiUri from '../../api/apiUri'
import serverConfig from '../../config/serverConfig'
import '../common/css/grid.css'
import './board.css'

const PAGE_SIZE = 10

const SEARCH_FIELDS = [
  { value: 'title',       label: '제목'   },
  { value: 'content',     label: '내용'   },
  { value: 'createdUser', label: '작성자' },
]

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
    </svg>
  )
}

function isNew(createdDate, days = 3) {
  if (!createdDate) return false
  const d = new Date(String(createdDate).replace(' ', 'T'))
  if (isNaN(d.getTime())) return false
  return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24) <= days
}

function canWrite(board, isAdmin) {
  const role = String(board?.writeRole ?? 'USER').toUpperCase()
  if (role === 'ALL')   return true
  if (role === 'USER')  return true
  if (role === 'ADMIN') return isAdmin
  return false
}

function Post() {
  const navigate = useNavigate()
  const { boardId } = useParams()
  const user = serverConfig.token.payload()
  const isAdmin = serverConfig.token.isAdmin()
  const currentUser = user?.userId ?? user?.sub ?? ''

  const [board, setBoard]     = useState(null)
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)

  const [searchField, setSearchField] = useState(SEARCH_FIELDS[0].value)
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage]               = useState(1)

  useEffect(() => {
    fetch(apiUri.board.detail(boardId), { headers: serverConfig.token.authHeader() })
      .then((r) => r.json())
      .then((data) => setBoard(data?.data ?? data))
      .catch(() => {})
  }, [boardId])

  const fetchData = async (extra = {}) => {
    setLoading(true)
    try {
      const body = { boardId, currentUser, ...extra }
      const res  = await fetch(apiUri.post.list(), {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      const list = Array.isArray(data) ? data : (data.list ?? data.content ?? data.data ?? [])
      setRows(list)
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [boardId])

  const handleSearch = () => {
    setPage(1)
    const kw = searchInput.trim()
    fetchData(kw ? { [searchField]: kw } : {})
  }

  // sort: pinned first, then by createdDate desc (server may already sort, but ensure)
  const sorted = [...rows].sort((a, b) => {
    const ap = a.isPinned === 'Y' ? 1 : 0
    const bp = b.isPinned === 'Y' ? 1 : 0
    if (ap !== bp) return bp - ap
    const ad = new Date(String(a.createdDate ?? '').replace(' ', 'T')).getTime() || 0
    const bd = new Date(String(b.createdDate ?? '').replace(' ', 'T')).getTime() || 0
    return bd - ad
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const pageRows   = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const writable = canWrite(board, isAdmin)
  const newDays  = board?.newDays ?? 3

  return (
    <div className="content-area">
      <div className="content-body">
        <div className="grid-container">
          <div className="grid-toolbar">
            <span className="grid-title">{board?.boardName ?? '게시판'}</span>
            <div className="grid-toolbar-right">
              <span className="grid-count">총 <span>{rows.length}</span>건</span>
              <div className="grid-search-bar">
                <select value={searchField} onChange={(e) => setSearchField(e.target.value)}>
                  {SEARCH_FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
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
              <button className="grid-add-btn" onClick={() => navigate('/portal/boards/list')}>← 게시판 목록</button>
              {writable && (
                <button className="grid-add-btn" onClick={() => navigate(`/portal/boards/${boardId}/write`)}>+ 글쓰기</button>
              )}
            </div>
          </div>

          {board?.description && (
            <div className="board-desc">{board.description}</div>
          )}

          <div className="grid-wrap" style={{ minHeight: '400px' }}>
            <table className="grid-table">
              <colgroup>
                <col style={{ width: '60px'  }} />
                <col />
                <col style={{ width: '110px' }} />
                <col style={{ width: '110px' }} />
                <col style={{ width: '70px'  }} />
                <col style={{ width: '70px'  }} />
                <col style={{ width: '70px'  }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ textAlign: 'center' }}>번호</th>
                  <th>제목</th>
                  <th>작성자</th>
                  <th>작성일</th>
                  <th style={{ textAlign: 'center' }}>조회</th>
                  <th style={{ textAlign: 'center' }}>좋아요</th>
                  <th style={{ textAlign: 'center' }}>댓글</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="grid-loading">데이터를 불러오는 중...</td></tr>
                ) : pageRows.length === 0 ? (
                  <tr><td colSpan={7} className="grid-empty">게시글이 없습니다.</td></tr>
                ) : pageRows.map((row, i) => {
                  const idx = (page - 1) * PAGE_SIZE + i + 1
                  return (
                    <tr key={row.postId} onClick={() => navigate(`/portal/boards/${boardId}/${row.postId}`)}>
                      <td style={{ textAlign: 'center' }}>
                        {row.isPinned === 'Y' ? (
                          <span className="grid-badge admin">고정</span>
                        ) : idx}
                      </td>
                      <td>
                        {row.isSecret === 'Y' && <span className="post-icon-secret" title="비밀글">🔒</span>}
                        {row.depth > 0 && <span className="post-reply">↳ </span>}
                        <span className={row.isPinned === 'Y' ? 'post-title pinned' : 'post-title'}>
                          {row.title}
                        </span>
                        {row.attachCount > 0 && <span className="post-attach-mark" title="첨부">📎</span>}
                        {isNew(row.createdDate, newDays) && <span className="post-new-badge">N</span>}
                        {row.commentCount > 0 && <span className="post-comment-count">[{row.commentCount}]</span>}
                      </td>
                      <td>{row.createdUser ?? '-'}</td>
                      <td>{row.createdDate ? String(row.createdDate).slice(0, 10) : '-'}</td>
                      <td style={{ textAlign: 'center' }}>{row.viewCount ?? 0}</td>
                      <td style={{ textAlign: 'center' }}>{row.likeCount ?? 0}</td>
                      <td style={{ textAlign: 'center' }}>{row.commentCount ?? 0}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="grid-pagination">
              <button className="grid-page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
              <button className="grid-page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`grid-page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="grid-page-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>›</button>
              <button className="grid-page-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Post
