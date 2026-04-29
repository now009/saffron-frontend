import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiUri from '../../api/apiUri'
import serverConfig from '../../config/serverConfig'
import '../common/css/grid.css'
import './board.css'

const PAGE_SIZE = 15

const TYPE_OPTIONS = [
  { value: 'GENERAL', label: '일반' },
  { value: 'NOTICE',  label: '공지' },
  { value: 'QNA',     label: 'Q&A'  },
  { value: 'FAQ',     label: 'FAQ'  },
]

const TYPE_LABEL = Object.fromEntries(TYPE_OPTIONS.map((t) => [t.value, t.label]))
const TYPE_BADGE = { GENERAL: 'off', NOTICE: 'level1', QNA: 'level2', FAQ: 'level3' }

const ROLE_OPTIONS = [
  { value: 'ALL',   label: 'ALL'   },
  { value: 'USER',  label: 'USER'  },
  { value: 'ADMIN', label: 'ADMIN' },
]

const EMPTY_BOARD = {
  boardId: '',
  boardName: '',
  boardType: 'GENERAL',
  description: '',
  allowComment: 'Y',
  allowAttach: 'Y',
  allowAnonymous: 'N',
  allowSearch: 'Y',
  readRole: 'ALL',
  writeRole: 'USER',
  listCount: 10,
  newDays: 3,
  sortOrder: 0,
  useYn: 'Y',
}

