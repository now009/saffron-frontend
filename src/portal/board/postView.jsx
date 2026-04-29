import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import apiUri from '../../api/apiUri'
import serverConfig from '../../config/serverConfig'
import '../common/css/grid.css'
import './board.css'

const formatDate = (d) => (d ? String(d).replace('T', ' ').slice(0, 16) : '-')

function CommentItem({ comment, currentUser, onReply, onEdit, onDelete, onToggleLike }) {
  const isOwner = comment.createdUser === currentUser
  const [editing, setEditing] = useState(false)
  const [text, setText]       = useState(comment.content ?? '')

  const handleSave = () => {
    if (!text.trim()) return
    onEdit({ ...comment, content: text.trim() })
    setEditing(false)
  }

  return (
    <div className={`comment-item ${comment.depth > 0 ? 'reply' : ''}`}>
      <div className="comment-head">
        <span className="comment-user">{comment.createdUser ?? '-'}</span>
        <span className="comment-date">{formatDate(comment.createdDate)}</span>
        <span className="comment-actions">
          <button
            className={`comment-like ${comment.isLiked === 'Y' ? 'on' : ''}`}
            onClick={() => onToggleLike(comment)}
          >
            ♥ {comment.likeCount ?? 0}
          </button>
          {comment.depth === 0 && (
            <button className="comment-action" onClick={() => onReply(comment)}>답글</button>
          )}
          {isOwner && !editing && (
            <>
              <button className="comment-action" onClick={() => setEditing(true)}>수정</button>
              <button className="comment-action danger" onClick={() => onDelete(comment)}>삭제</button>
            </>
          )}
        </span>
      </div>
      {editing ? (
        <div className="comment-edit-row">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} />
          <div className="comment-edit-actions">
            <button className="modal-btn-cancel" onClick={() => { setEditing(false); setText(comment.content ?? '') }}>취소</button>
            <button className="modal-btn-save" onClick={handleSave}>저장</button>
          </div>
        </div>
      ) : (
        <div className="comment-body">{comment.content}</div>
      )}
    </div>
  )
}

