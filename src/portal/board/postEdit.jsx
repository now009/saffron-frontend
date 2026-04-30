import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import apiUri from '../../api/apiUri'
import serverConfig from '../../config/serverConfig'
import '../common/css/grid.css'
import './board.css'

const EMPTY_FORM = {
  postId: '',
  boardId: '',
  parentPostId: null,
  depth: 0,
  title: '',
  content: '',
  category: '',
  tags: '',
  isPinned: 'N',
  isSecret: 'N',
  isAnonymous: 'N',
  useYn: 'Y',
}

function PostEdit() {
  const navigate = useNavigate()
  const { boardId, postId } = useParams()
  const isEdit = Boolean(postId)
  const user = serverConfig.token.payload()
  const isAdmin = serverConfig.token.isAdmin()
  const currentUser = user?.userId ?? user?.sub ?? ''

  const [board, setBoard]       = useState(null)
  const [form, setForm]         = useState({ ...EMPTY_FORM, boardId })
  const [files, setFiles]       = useState([])    // existing files (edit mode)
  const [newFiles, setNewFiles] = useState([])    // newly chosen files
  const [loading, setLoading]   = useState(isEdit)

  useEffect(() => {
    fetch(apiUri.board.detail(boardId), { headers: serverConfig.token.authHeader() })
      .then((r) => r.json())
      .then((data) => setBoard(data?.data ?? data))
      .catch(() => {})
  }, [boardId])

  useEffect(() => {
    if (isEdit) {
      Promise.all([
        fetch(apiUri.post.detail(postId, currentUser), { headers: serverConfig.token.authHeader() }).then((r) => r.json()),
        fetch(apiUri.boardFile.byPost(postId),         { headers: serverConfig.token.authHeader() }).then((r) => r.json()),
      ])
        .then(([pRes, fRes]) => {
          const obj = pRes?.data ?? pRes
          setForm({ ...EMPTY_FORM, ...obj, boardId })
          setFiles(Array.isArray(fRes) ? fRes : (fRes.list ?? fRes.data ?? []))
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      fetch(apiUri.post.nextId(), { headers: serverConfig.token.authHeader() })
        .then((r) => r.json())
        .then((data) => {
          const id = data?.postId ?? data?.nextId ?? (typeof data === 'string' ? data : '')
          setForm((prev) => ({ ...prev, postId: id }))
        })
        .catch(() => {})
    }
  }, [postId, isEdit, boardId, currentUser])

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }))

  const handleFileChoose = (e) => {
    const list = Array.from(e.target.files ?? [])
    setNewFiles((prev) => [...prev, ...list])
    e.target.value = ''
  }

  const removeNewFile = (idx) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const removeExistingFile = async (f) => {
    if (!window.confirm('첨부파일을 삭제하시겠습니까?')) return
    const res = await fetch(apiUri.boardFile.delete(f.fileId), {
      method: 'POST',
      headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const data = await res.json().catch(() => ({}))
    if (data.messageCode === 'fail') { alert(data.message); return }
    setFiles((list) => list.filter((x) => x.fileId !== f.fileId))
  }

  const uploadNewFiles = async (savedPostId) => {
    if (newFiles.length === 0) return
    const fd = new FormData()
    fd.append('postId',      savedPostId)
    fd.append('boardId',     boardId)
    fd.append('createdUser', currentUser)
    for (const f of newFiles) fd.append('files', f)
    const res = await fetch(apiUri.boardFile.upload(), {
      method: 'POST',
      headers: serverConfig.token.authHeader(),
      body: fd,
    })
    if (!res.ok) throw new Error(`첨부 업로드 실패 (${res.status})`)
  }

  const handleSubmit = async () => {
    if (!form.title.trim())   { alert('제목을 입력하세요'); return }
    if (!form.content.trim()) { alert('내용을 입력하세요'); return }
    try {
      const url     = isEdit ? apiUri.post.update() : apiUri.post.create()
      const payload = {
        ...form,
        boardId,
        isPinned: isAdmin ? form.isPinned : 'N',
        createdUser: form.createdUser ?? currentUser,
        updateUser:  currentUser,
      }
      const res  = await fetch(url, {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (data.messageCode === 'fail') { alert(data.message); return }
      try {
        await uploadNewFiles(form.postId)
      } catch (e) {
        alert(e.message)
      }
      navigate(`/portal/boards/posts/${boardId}`)
    } catch (err) {
      alert(`저장 실패 (${err.message})`)
    }
  }

  if (loading) {
    return (
      <div className="content-area">
        <div className="content-body">
          <div className="grid-loading" style={{ padding: '60px 0' }}>데이터를 불러오는 중...</div>
        </div>
      </div>
    )
  }

  const allowAttach = (board?.allowAttach ?? 'Y') === 'Y'

  return (
    <div className="content-area">
      <div className="content-body">
        <div className="grid-container">
          <div className="grid-toolbar">
            <span className="grid-title">{board?.boardName ?? '게시판'} {isEdit ? '수정' : '글쓰기'}</span>
            <div className="grid-toolbar-right">
              <button className="modal-btn-cancel" onClick={() => navigate(-1)}>취소</button>
              <button className="modal-btn-save" onClick={handleSubmit}>저장</button>
            </div>
          </div>

          <div className="post-edit-form">
            <div className="post-edit-row">
              <label>제목</label>
              <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="제목" />
            </div>

            <div className="post-edit-row-group">
              <div className="post-edit-row">
                <label>분류</label>
                <input value={form.category ?? ''} onChange={(e) => set('category', e.target.value)} placeholder="말머리" />
              </div>
              <div className="post-edit-row">
                <label>태그</label>
                <input value={form.tags ?? ''} onChange={(e) => set('tags', e.target.value)} placeholder="쉼표 구분" />
              </div>
            </div>

            <div className="post-edit-row post-edit-row-multi">
              <label>내용</label>
              <textarea
                rows={14}
                value={form.content}
                onChange={(e) => set('content', e.target.value)}
                placeholder="내용을 입력하세요"
              />
            </div>

            <div className="post-edit-options">
              <label className="post-check">
                <input type="checkbox" checked={form.isSecret === 'Y'}
                  onChange={(e) => set('isSecret', e.target.checked ? 'Y' : 'N')} />
                비밀글
              </label>
              {isAdmin && (
                <label className="post-check">
                  <input type="checkbox" checked={form.isPinned === 'Y'}
                    onChange={(e) => set('isPinned', e.target.checked ? 'Y' : 'N')} />
                  상단고정
                </label>
              )}
            </div>

            {allowAttach && (
              <div className="post-edit-row post-edit-row-multi">
                <label>첨부파일</label>
                <div className="post-attach">
                  {files.length > 0 && (
                    <div className="post-attach-list">
                      {files.map((f) => (
                        <div key={f.fileId} className="post-attach-item">
                          <span className="post-file-name">{f.originalName}</span>
                          <button className="post-attach-remove" onClick={() => removeExistingFile(f)}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {newFiles.length > 0 && (
                    <div className="post-attach-list">
                      {newFiles.map((f, i) => (
                        <div key={i} className="post-attach-item new">
                          <span className="post-file-name">{f.name}</span>
                          <button className="post-attach-remove" onClick={() => removeNewFile(i)}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="post-attach-add">
                    + 파일 선택
                    <input type="file" multiple onChange={handleFileChoose} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostEdit
