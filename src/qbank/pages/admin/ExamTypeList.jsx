// ============================================================
// 시험종류 + 시험대상 관리 — 2패널 나란히 CRUD
// 라우트: /admin/qbank/types
// ============================================================
import { useEffect, useRef, useState } from 'react'
import qbankApi, { handleQbankResponse } from '../../api/qbankApi'
import '../../../portal/common/css/grid.css'
import '../../qbank.css'

function ActionMenu({ row, onEdit, onDelete }) {
  const [open, setOpen]     = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const ref    = useRef(null)
  const btnRef = useRef(null)

  const toggle = () => {
    if (!open && btnRef.current) {
      const wrap   = btnRef.current.closest('.grid-wrap')
      const bottom = wrap ? wrap.getBoundingClientRect().bottom : window.innerHeight
      setOpenUp(bottom - btnRef.current.getBoundingClientRect().bottom < 110)
    }
    setOpen(v => !v)
  }

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className="action-menu" ref={ref}>
      <button ref={btnRef} className="action-btn" onClick={e => { e.stopPropagation(); toggle() }}>
        <svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
      </button>
      {open && (
        <div className={`action-dropdown ${openUp ? 'up' : ''}`}>
          <button className="action-item edit"   onClick={() => { onEdit(row);   setOpen(false) }}>수정</button>
          <button className="action-item delete" onClick={() => { onDelete(row); setOpen(false) }}>삭제</button>
        </div>
      )}
    </div>
  )
}

// ─── 범용 인라인 CRUD 패널 (시험종류 / 시험대상 공용) ───
function CrudPanel({ title, list, loading, fields, onSave, onDelete }) {
  const [modal, setModal] = useState(null) // null | 'new' | 'edit'
  const [form, setForm]   = useState({})
  const [saving, setSaving] = useState(false)

  const openNew  = () => { setForm(fields.reduce((acc, f) => ({ ...acc, [f.key]: f.default ?? '' }), {})); setModal('new') }
  const openEdit = (row) => { setForm(row); setModal('edit') }
  const close    = () => { setModal(null); setForm({}) }

  const handleSave = async () => {
    for (const f of fields) {
      if (f.required && !form[f.key]) { alert(`${f.label} 항목은 필수입니다.`); return }
    }
    setSaving(true)
    try {
      const res = modal === 'edit'
        ? await onSave.update(form.id, form)
        : await onSave.create(form)
      if (!handleQbankResponse(res)) return
      close(); onSave.reload()
    } catch { alert('저장 중 오류가 발생했습니다.') }
    finally { setSaving(false) }
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`[${row[fields[0].key]}]을(를) 삭제하시겠습니까?`)) return
    try {
      const res = await onDelete(row.id)
      if (!handleQbankResponse(res)) return
      onSave.reload()
    } catch { alert('삭제 중 오류가 발생했습니다.') }
  }

  return (
    <div className="grid-container eai-compact">
      <div className="grid-toolbar">
        <span className="grid-title">{title}</span>
        <button className="grid-add-btn" onClick={openNew}>+ 등록</button>
      </div>
      <div className="grid-wrap">
        <table className="grid-table">
          <colgroup>
            <col style={{ width: 60 }} />
            {fields.map(f => <col key={f.key} style={f.width ? { width: f.width } : {}} />)}
            <col style={{ width: 48 }} />
          </colgroup>
          <thead>
            <tr>
              <th>ID</th>
              {fields.map(f => <th key={f.key}>{f.label}</th>)}
              <th className="action-cell"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={fields.length + 2} className="grid-loading">로딩 중...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={fields.length + 2} className="grid-empty">데이터가 없습니다.</td></tr>
            ) : list.map(row => (
              <tr key={row.id}>
                <td>{row.id}</td>
                {fields.map(f => (
                  <td key={f.key}>
                    {f.type === 'boolean'
                      ? <span className={`eai-status-badge ${row[f.key] ? 'ACTIVE' : 'INACTIVE'}`}>{row[f.key] ? 'Y' : 'N'}</span>
                      : (row[f.key] ?? '-')}
                  </td>
                ))}
                <td className="action-cell">
                  <ActionMenu row={row} onEdit={openEdit} onDelete={handleDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal-box" style={{ width: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{modal === 'edit' ? `${title} 수정` : `${title} 등록`}</span>
              <button className="modal-close" onClick={close}>✕</button>
            </div>
            <div className="modal-body">
              {fields.map(f => (
                <div className="modal-field" key={f.key}>
                  <label className={f.required ? 'req' : ''}>{f.label}</label>
                  {f.type === 'boolean' ? (
                    <select value={form[f.key] ? 'true' : 'false'}
                      onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value === 'true' }))}>
                      <option value="false">N</option>
                      <option value="true">Y</option>
                    </select>
                  ) : (
                    <input type="text" value={form[f.key] ?? ''}
                      placeholder={f.placeholder ?? ''}
                      onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))} />
                  )}
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="modal-btn-cancel" onClick={close}>취소</button>
              <button className="modal-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 시험종류 필드 정의 ───
const TYPE_FIELDS = [
  { key: 'name',     label: '시험종류명', required: true,  placeholder: '기말고사' },
  { key: 'isSurvey', label: '설문 여부',  required: false, type: 'boolean', default: false, width: 80 },
]

// ─── 시험대상 필드 정의 ───
const SUBJECT_FIELDS = [
  { key: 'name',  label: '대상명',  required: true,  placeholder: '국어' },
  { key: 'grade', label: '학년',    required: false, placeholder: '1학년', width: 100 },
]

function ExamTypeList() {
  const [types,    setTypes]    = useState([])
  const [subjects, setSubjects] = useState([])
  const [loadingT, setLoadingT] = useState(true)
  const [loadingS, setLoadingS] = useState(true)

  const loadTypes    = () => { setLoadingT(true); qbankApi.examType.list().then(setTypes).catch(() => setTypes([])).finally(() => setLoadingT(false)) }
  const loadSubjects = () => { setLoadingS(true); qbankApi.examSubject.list().then(setSubjects).catch(() => setSubjects([])).finally(() => setLoadingS(false)) }

  useEffect(() => { loadTypes(); loadSubjects() }, [])

  return (
    <div className="content-area eai-compact">
      <div className="content-body">
        <div className="qbank-two-panel">
          <CrudPanel
            title="시험종류 관리"
            list={types}
            loading={loadingT}
            fields={TYPE_FIELDS}
            onSave={{ create: qbankApi.examType.create, update: qbankApi.examType.update, reload: loadTypes }}
            onDelete={qbankApi.examType.delete}
          />
          <CrudPanel
            title="시험대상 관리"
            list={subjects}
            loading={loadingS}
            fields={SUBJECT_FIELDS}
            onSave={{ create: qbankApi.examSubject.create, update: qbankApi.examSubject.update, reload: loadSubjects }}
            onDelete={qbankApi.examSubject.delete}
          />
        </div>
      </div>
    </div>
  )
}

export default ExamTypeList
