// ============================================================
// 시험 응시 화면 — 문항 렌더링 + 답안 수집 + 제출
// 라우트: /exam/room/:sessionId
// state로 session/paper 정보 수신 (ExamEntry에서 navigate 시 전달)
// questions/choices는 session 응답에 포함되어 있다고 가정
//   → 없을 경우 별도 조회 필요 (백엔드 응답 구조에 따라 unwrap 처리)
// ============================================================
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import qbankApi from '../../api/qbankApi'
import serverConfig from '../../../config/serverConfig'
import '../../qbank.css'


function ExamRoom() {
  const { sessionId } = useParams()
  const location      = useLocation()
  const navigate      = useNavigate()

  const stateSession  = location.state?.session
  const statePaper    = location.state?.paper

  const [questions,  setQuestions]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [answers,    setAnswers]    = useState({}) // { [questionId]: { selectedChoiceId, selectedChoiceIds, answerText } }
  const [showModal,  setShowModal]  = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(false)
  const [paperTitle, setPaperTitle] = useState(statePaper?.title ?? '시험')
  const [examineeName] = useState(stateSession?.examineeName ?? '')
  const isLoggedIn = !serverConfig.token.isExpired()

  useEffect(() => {
    // session 응답에 questions 포함 여부 확인
    const qs = stateSession?.questions
    if (Array.isArray(qs) && qs.length > 0) {
      setQuestions(qs)
      setLoading(false)
      return
    }
    // questions가 없으면 paper 정보에서 paperId 를 얻어 문항 조회
    const paperId = stateSession?.examPaperId ?? statePaper?.id
    if (paperId) {
      qbankApi.exam.papers({ typeId: statePaper?.examTypeId, subjectId: statePaper?.examSubjectId })
        .catch(() => [])
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [stateSession, statePaper])

  // 답변 상태 초기화
  useEffect(() => {
    const initial = {}
    questions.forEach(q => {
      initial[q.id] = { selectedChoiceId: null, selectedChoiceIds: [], answerText: '' }
    })
    setAnswers(initial)
  }, [questions])

  const setSingle = (questionId, choiceId) => {
    setAnswers(prev => ({ ...prev, [questionId]: { ...prev[questionId], selectedChoiceId: choiceId } }))
  }

  const toggleMulti = (questionId, choiceId) => {
    setAnswers(prev => {
      const current = prev[questionId]?.selectedChoiceIds ?? []
      const next = current.includes(choiceId)
        ? current.filter(id => id !== choiceId)
        : [...current, choiceId]
      return { ...prev, [questionId]: { ...prev[questionId], selectedChoiceIds: next } }
    })
  }

  const setSubjective = (questionId, text) => {
    setAnswers(prev => ({ ...prev, [questionId]: { ...prev[questionId], answerText: text } }))
  }

  // 미응답 문항 수 계산
  const unansweredCount = questions.filter(q => {
    const a = answers[q.id]
    if (!a) return true
    if (q.qType === 'single')      return !a.selectedChoiceId
    if (q.qType === 'multi')       return a.selectedChoiceIds.length === 0
    if (q.qType === 'subjective')  return !a.answerText.trim()
    return false
  }).length

  const answeredCount = questions.length - unansweredCount

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // 답안 배열 구성
      const answerList = []
      questions.forEach(q => {
        const a = answers[q.id]
        if (!a) return
        if (q.qType === 'single' && a.selectedChoiceId) {
          answerList.push({ questionId: q.id, selectedChoiceId: a.selectedChoiceId })
        } else if (q.qType === 'multi') {
          a.selectedChoiceIds.forEach(cid => {
            answerList.push({ questionId: q.id, selectedChoiceId: cid })
          })
        } else if (q.qType === 'subjective' && a.answerText.trim()) {
          answerList.push({ questionId: q.id, answerText: a.answerText.trim() })
        }
      })

      await qbankApi.exam.submit(sessionId, { answers: answerList })
      setDone(true)
    } catch {
      alert('제출 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
      setShowModal(false)
    }
  }

  if (loading) {
    return (
      <div className="exam-layout">
        <header className="exam-header"><span className="exam-header-title">시험 로딩 중...</span></header>
        <div className="exam-body"><p style={{ color: '#6b7280', textAlign: 'center', marginTop: 60 }}>문항을 불러오는 중입니다...</p></div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="exam-layout">
        <header className="exam-header"><span className="exam-header-title">{paperTitle}</span></header>
        <div className="exam-body">
          <div className="exam-done-card">
            <div className="exam-done-icon">✅</div>
            <h2>제출이 완료되었습니다.</h2>
            <p>수고하셨습니다, {examineeName}님.<br />결과는 담당자에게 문의해주세요.</p>
            {isLoggedIn && (
              <button className="exam-start-btn" style={{ marginTop: 24 }} onClick={() => navigate('/portal')}>
                포털로 돌아가기
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="exam-layout">
        <header className="exam-header"><span className="exam-header-title">{paperTitle}</span></header>
        <div className="exam-body">
          <div className="exam-done-card">
            <p>문항 데이터를 불러올 수 없습니다.<br />관리자에게 문의해주세요.</p>
            <button className="exam-start-btn" style={{ marginTop: 24 }} onClick={() => navigate('/exam')}>돌아가기</button>
          </div>
        </div>
      </div>
    )
  }

  const progressPct = Math.round((answeredCount / questions.length) * 100)

  return (
    <div className="exam-layout">
      <header className="exam-header">
        <span className="exam-header-title">{paperTitle}</span>
        <span className="exam-header-info">{examineeName} | {answeredCount}/{questions.length} 응답</span>
      </header>

      <div className="exam-body">
        {/* 진행률 바 */}
        <div className="exam-progress">
          <span>{answeredCount}문항 응답</span>
          <div className="exam-progress-bar">
            <div className="exam-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <span>전체 {questions.length}문항</span>
        </div>

        {/* 문항 목록 */}
        {questions.map((q) => {
          const a = answers[q.id] ?? {}
          return (
            <div className="exam-question-card" key={q.id}>
              <div className="exam-question-header">
                <div className="exam-question-num">{q.seq}</div>
                <div className="exam-question-text">{q.questionText}</div>
                <div className="exam-question-score">{q.score}점</div>
              </div>

              {q.imageUrl && (
                <img src={q.imageUrl} className="exam-question-img" alt="문제 이미지" />
              )}

              {/* 단일선택 */}
              {q.qType === 'single' && (
                <div className="exam-choices">
                  {(q.choices ?? []).map(c => (
                    <label
                      key={c.id}
                      className={`exam-choice-item ${a.selectedChoiceId === c.id ? 'selected' : ''}`}
                      onClick={() => setSingle(q.id, c.id)}
                    >
                      <input type="radio" name={`q${q.id}`} checked={a.selectedChoiceId === c.id} onChange={() => setSingle(q.id, c.id)} />
                      <div className="exam-choice-label">
                        {c.choiceText && <span>{c.seq}. {c.choiceText}</span>}
                        {c.imageUrl   && <img src={c.imageUrl} className="exam-choice-img" alt="보기 이미지" />}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* 다중선택 */}
              {q.qType === 'multi' && (
                <div className="exam-choices">
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0 0 8px 40px' }}>※ 해당하는 것을 모두 선택하세요.</p>
                  {(q.choices ?? []).map(c => {
                    const checked = (a.selectedChoiceIds ?? []).includes(c.id)
                    return (
                      <label
                        key={c.id}
                        className={`exam-choice-item ${checked ? 'selected' : ''}`}
                        onClick={() => toggleMulti(q.id, c.id)}
                      >
                        <input type="checkbox" checked={checked} onChange={() => toggleMulti(q.id, c.id)} />
                        <div className="exam-choice-label">
                          {c.choiceText && <span>{c.seq}. {c.choiceText}</span>}
                          {c.imageUrl   && <img src={c.imageUrl} className="exam-choice-img" alt="보기 이미지" />}
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}

              {/* 주관식 */}
              {q.qType === 'subjective' && (
                <div className="exam-subjective">
                  <textarea
                    placeholder="답안을 입력하세요"
                    value={a.answerText ?? ''}
                    onChange={e => setSubjective(q.id, e.target.value)}
                    rows={4}
                  />
                </div>
              )}
            </div>
          )
        })}

        {/* 제출 버튼 */}
        <div className="exam-submit-area">
          <button className="exam-submit-btn" onClick={() => setShowModal(true)}>
            답안 제출
          </button>
        </div>
      </div>

      {/* 제출 확인 모달 */}
      {showModal && (
        <div className="exam-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="exam-modal-box" onClick={e => e.stopPropagation()}>
            <h3>답안을 제출하시겠습니까?</h3>
            <p>
              {unansweredCount > 0
                ? `미응답 문항이 ${unansweredCount}개 있습니다.\n제출 후에는 수정할 수 없습니다.`
                : '모든 문항에 응답하셨습니다.\n제출 후에는 수정할 수 없습니다.'
              }
            </p>
            <div className="exam-modal-actions">
              <button className="exam-modal-cancel" onClick={() => setShowModal(false)}>계속 풀기</button>
              <button className="exam-modal-confirm" onClick={handleSubmit} disabled={submitting}>
                {submitting ? '제출 중...' : '제출'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExamRoom
