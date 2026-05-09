// ============================================================
// 채점 관리 — 응시 세션 목록 → 답안지 조회 → 주관식 수동 채점
// 라우트: /admin/qbank/sessions
// 자동채점(autoGrade:true) + 수동채점(manualGrades)을 한 번에 POST /grade
// ============================================================
import { useEffect, useState } from 'react'
import qbankApi, { handleQbankResponse } from '../../api/qbankApi'
import '../../../portal/common/css/grid.css'
import '../../qbank.css'

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M10 18a7.952 7.952 0 004.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A8 8 0 1010 18zm0-14a6 6 0 110 12A6 6 0 0110 4z" />
    </svg>
  )
}

function GradeList() {
  const [sessions,      setSessions]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [filter,        setFilter]        = useState({ paperId: '', examineeName: '' })
  const [selected,      setSelected]      = useState(null)   // 선택된 세션
  const [answers,       setAnswers]       = useState([])     // 답안지 목록
  const [answerLoading, setAnswerLoading] = useState(false)
  // manualGrades: { [questionId]: true | false | null }
  const [manualGrades,  setManualGrades]  = useState({})
  const [grading,       setGrading]       = useState(false)

  const load = () => {
    setLoading(true)
    qbankApi.session.list(filter)
      .then(data => setSessions(Array.isArray(data) ? data : []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const selectSession = async (session) => {
    setSelected(session)
    setManualGrades({})
    setAnswerLoading(true)
    try {
      const data = await qbankApi.session.answers(session.id)
      setAnswers(Array.isArray(data) ? data : [])
    } catch {
      setAnswers([])
    } finally {
      setAnswerLoading(false)
    }
  }

  const setGrade = (questionId, isCorrect) => {
    setManualGrades(prev => ({ ...prev, [questionId]: isCorrect }))
  }

  const handleGrade = async () => {
    if (!selected) return
    const manualList = Object.entries(manualGrades)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([questionId, isCorrect]) => ({ questionId: Number(questionId), isCorrect }))

    setGrading(true)
    try {
      const res = await qbankApi.session.grade(selected.id, { autoGrade: true, manualGrades: manualList })
      if (!handleQbankResponse(res)) return
      alert('채점이 완료되었습니다.')
      load()
      selectSession(selected)
    } catch { alert('채점 중 오류가 발생했습니다.') }
    finally { setGrading(false) }
  }

  // 주관식 답안 여부
  const isSubjective = (answer) => answer.answerText !== null && answer.answerText !== undefined

  return (
    <div className="content-area eai-compact">
      <div className="content-body">
        {/* ─── 세션 목록 ─── */}
        <div className="grid-container" style={{ marginBottom: 20 }}>
          <div className="grid-toolbar">
            <span className="grid-title">응시 세션</span>
            <div className="grid-toolbar-right">
              <input type="number" className="grid-date-input" style={{ width: 100 }}
                placeholder="시험지ID"
                value={filter.paperId}
                onChange={e => setFilter(f => ({ ...f, paperId: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && load()} />
              <div className="grid-search-bar">
                <input type="text" placeholder="응시자명"
                  value={filter.examineeName}
                  onChange={e => setFilter(f => ({ ...f, examineeName: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && load()} />
                <button className="grid-search-btn" onClick={load}><SearchIcon /></button>
              </div>
            </div>
          </div>

          <div className="grid-wrap">
            <table className="grid-table">
              <colgroup>
                <col style={{ width: 60 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 100 }} />
                <col />
                <col style={{ width: 80 }} />
                <col style={{ width: 130 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>시험지ID</th>
                  <th>응시자명</th>
                  <th>사번</th>
                  <th>제출일시</th>
                  <th>총점</th>
                  <th>채점 상태</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="grid-loading">로딩 중...</td></tr>
                ) : sessions.length === 0 ? (
                  <tr><td colSpan={7} className="grid-empty">데이터가 없습니다.</td></tr>
                ) : sessions.map(s => (
                  <tr key={s.id}
                    onClick={() => selectSession(s)}
                    style={{ cursor: 'pointer', background: selected?.id === s.id ? '#eef2ff' : '' }}>
                    <td>{s.id}</td>
                    <td className="eai-cell-center">{s.examPaperId ?? s.examPaperTitle ?? '-'}</td>
                    <td>{s.examineeName}</td>
                    <td>{s.examineeNo ?? '-'}</td>
                    <td>{s.submittedAt ? String(s.submittedAt).slice(0, 16) : '미제출'}</td>
                    <td className="eai-cell-center">{s.totalScore ?? '-'}</td>
                    <td className="eai-cell-center">
                      <span className={`eai-status-badge ${s.totalScore != null ? 'ACTIVE' : 'INACTIVE'}`}>
                        {s.totalScore != null ? '채점완료' : '미채점'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── 답안지 패널 (세션 선택 시 표시) ─── */}
        {selected && (
          <div className="qbank-answer-panel">
            <h4>
              답안지 — {selected.examineeName} ({selected.examineeNo ?? '-'})
              {selected.submittedAt && <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 8, fontSize: '0.75rem' }}>제출: {String(selected.submittedAt).slice(0, 16)}</span>}
            </h4>

            {answerLoading ? (
              <p style={{ color: '#9ca3af', fontSize: '0.82rem' }}>답안지를 불러오는 중...</p>
            ) : answers.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '0.82rem' }}>제출된 답안이 없습니다.</p>
            ) : (
              <>
                {answers.map((a, i) => (
                  <div className="qbank-answer-row" key={a.id ?? i}>
                    <span className="qbank-answer-seq">{i + 1}</span>
                    <div className="qbank-answer-question">{a.questionText ?? `문항 ID ${a.questionId}`}</div>
                    <div className="qbank-answer-value">
                      {isSubjective(a)
                        ? <span style={{ color: '#374151' }}>{a.answerText}</span>
                        : <span style={{ color: '#374151' }}>{a.choiceText ?? `보기 #${a.selectedChoice}`}</span>
                      }
                    </div>
                    <div>
                      {/* 자동채점 결과 표시 or 주관식 수동채점 버튼 */}
                      {isSubjective(a) ? (
                        <div className="qbank-grade-btns">
                          <button
                            className={`qbank-grade-btn correct ${manualGrades[a.questionId] === true ? 'active' : ''}`}
                            onClick={() => setGrade(a.questionId, true)}>정답</button>
                          <button
                            className={`qbank-grade-btn wrong ${manualGrades[a.questionId] === false ? 'active' : ''}`}
                            onClick={() => setGrade(a.questionId, false)}>오답</button>
                        </div>
                      ) : (
                        a.isCorrect != null && (
                          <span className={`eai-status-badge ${a.isCorrect ? 'ACTIVE' : 'ERROR'}`} style={{ fontSize: 11 }}>
                            {a.isCorrect ? '정답' : '오답'}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="modal-btn-save" onClick={handleGrade} disabled={grading}>
                    {grading ? '채점 중...' : '채점 저장'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default GradeList
