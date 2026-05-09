// ============================================================
// 문항 편집 — 시험지별 문항 CRUD + 보기 동적 추가/삭제 + 이미지 업로드
// 라우트: /admin/qbank/papers/:paperId/questions
// 보기 저장 전략: 문항 저장 후 → 삭제 목록 DELETE → 변경된 기존 보기 PUT → 신규 보기 POST
// ============================================================
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import qbankApi, { handleQbankResponse } from '../../api/qbankApi'
import '../../../portal/common/css/grid.css'
import '../../qbank.css'
import ActionMenu from '../../../portal/common/ActionMenu'

const Q_TYPES = [
  { value: 'single',     label: '단일선택 (라디오)' },
  { value: 'multi',      label: '다중선택 (체크박스)' },
  { value: 'subjective', label: '주관식' },
]

const TYPE_LABEL = { single: '단일', multi: '다중', subjective: '주관식' }

// 파일 선택 → base64 DataURL 변환 (이미지 미리보기용)
const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

const defaultQuestion = { qType: 'single', questionText: '', imageUrl: '', score: 1 }
const newChoice = (seq) => ({ _key: Date.now() + seq, id: null, seq, choiceText: '', imageUrl: '', isCorrect: false })

function QuestionModal({ paperId, question, onClose, onSaved }) {
  const isEdit = !!question?.id

  const [form, setForm] = useState(
    isEdit
      ? { qType: question.qType, questionText: question.questionText, imageUrl: question.imageUrl ?? '', score: question.score }
      : { ...defaultQuestion }
  )
  const [choices, setChoices]         = useState(isEdit ? question.choices?.map(c => ({ ...c, _key: c.id })) ?? [] : [newChoice(1), newChoice(2)])
  const [deletedIds, setDeletedIds]   = useState([])
  const [saving, setSaving]           = useState(false)

  const hasChoices = form.qType !== 'subjective'

  const addChoice = () => {
    if (choices.length >= 8) { alert('보기는 최대 8개까지 등록할 수 있습니다.'); return }
    setChoices(prev => [...prev, newChoice(prev.length + 1)])
  }

  const removeChoice = (key, id) => {
    if (choices.length <= 2) { alert('보기는 최소 2개 이상이어야 합니다.'); return }
    if (id) setDeletedIds(prev => [...prev, id])
    setChoices(prev => prev.filter(c => c._key !== key).map((c, i) => ({ ...c, seq: i + 1 })))
  }

  const updateChoice = (key, field, value) => {
    setChoices(prev => prev.map(c => c._key === key ? { ...c, [field]: value } : c))
  }

  const handleChoiceImgChange = async (key, file) => {
    if (!file) return
    try {
      const dataUrl = await readFileAsDataUrl(file)
      updateChoice(key, 'imageUrl', dataUrl)
    } catch { alert('이미지 로드 중 오류가 발생했습니다.') }
  }

  const handleQuestionImgChange = async (file) => {
    if (!file) return
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setForm(f => ({ ...f, imageUrl: dataUrl }))
    } catch { alert('이미지 로드 중 오류가 발생했습니다.') }
  }

  const handleSave = async () => {
    if (!form.questionText.trim()) { alert('질문 내용을 입력해주세요.'); return }
    if (hasChoices && choices.some(c => !c.choiceText.trim() && !c.imageUrl)) {
      alert('모든 보기에 텍스트 또는 이미지를 입력해주세요.'); return
    }
    if (hasChoices && !choices.some(c => c.isCorrect)) {
      alert('정답 보기를 하나 이상 선택해주세요.'); return
    }
    setSaving(true)
    try {
      // 1. 문항 저장
      const qRes = isEdit
        ? await qbankApi.question.update(question.id, form)
        : await qbankApi.question.create(paperId, { ...form, seq: 0 })
      if (!handleQbankResponse(qRes)) return
      const questionId = isEdit ? question.id : (qRes?.data?.id ?? qRes?.id)

      if (hasChoices) {
        // 2. 삭제된 보기 DELETE
        await Promise.all(deletedIds.map(id => qbankApi.choice.delete(id)))
        // 3. 변경된 기존 보기 PUT
        const existingChoices = choices.filter(c => c.id)
        await Promise.all(existingChoices.map(c => qbankApi.choice.update(c.id, { seq: c.seq, choiceText: c.choiceText, imageUrl: c.imageUrl || null, isCorrect: c.isCorrect })))
        // 4. 신규 보기 POST
        const newChoices = choices.filter(c => !c.id)
        for (const c of newChoices) {
          await qbankApi.choice.create(questionId, { seq: c.seq, choiceText: c.choiceText, imageUrl: c.imageUrl || null, isCorrect: c.isCorrect })
        }
      }

      onSaved()
    } catch { alert('저장 중 오류가 발생했습니다.') }
    finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ width: 900 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? '문항 수정' : '문항 등록'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="eai-modal-grid" style={{ gridTemplateColumns: hasChoices ? '1fr 1fr' : '1fr' }}>
            {/* ─── 좌: 문항 정보 ─── */}
            <div className="eai-modal-col">
              <div className="eai-form-section">
                <h4>문항 정보</h4>
                <div className="modal-field">
                  <label className="req">유형</label>
                  <select value={form.qType}
                    onChange={e => {
                      const t = e.target.value
                      setForm(f => ({ ...f, qType: t }))
                      if (t === 'subjective') setChoices([])
                      else if (choices.length === 0) setChoices([newChoice(1), newChoice(2)])
                    }}>
                    {Q_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="modal-field modal-field-v">
                  <label className="req">질문 내용</label>
                  <textarea rows={4} value={form.questionText}
                    placeholder="질문을 입력하세요"
                    onChange={e => setForm(f => ({ ...f, questionText: e.target.value }))} />
                </div>
                <div className="modal-field">
                  <label>문제 이미지</label>
                  <div className="qbank-img-upload-wrap">
                    <label className="qbank-img-upload-label">
                      📎 파일 선택
                      <input type="file" accept="image/*"
                        onChange={e => handleQuestionImgChange(e.target.files[0])} />
                    </label>
                    {form.imageUrl && <img src={form.imageUrl} className="qbank-img-preview" alt="미리보기" />}
                    {form.imageUrl && (
                      <button type="button" className="qbank-choice-del" title="이미지 제거"
                        onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}>✕</button>
                    )}
                  </div>
                </div>
                <div className="modal-field">
                  <label className="req">배점</label>
                  <input type="number" value={form.score} min={0} style={{ width: 80 }}
                    onChange={e => setForm(f => ({ ...f, score: Number(e.target.value) }))} />
                </div>
              </div>
            </div>

            {/* ─── 우: 보기 목록 (주관식 제외) ─── */}
            {hasChoices && (
              <div className="eai-modal-col">
                <div className="eai-form-section">
                  <h4>보기 ({choices.length}/8) — 정답에 체크</h4>
                  <div className="qbank-choice-list">
                    {choices.map((c) => (
                      <div key={c._key}>
                        <div className="qbank-choice-row">
                          <span className="qbank-choice-seq">{c.seq}</span>
                          <input
                            className="qbank-choice-text"
                            type="text"
                            value={c.choiceText}
                            placeholder="보기 텍스트"
                            onChange={e => updateChoice(c._key, 'choiceText', e.target.value)}
                          />
                          <label className="qbank-img-upload-label" title="이미지 업로드">
                            📎
                            <input type="file" accept="image/*"
                              onChange={e => handleChoiceImgChange(c._key, e.target.files[0])} />
                          </label>
                          <label className="qbank-choice-correct" title="정답">
                            {form.qType === 'single'
                              ? <input type="radio" name="correct" checked={c.isCorrect}
                                  onChange={() => setChoices(prev => prev.map(x => ({ ...x, isCorrect: x._key === c._key })))} />
                              : <input type="checkbox" checked={c.isCorrect}
                                  onChange={e => updateChoice(c._key, 'isCorrect', e.target.checked)} />
                            }
                            정답
                          </label>
                          <button className="qbank-choice-del" title="보기 삭제"
                            onClick={() => removeChoice(c._key, c.id)}>✕</button>
                        </div>
                        {c.imageUrl && (
                          <div style={{ paddingLeft: 26, marginTop: 4 }}>
                            <img src={c.imageUrl} className="qbank-img-preview" alt="보기 이미지" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button className="qbank-add-choice-btn" onClick={addChoice}>+ 보기 추가</button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose}>취소</button>
          <button className="modal-btn-save" onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

function QuestionEditor() {
  const { paperId } = useParams()
  const navigate    = useNavigate()
  const [paper,     setPaper]     = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(null) // null | { mode: 'new' } | { mode: 'edit', question }

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      qbankApi.paper.get(paperId),
      qbankApi.question.list(paperId),
    ]).then(([p, q]) => {
      setPaper(p)
      setQuestions(Array.isArray(q) ? q : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [paperId])

  useEffect(() => { load() }, [load])

  const handleDelete = async (q) => {
    if (!window.confirm(`문항 ${q.seq}번 [${q.questionText.slice(0, 20)}...]을 삭제하시겠습니까?`)) return
    try {
      const res = await qbankApi.question.delete(q.id)
      if (!handleQbankResponse(res)) return
      load()
    } catch { alert('삭제 중 오류가 발생했습니다.') }
  }

  return (
    <div className="content-area eai-compact">
      <div className="content-body">
        {/* 시험지 헤더 */}
        <div className="qbank-paper-header">
          <div>
            <div className="qbank-paper-title">{paper?.title ?? `시험지 #${paperId}`}</div>
            {paper && (
              <div className="qbank-paper-meta">
                <span>문항 {questions.length}개</span>
                {paper.timeLimitMin && <span>제한 {paper.timeLimitMin}분</span>}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="grid-add-btn" onClick={() => setModal({ mode: 'new' })}>+ 문항 추가</button>
            <button className="grid-search-btn" onClick={() => navigate('/admin/qbank/papers')}>목록으로</button>
          </div>
        </div>

        {/* 문항 목록 */}
        <div className="grid-container">
          <div className="grid-wrap">
            <table className="grid-table">
              <colgroup>
                <col style={{ width: 50 }} />
                <col style={{ width: 80 }} />
                <col />
                <col style={{ width: 60 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 48 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>순서</th>
                  <th>유형</th>
                  <th>질문</th>
                  <th>배점</th>
                  <th>보기 수</th>
                  <th className="action-cell"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="grid-loading">로딩 중...</td></tr>
                ) : questions.length === 0 ? (
                  <tr><td colSpan={6} className="grid-empty">등록된 문항이 없습니다. [+ 문항 추가]를 클릭하세요.</td></tr>
                ) : questions.map(q => (
                  <tr key={q.id}>
                    <td className="eai-cell-center">{q.seq}</td>
                    <td className="eai-cell-center">
                      <span className={`qbank-type-badge ${q.qType}`}>{TYPE_LABEL[q.qType] ?? q.qType}</span>
                    </td>
                    <td style={{ maxWidth: 400 }}>{q.questionText}</td>
                    <td className="eai-cell-center">{q.score}점</td>
                    <td className="eai-cell-center">{q.choices?.length ?? 0}개</td>
                    <td className="action-cell">
                      <ActionMenu
                        row={q}
                        onEdit={(row) => setModal({ mode: 'edit', question: row })}
                        onDelete={handleDelete}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal && (
        <QuestionModal
          paperId={paperId}
          question={modal.mode === 'edit' ? modal.question : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}

export default QuestionEditor
