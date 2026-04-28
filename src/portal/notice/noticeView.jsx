import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import apiUri from '../../api/apiUri'
import serverConfig from '../../config/serverConfig'
import '../common/css/grid.css'
import './notice.css'

const TYPE_OPTIONS = [
  { value: 'NORMAL',    label: '일반' },
  { value: 'IMPORTANT', label: '중요' },
  { value: 'POPUP',     label: '팝업' },
]

const TYPE_LABEL = Object.fromEntries(TYPE_OPTIONS.map((t) => [t.value, t.label]))

const EMPTY_FORM = {
  noticeId: '',
  title: '',
  content: '',
  noticeType: 'NORMAL',
  isPinned: 'N',
  isPopup: 'N',
  popupStartDt: '',
  popupEndDt: '',
  targetDeptId: '',
  attachYn: 'N',
  useYn: 'Y',
  viewCount: 0,
  createdUser: '',
  createdDate: '',
  updateUser: '',
  updatedDate: '',
}

const toDtInput  = (iso) => (iso ? String(iso).slice(0, 16) : '')
const toDtServer = (val) => (val ? `${val}:00` : null)
const toDateText = (iso) => (iso ? String(iso).replace('T', ' ').slice(0, 19) : '-')

function NoticeView() {
  const navigate = useNavigate()
  const location = useLocation()
  const { noticeId } = useParams()
  const isCreate = location.pathname.endsWith('/new')
  const isAdmin  = serverConfig.token.isAdmin()

  const [form, setForm]       = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(!isCreate)

  useEffect(() => {
    if (isCreate) {
      fetch(apiUri.notice.nextId(), { headers: serverConfig.token.authHeader() })
        .then((r) => r.json())
        .then((data) => {
          const id = data?.noticeId ?? data?.nextId ?? (typeof data === 'string' ? data : '')
          setForm((prev) => ({ ...prev, noticeId: id }))
        })
        .catch(() => {})
      return
    }
    if (!noticeId) return
    setLoading(true)
    fetch(apiUri.notice.detail(noticeId), { headers: serverConfig.token.authHeader() })
      .then((r) => r.json())
      .then((data) => {
        const obj = data?.data ?? data
        setForm({ ...EMPTY_FORM, ...obj, popupStartDt: toDtInput(obj?.popupStartDt), popupEndDt: toDtInput(obj?.popupEndDt) })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [noticeId, isCreate])

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }))

  const buildPayload = () => {
    const popup = form.isPopup === 'Y'
    return {
      noticeId:     form.noticeId,
      title:        form.title,
      content:      form.content,
      noticeType:   form.noticeType,
      isPinned:     form.isPinned,
      isPopup:      form.isPopup,
      popupStartDt: popup ? toDtServer(form.popupStartDt) : null,
      popupEndDt:   popup ? toDtServer(form.popupEndDt)   : null,
      targetDeptId: form.targetDeptId || null,
      attachYn:     form.attachYn || 'N',
      useYn:        form.useYn || 'Y',
    }
  }

  const handleSave = async () => {
    if (!form.title.trim())   { alert('제목을 입력하세요'); return }
    if (!form.content.trim()) { alert('내용을 입력하세요'); return }
    try {
      const url = isCreate ? apiUri.notice.create() : apiUri.notice.update()
      const res = await fetch(url, {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })
      const data = await res.json().catch(() => ({}))
      if (data.messageCode === 'fail' || (data.code && data.code !== '200')) {
        alert(data.message ?? '저장 실패')
        return
      }
      navigate('/portal/notices/list')
    } catch (err) {
      alert(`저장 실패 (${err.message})`)
    }
  }

  const handleDelete = async () => {
    if (!form.noticeId) return
    if (!window.confirm('삭제하시겠습니까?')) return
    try {
      const res = await fetch(apiUri.notice.delete(form.noticeId), {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json().catch(() => ({}))
      if (data.messageCode === 'fail' || (data.code && data.code !== '200')) {
        alert(data.message ?? '삭제 실패')
        return
      }
      navigate('/portal/notices/list')
    } catch (err) {
      alert(`삭제 실패 (${err.message})`)
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

  const popupOn = form.isPopup === 'Y'

  return (
    <div className="content-area">
      <div className="content-body">
        <div className="grid-container">
          <div className="grid-toolbar">
            <span className="grid-title">공지사항 {isCreate ? '등록' : '상세'}</span>
            <div className="grid-toolbar-right">
              {isAdmin && (
                <>
                  <button className="modal-btn-save" onClick={handleSave}>저장</button>
                  {!isCreate && (
                    <button className="modal-btn-cancel" onClick={handleDelete}>삭제</button>
                  )}
                </>
              )}
              <button className="modal-btn-cancel" onClick={() => navigate('/portal/notices/list')}>목록</button>
            </div>
          </div>

          <div className="notice-detail">
            <div className="notice-row">
              <label>번호</label>
              <input value={form.noticeId} readOnly />
            </div>

            <div className="notice-row">
              <label>유형</label>
              {isAdmin ? (
                <select value={form.noticeType} onChange={(e) => set('noticeType', e.target.value)}>
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              ) : (
                <span className="notice-text">{TYPE_LABEL[form.noticeType] ?? form.noticeType}</span>
              )}
            </div>

            <div className="notice-row">
              <label>제목</label>
              {isAdmin ? (
                <input value={form.title} onChange={(e) => set('title', e.target.value)} />
              ) : (
                <span className="notice-text">{form.title || '-'}</span>
              )}
            </div>

            <div className="notice-row notice-row-multi">
              <label>내용</label>
              {isAdmin ? (
                <textarea
                  rows={10}
                  value={form.content ?? ''}
                  onChange={(e) => set('content', e.target.value)}
                />
              ) : (
                <pre className="notice-text-multi">{form.content || '-'}</pre>
              )}
            </div>

            {isAdmin && (
              <div className="notice-row-group">
                <div className="notice-row">
                  <label>상단고정</label>
                  <select value={form.isPinned} onChange={(e) => set('isPinned', e.target.value)}>
                    <option value="Y">Y</option>
                    <option value="N">N</option>
                  </select>
                </div>

                <div className="notice-row">
                  <label>팝업</label>
                  <select value={form.isPopup} onChange={(e) => set('isPopup', e.target.value)}>
                    <option value="Y">Y</option>
                    <option value="N">N</option>
                  </select>
                </div>

                <div className="notice-row">
                  <label>사용</label>
                  <select value={form.useYn} onChange={(e) => set('useYn', e.target.value)}>
                    <option value="Y">Y</option>
                    <option value="N">N</option>
                  </select>
                </div>
              </div>
            )}

            {isAdmin && popupOn && (
              <div className="notice-row-group">
                <div className="notice-row">
                  <label>팝업 시작</label>
                  <input
                    type="datetime-local"
                    value={form.popupStartDt}
                    onChange={(e) => set('popupStartDt', e.target.value)}
                  />
                </div>
                <div className="notice-row">
                  <label>팝업 종료</label>
                  <input
                    type="datetime-local"
                    value={form.popupEndDt}
                    onChange={(e) => set('popupEndDt', e.target.value)}
                  />
                </div>
              </div>
            )}

            {!isCreate && (
              <div className="notice-row-group">
                <div className="notice-row">
                  <label>조회수</label>
                  <span className="notice-text">{form.viewCount ?? 0}</span>
                </div>
                <div className="notice-row">
                  <label>작성자</label>
                  <span className="notice-text">{form.createdUser ?? '-'}</span>
                </div>
                <div className="notice-row">
                  <label>등록일</label>
                  <span className="notice-text">{toDateText(form.createdDate)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NoticeView