function BoardModal({ mode, form: initialForm, stats, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(initialForm)
  const isEdit = mode === 'edit'

  useEffect(() => {
    if (isEdit) return
    fetch(apiUri.board.nextId(), { headers: serverConfig.token.authHeader() })
      .then((r) => r.json())
      .then((data) => {
        const id = data?.boardId ?? data?.nextId ?? (typeof data === 'string' ? data : '')
        setForm((prev) => ({ ...prev, boardId: id }))
      })
      .catch(() => {})
  }, [isEdit])

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = () => {
    if (!form.boardId)   { alert('게시판 ID가 없습니다');  return }
    if (!form.boardName) { alert('게시판명을 입력하세요'); return }
    onSave(form)
  }

  const handleDelete = () => {
    if (!isEdit) return
    if (stats?.postCount > 0) {
      alert(`이 게시판에 글이 ${stats.postCount}건 있어 삭제할 수 없습니다.`)
      return
    }
    if (!window.confirm('삭제하시겠습니까?')) return
    onDelete(form.boardId)
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ width: '520px' }}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? '게시판 수정' : '게시판 등록'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-field">
            <label>게시판 ID</label>
            <input value={form.boardId} readOnly placeholder="조회 중..." />
          </div>
          <div className="modal-field">
            <label>게시판명</label>
            <input value={form.boardName} onChange={(e) => set('boardName', e.target.value)} />
          </div>
          <div className="modal-field">
            <label>유형</label>
            <select value={form.boardType} onChange={(e) => set('boardType', e.target.value)}>
              {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="modal-field">
            <label>설명</label>
            <input value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div className="modal-field-row">
            <div className="modal-field modal-field-v">
              <label>읽기 권한</label>
              <select value={form.readRole} onChange={(e) => set('readRole', e.target.value)}>
                {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="modal-field modal-field-v">
              <label>쓰기 권한</label>
              <select value={form.writeRole} onChange={(e) => set('writeRole', e.target.value)}>
                {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-field-row">
            <div className="modal-field modal-field-v">
              <label>댓글 허용</label>
              <select value={form.allowComment} onChange={(e) => set('allowComment', e.target.value)}>
                <option value="Y">Y</option><option value="N">N</option>
              </select>
            </div>
            <div className="modal-field modal-field-v">
              <label>첨부 허용</label>
              <select value={form.allowAttach} onChange={(e) => set('allowAttach', e.target.value)}>
                <option value="Y">Y</option><option value="N">N</option>
              </select>
            </div>
            <div className="modal-field modal-field-v">
              <label>익명 허용</label>
              <select value={form.allowAnonymous} onChange={(e) => set('allowAnonymous', e.target.value)}>
                <option value="Y">Y</option><option value="N">N</option>
              </select>
            </div>
            <div className="modal-field modal-field-v">
              <label>검색 허용</label>
              <select value={form.allowSearch} onChange={(e) => set('allowSearch', e.target.value)}>
                <option value="Y">Y</option><option value="N">N</option>
              </select>
            </div>
          </div>
          <div className="modal-field-row">
            <div className="modal-field modal-field-v">
              <label>목록 건수</label>
              <input type="number" min={1} value={form.listCount}
                onChange={(e) => set('listCount', Number(e.target.value) || 10)} />
            </div>
            <div className="modal-field modal-field-v">
              <label>NEW 일수</label>
              <input type="number" min={0} value={form.newDays}
                onChange={(e) => set('newDays', Number(e.target.value) || 0)} />
            </div>
            <div className="modal-field modal-field-v">
              <label>정렬</label>
              <input type="number" min={0} value={form.sortOrder}
                onChange={(e) => set('sortOrder', Number(e.target.value) || 0)} />
            </div>
            <div className="modal-field modal-field-v">
              <label>사용</label>
              <select value={form.useYn} onChange={(e) => set('useYn', e.target.value)}>
                <option value="Y">Y</option><option value="N">N</option>
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          {isEdit && (
            <button className="modal-btn-cancel" style={{ marginRight: 'auto' }} onClick={handleDelete}>
              삭제
            </button>
          )}
          <button className="modal-btn-cancel" onClick={onClose}>취소</button>
          <button className="modal-btn-save" onClick={handleSubmit}>저장</button>
        </div>
      </div>
    </div>
  )
}

function Board() {
  const navigate = useNavigate()
  const [rows, setRows]       = useState([])
  const [statsMap, setStats]  = useState({})
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)
  const [page, setPage]       = useState(1)

  const isAdmin = serverConfig.token.isAdmin()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(apiUri.board.list(), {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
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

  const fetchStats = async () => {
    try {
      const res = await fetch(apiUri.board.stats(), { headers: serverConfig.token.authHeader() })
      const data = await res.json()
      const list = Array.isArray(data) ? data : (data.list ?? data.data ?? [])
      const map = {}
      for (const s of list) map[s.boardId] = s
      setStats(map)
    } catch {
      setStats({})
    }
  }

  useEffect(() => {
    fetchData()
    fetchStats()
  }, [])

  const handleAdd = () => setModal({ mode: 'add', form: { ...EMPTY_BOARD } })

  const handleEdit = (row) => {
    setModal({ mode: 'edit', form: { ...EMPTY_BOARD, ...row } })
  }

  const handleSave = async (form) => {
    const url = modal.mode === 'edit' ? apiUri.board.update() : apiUri.board.create()
    try {
      const res  = await fetch(url, {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (data.messageCode === 'fail') { alert(data.message); return }
      setModal(null)
      fetchData()
      fetchStats()
    } catch (err) {
      alert(`저장 실패 (${err.message})`)
    }
  }

  const handleDelete = async (boardId) => {
    try {
      const res  = await fetch(apiUri.board.delete(boardId), {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json().catch(() => ({}))
      if (data.messageCode === 'fail') { alert(data.message ?? '삭제 실패'); return }
      setModal(null)
      fetchData()
      fetchStats()
    } catch (err) {
      alert(`삭제 실패 (${err.message})`)
    }
  }

  const handleRowClick = (row) => {
    navigate(`/board/boards/posts/${row.boardId}`)
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageRows   = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="content-area">
      <div className="content-body">
        <div className="grid-container">
          <div className="grid-toolbar">
            <span className="grid-title">게시판</span>
            <div className="grid-toolbar-right">
              <span className="grid-count">총 <span>{rows.length}</span>건</span>
              {isAdmin && (
                <button className="grid-add-btn" onClick={handleAdd}>+ 등록</button>
              )}
            </div>
          </div>

          <div className="grid-wrap" style={{ minHeight: '300px' }}>
            <table className="grid-table">
              <colgroup>
                <col style={{ width: '110px' }} />
                <col style={{ width: '200px' }} />
                <col style={{ width: '90px' }} />
                <col />
                <col style={{ width: '90px' }} />
                <col style={{ width: '90px' }} />
                <col style={{ width: '70px' }} />
                {isAdmin && <col style={{ width: '60px' }} />}
              </colgroup>
              <thead>
                <tr>
                  <th>게시판 ID</th>
                  <th>게시판명</th>
                  <th>유형</th>
                  <th>설명</th>
                  <th style={{ textAlign: 'center' }}>글수</th>
                  <th style={{ textAlign: 'center' }}>좋아요</th>
                  <th style={{ textAlign: 'center' }}>사용</th>
                  {isAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={isAdmin ? 8 : 7} className="grid-loading">데이터를 불러오는 중...</td></tr>
                ) : pageRows.length === 0 ? (
                  <tr><td colSpan={isAdmin ? 8 : 7} className="grid-empty">데이터가 없습니다.</td></tr>
                ) : pageRows.map((row) => {
                  const s = statsMap[row.boardId]
                  return (
                    <tr key={row.boardId} onClick={() => handleRowClick(row)}>
                      <td>{row.boardId}</td>
                      <td><strong>{row.boardName}</strong></td>
                      <td>
                        <span className={`grid-badge ${TYPE_BADGE[row.boardType] ?? 'off'}`}>
                          {TYPE_LABEL[row.boardType] ?? row.boardType}
                        </span>
                      </td>
                      <td>{row.description ?? '-'}</td>
                      <td style={{ textAlign: 'center' }}>{s?.postCount ?? 0}</td>
                      <td style={{ textAlign: 'center' }}>{s?.totalLikes ?? 0}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`grid-badge ${row.useYn === 'Y' ? 'on' : 'off'}`}>{row.useYn}</span>
                      </td>
                      {isAdmin && (
                        <td className="action-cell" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="action-btn"
                            onClick={(e) => { e.stopPropagation(); handleEdit(row) }}
                            title="수정"
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                          </button>
                        </td>
                      )}
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

      {modal && (
        <BoardModal
          mode={modal.mode}
          form={modal.form}
          stats={statsMap[modal.form.boardId]}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

export default Board