function PostView() {
  const navigate = useNavigate()
  const { boardId, postId } = useParams()
  const user = serverConfig.token.payload()
  const isAdmin = serverConfig.token.isAdmin()
  const currentUser = user?.userId ?? user?.sub ?? ''

  const [post, setPost]         = useState(null)
  const [files, setFiles]       = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading]   = useState(true)

  const [newComment, setNewComment]   = useState('')
  const [replyTo, setReplyTo]         = useState(null) // {commentId, createdUser}
  const [replyText, setReplyText]     = useState('')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [pRes, fRes, cRes] = await Promise.all([
        fetch(apiUri.post.detail(postId, currentUser), { headers: serverConfig.token.authHeader() }).then((r) => r.json()),
        fetch(apiUri.boardFile.byPost(postId),         { headers: serverConfig.token.authHeader() }).then((r) => r.json()),
        fetch(apiUri.comment.list(), {
          method: 'POST',
          headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId, currentUser }),
        }).then((r) => r.json()),
      ])
      setPost(pRes?.data ?? pRes)
      setFiles(Array.isArray(fRes) ? fRes : (fRes.list ?? fRes.data ?? []))
      setComments(Array.isArray(cRes) ? cRes : (cRes.list ?? cRes.data ?? []))
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [postId])

  const fetchComments = async () => {
    const res = await fetch(apiUri.comment.list(), {
      method: 'POST',
      headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, currentUser }),
    })
    const data = await res.json()
    setComments(Array.isArray(data) ? data : (data.list ?? data.data ?? []))
  }

  const handleTogglePostLike = async () => {
    if (!post) return
    try {
      const res = await fetch(apiUri.like.toggle(), {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId, targetType: 'POST', targetId: postId, createdUser: currentUser }),
      })
      const data = await res.json()
      const liked = data.isLiked === 'Y'
      setPost((prev) => prev ? {
        ...prev,
        isLiked: data.isLiked,
        likeCount: (prev.likeCount ?? 0) + (liked ? 1 : -1),
      } : prev)
    } catch (err) { alert(err.message) }
  }

  const handleToggleCommentLike = async (c) => {
    try {
      const res = await fetch(apiUri.like.toggle(), {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId, targetType: 'COMMENT', targetId: c.commentId, createdUser: currentUser }),
      })
      const data = await res.json()
      const liked = data.isLiked === 'Y'
      setComments((list) => list.map((x) =>
        x.commentId === c.commentId
          ? { ...x, isLiked: data.isLiked, likeCount: (x.likeCount ?? 0) + (liked ? 1 : -1) }
          : x
      ))
    } catch (err) { alert(err.message) }
  }

  const submitComment = async (content, parentCommentId = null, depth = 0) => {
    if (!content.trim()) return
    const res = await fetch(apiUri.comment.create(), {
      method: 'POST',
      headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId, boardId, parentCommentId, depth,
        content: content.trim(),
        isAnonymous: 'N', useYn: 'Y',
        createdUser: currentUser,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (data.messageCode === 'fail') { alert(data.message); return false }
    await fetchComments()
    setPost((p) => p ? { ...p, commentCount: (p.commentCount ?? 0) + 1 } : p)
    return true
  }

  const handleAddComment = async () => {
    if (await submitComment(newComment)) setNewComment('')
  }

  const handleAddReply = async () => {
    if (!replyTo) return
    if (await submitComment(replyText, replyTo.commentId, 1)) {
      setReplyText('')
      setReplyTo(null)
    }
  }

  const handleEditComment = async (c) => {
    const res = await fetch(apiUri.comment.update(), {
      method: 'POST',
      headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...c, updateUser: currentUser }),
    })
    const data = await res.json().catch(() => ({}))
    if (data.messageCode === 'fail') { alert(data.message); return }
    fetchComments()
  }

  const handleDeleteComment = async (c) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return
    const res = await fetch(apiUri.comment.delete(c.commentId), {
      method: 'POST',
      headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const data = await res.json().catch(() => ({}))
    if (data.messageCode === 'fail') { alert(data.message); return }
    setPost((p) => p ? { ...p, commentCount: Math.max(0, (p.commentCount ?? 1) - 1) } : p)
    fetchComments()
  }

  const handleDeletePost = async () => {
    if (!window.confirm('게시글을 삭제하시겠습니까?')) return
    const res = await fetch(apiUri.post.delete(postId), {
      method: 'POST',
      headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const data = await res.json().catch(() => ({}))
    if (data.messageCode === 'fail') { alert(data.message); return }
    navigate(`/board/boards/posts/${boardId}`)
  }

  const handleDownload = async (f) => {
    try {
      const res = await fetch(apiUri.boardFile.download(f.fileId), { headers: serverConfig.token.authHeader() })
      if (!res.ok) throw new Error(`다운로드 실패 (${res.status})`)
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = f.originalName ?? 'download'
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch (err) { alert(err.message) }
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

  if (!post) {
    return (
      <div className="content-area">
        <div className="content-body">
          <div className="grid-empty">게시글을 찾을 수 없습니다.</div>
        </div>
      </div>
    )
  }

  const isOwner   = post.createdUser === currentUser
  const canModify = isOwner || isAdmin

  // sort comments: top-level by date asc, replies grouped under parent
  const topLevel = comments.filter((c) => !c.parentCommentId)
  const childMap = new Map()
  for (const c of comments) {
    if (c.parentCommentId) {
      const arr = childMap.get(c.parentCommentId) ?? []
      arr.push(c); childMap.set(c.parentCommentId, arr)
    }
  }
  const flat = []
  for (const t of topLevel) {
    flat.push(t)
    for (const child of (childMap.get(t.commentId) ?? [])) flat.push(child)
  }

  return (
    <div className="content-area">
      <div className="content-body">
        <div className="grid-container">
          <div className="grid-toolbar">
            <span className="grid-title">{post.title}</span>
            <div className="grid-toolbar-right">
              <button className="grid-add-btn" onClick={() => navigate(`/board/boards/posts/${boardId}`)}>← 목록</button>
              {canModify && (
                <>
                  <button className="modal-btn-save" onClick={() => navigate(`/board/${boardId}/write/${postId}`)}>수정</button>
                  <button className="modal-btn-cancel" onClick={handleDeletePost}>삭제</button>
                </>
              )}
            </div>
          </div>

          <div className="post-meta">
            <span><strong>작성자</strong> {post.createdUser ?? '-'}</span>
            <span><strong>작성일</strong> {formatDate(post.createdDate)}</span>
            <span><strong>조회</strong> {post.viewCount ?? 0}</span>
            <span><strong>좋아요</strong> {post.likeCount ?? 0}</span>
            <span><strong>댓글</strong> {post.commentCount ?? 0}</span>
            {post.category && <span><strong>분류</strong> {post.category}</span>}
            {post.isPinned === 'Y' && <span className="grid-badge admin">고정</span>}
            {post.isSecret === 'Y' && <span className="grid-badge level2">비밀</span>}
          </div>

          <div className="post-content">{post.content}</div>

          {files.length > 0 && (
            <div className="post-files">
              <div className="post-files-title">첨부파일 ({files.length})</div>
              {files.map((f) => (
                <button key={f.fileId} className="post-file-item" onClick={() => handleDownload(f)}>
                  <span className="post-file-name">{f.originalName}</span>
                  <span className="post-file-size">{formatBytes(f.fileSize)}</span>
                </button>
              ))}
            </div>
          )}

          <div className="post-like-bar">
            <button
              className={`post-like-btn ${post.isLiked === 'Y' ? 'on' : ''}`}
              onClick={handleTogglePostLike}
            >
              ♥ 좋아요 {post.likeCount ?? 0}
            </button>
          </div>

          <div className="comments-section">
            <div className="comments-title">댓글 {post.commentCount ?? 0}</div>
            {flat.length === 0 ? (
              <div className="comments-empty">아직 댓글이 없습니다.</div>
            ) : flat.map((c) => (
              <div key={c.commentId}>
                <CommentItem
                  comment={c}
                  currentUser={currentUser}
                  onReply={(p) => { setReplyTo(p); setReplyText('') }}
                  onEdit={handleEditComment}
                  onDelete={handleDeleteComment}
                  onToggleLike={handleToggleCommentLike}
                />
                {replyTo?.commentId === c.commentId && (
                  <div className="reply-input">
                    <textarea
                      placeholder={`@${c.createdUser}에게 답글...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={2}
                    />
                    <div className="comment-edit-actions">
                      <button className="modal-btn-cancel" onClick={() => { setReplyTo(null); setReplyText('') }}>취소</button>
                      <button className="modal-btn-save" onClick={handleAddReply}>등록</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div className="comment-write">
              <textarea
                placeholder="댓글을 입력하세요"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <button className="modal-btn-save" onClick={handleAddComment}>댓글 등록</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatBytes(n) {
  if (!n) return '-'
  const u = ['B', 'KB', 'MB', 'GB']
  let i = 0; let v = Number(n)
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(i ? 1 : 0)} ${u[i]}`
}

export default PostView
