import { useState, useEffect, useRef } from 'react'

// 공통 액션 드롭다운 — position:fixed 로 grid overflow 클리핑 완전 해결
// props:
//   row        — 클릭 시 onEdit/onDelete 에 그대로 전달
//   onEdit     — 수정 핸들러
//   onDelete   — 삭제 핸들러 (없으면 버튼 미표시)
//   canDelete  — false 이면 삭제 버튼 비활성화 (기본 true)
function ActionMenu({ row, onEdit, onDelete, canDelete = true }) {
  const [open, setOpen] = useState(false)
  const [pos,  setPos]  = useState({ top: 0, right: 0 })
  const ref    = useRef(null)
  const btnRef = useRef(null)

  const toggle = (e) => {
    e.stopPropagation()
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setOpen(v => !v)
  }

  useEffect(() => {
    if (!open) return
    const close   = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const dismiss = () => setOpen(false)
    document.addEventListener('mousedown', close)
    window.addEventListener('scroll', dismiss, { capture: true, passive: true })
    window.addEventListener('resize', dismiss, { passive: true })
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', dismiss, { capture: true })
      window.removeEventListener('resize', dismiss)
    }
  }, [open])

  return (
    <div className="action-menu" ref={ref}>
      <button ref={btnRef} className="action-btn" onClick={toggle}>
        <svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
      </button>
      {open && (
        <div
          className="action-dropdown"
          style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 9999 }}
        >
          <button className="action-item edit" onClick={() => { onEdit(row); setOpen(false) }}>수정</button>
          {canDelete && onDelete && (
            <button className="action-item delete" onClick={() => { onDelete(row); setOpen(false) }}>삭제</button>
          )}
        </div>
      )}
    </div>
  )
}

export default ActionMenu
