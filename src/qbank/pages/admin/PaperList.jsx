// ============================================================
// 시험지 관리 — 시험종류 + 시험대상 조합으로 시험지 생성/수정/삭제
// 라우트: /admin/qbank/papers
// ============================================================
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import qbankApi, { handleQbankResponse } from '../../api/qbankApi'
import '../../../portal/common/css/grid.css'
import '../../qbank.css'
import ActionMenu from '../../../portal/common/ActionMenu'

const defaultForm = { examTypeId: '', examSubjectId: '', title: '', timeLimitMin: '', isActive: true }

function PaperList() {
  const navigate = useNavigate()
  const [list,     setList]     = useState([])
  const [types,    setTypes]    = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null)
  const [form,     setForm]     = useState(defaultForm)
  const [saving,   setSaving]   = useState(false)

  const load = () => {
    setLoading(true)
    qbankApi.paper.list().then(setList).catch(() => setList([])).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    qbankApi.examType.list().then(setTypes).catch(() => setTypes([]))
    qbankApi.examSubject.list().then(setSubjects).catch(() => setSubjects([]))
  }, [])

  const openNew  = () => { setForm(defaultForm); setModal('new') }
  const openEdit = (item) => { setForm({ ...defaultForm, ...item, timeLimitMin: item.timeLimitMin ?? '' }); setModal('edit') }
  const close    = () => setModal(null)

  const validate = () => {
    if (!form.examTypeId)    return '시험종류를 선택해주세요.'
    if (!form.examSubjectId) return '시험대상을 선택해주세요.'
    if (!form.title)         return '시험지 제목을 입력해주세요.'
    return null
  }

  const handleSave = async () => {
    const err = validate()
    if (err) { alert(err); return }
    setSaving(true)
    try {
      const payload = { ...form, examTypeId: Number(form.examTypeId), examSubjectId: Number(form.examSubjectId), timeLimitMin: form.timeLimitMin !== '' ? Number(form.timeLimitMin) : null }
      const res = modal === 'edit'
        ? await qbankApi.paper.update(form.id, payload)
        : await qbankApi.paper.create(payload)
      if (!handleQbankResponse(res)) return
      close(); load()
    } catch { alert('저장 중 오류가 발생했습니다.') }
    finally { setSaving(false) }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`시험지 [${item.title}]을 삭제하시겠습니까?\n포함된 문항도 함께 삭제됩니다.`)) return
    try {
      const res = await qbankApi.paper.delete(item.id)
      if (!handleQbankResponse(res)) return
      load()
    } catch { alert('삭제 중 오류가 발생했습니다.') }
  }

  const typeName    = (id) => types.find(t => t.id === id)?.name ?? id ?? '-'
  const subjectName = (id) => subjects.find(s => s.id === id)?.name ?? id ?? '-'

  return (
    <div className="content-area eai-compact">
      <div className="content-body">
        <div className="grid-container">
          <div className="grid-toolbar">
            <span className="grid-title">시험지 관리</span>
            <button className="grid-add-btn" onClick={openNew}>+ 등록</button>
          </div>

          <div className="grid-wrap">
            <table className="grid-table">
              <colgroup>
                <col style={{ width: 60 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 120 }} />
                <col />
                <col style={{ width: 80 }} />
                <col style={{ width: 60 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 48 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>시험종류</th>
                  <th>시험대상</th>
                  <th>시험지 제목</th>
                  <th>제한시간</th>
                  <th>활성</th>
                  <th>문항 관리</th>
                  <th className="action-cell"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="grid-loading">로딩 중...</td></tr>
                ) : list.length === 0 ? (
                  <tr><td colSpan={8} className="grid-empty">데이터가 없습니다.</td></tr>
                ) : list.map(item => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{typeName(item.examTypeId)}</td>
                    <td>{subjectName(item.examSubjectId)}</td>
                    <td>{item.title}</td>
                    <td className="eai-cell-center">{item.timeLimitMin ? `${item.timeLimitMin}분` : '무제한'}</td>
                    <td className="eai-cell-center">
                      <span className={`eai-status-badge ${item.isActive ? 'ACTIVE' : 'INACTIVE'}`}>
                        {item.isActive ? 'Y' : 'N'}
                      </span>
                    </td>
                    <td className="eai-cell-center">
                      <button className="grid-search-btn" style={{ fontSize: '0.72rem', padding: '3px 10px', height: 'auto' }}
                        onClick={() => navigate(`/admin/qbank/papers/${item.id}/questions`)}>
                        문항 편집
                      </button>
                    </td>
                    <td className="action-cell">
                      <ActionMenu row={item} onEdit={openEdit} onDelete={handleDelete} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal-box" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{modal === 'edit' ? '시험지 수정' : '시험지 등록'}</span>
              <button className="modal-close" onClick={close}>✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-field">
                <label className="req">시험종류</label>
                <select value={form.examTypeId}
                  onChange={e => setForm(f => ({ ...f, examTypeId: e.target.value }))}>
                  <option value="">선택</option>
                  {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="modal-field">
                <label className="req">시험대상</label>
                <select value={form.examSubjectId}
                  onChange={e => setForm(f => ({ ...f, examSubjectId: e.target.value }))}>
                  <option value="">선택</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}{s.grade ? ` (${s.grade})` : ''}</option>)}
                </select>
              </div>
              <div className="modal-field">
                <label className="req">시험지 제목</label>
                <input type="text" value={form.title}
                  placeholder="1학년 국어 중간고사"
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="modal-field">
                <label>제한시간(분)</label>
                <input type="number" value={form.timeLimitMin}
                  placeholder="무제한이면 빈칸"
                  style={{ width: 120 }}
                  onChange={e => setForm(f => ({ ...f, timeLimitMin: e.target.value }))} />
              </div>
              <div className="modal-field">
                <label>활성화</label>
                <select value={form.isActive ? 'true' : 'false'}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.value === 'true' }))}>
                  <option value="true">활성</option>
                  <option value="false">비활성</option>
                </select>
              </div>
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

export default PaperList
