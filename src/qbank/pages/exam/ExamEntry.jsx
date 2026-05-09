// ============================================================
// 응시자 입장 — 이름·사번 입력 + 시험종류/대상 선택 → 시험 시작
// 라우트: /exam  (포털 레이아웃 없는 독립 화면)
// 시험 시작 POST 성공 시 반환된 sessionId 로 ExamRoom 이동
// ============================================================
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import qbankApi from '../../api/qbankApi'
import serverConfig from '../../../config/serverConfig'
import '../../qbank.css'

function ExamEntry() {
  const navigate   = useNavigate()
  const tokenUser  = serverConfig.token.isExpired() ? null : serverConfig.token.payload()
  const isLoggedIn = tokenUser !== null

  const [types,    setTypes]    = useState([])
  const [subjects, setSubjects] = useState([])
  const [papers,   setPapers]   = useState([])
  const [form, setForm] = useState({
    examineeName: tokenUser?.userName ?? '',
    examineeNo:   tokenUser?.userId   ?? '',
    typeId: '', subjectId: '', paperId: '',
  })
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    qbankApi.exam.types().then(setTypes).catch(() => setTypes([]))
    qbankApi.exam.subjects().then(setSubjects).catch(() => setSubjects([]))
  }, [])

  // 시험종류 + 시험대상이 모두 선택될 때 활성 시험지 조회
  useEffect(() => {
    if (!form.typeId || !form.subjectId) { setPapers([]); setForm(f => ({ ...f, paperId: '' })); return }
    qbankApi.exam.papers({ typeId: form.typeId, subjectId: form.subjectId })
      .then(data => {
        const list = Array.isArray(data) ? data : []
        setPapers(list)
        setForm(f => ({ ...f, paperId: list.length === 1 ? String(list[0].id) : '' }))
      })
      .catch(() => setPapers([]))
  }, [form.typeId, form.subjectId])

  const handleStart = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.examineeName.trim()) { setError('이름을 입력해주세요.'); return }
    if (!form.examineeNo.trim())   { setError('사번을 입력해주세요.'); return }
    if (!form.paperId)             { setError('시험지를 선택해주세요.'); return }

    setLoading(true)
    try {
      const res = await qbankApi.exam.start({
        examPaperId:  Number(form.paperId),
        examineeName: form.examineeName.trim(),
        examineeNo:   form.examineeNo.trim(),
      })
      const sessionId = res?.data?.id ?? res?.sessionId ?? res?.id
      if (!sessionId) { setError('시험 시작에 실패했습니다. 다시 시도해주세요.'); return }
      navigate(`/exam/room/${sessionId}`, { state: { session: res?.data ?? res, paper: papers.find(p => p.id === Number(form.paperId)) } })
    } catch {
      setError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="exam-layout">
      <header className="exam-header">
        <span className="exam-header-title">Saffron 시험 시스템</span>
        {isLoggedIn && (
          <button className="exam-back-btn" type="button" onClick={() => navigate('/portal')}>
            ← 포털로 돌아가기
          </button>
        )}
      </header>

      <div className="exam-body">
        <div className="exam-entry-card">
          <h2>시험 응시</h2>
          <p>아래 정보를 확인하고 시험을 시작하세요.</p>

          <form className="exam-entry-form" onSubmit={handleStart}>
            <div className="exam-field">
              <label className="req">이름</label>
              <input
                type="text"
                placeholder="홍길동"
                value={form.examineeName}
                readOnly={isLoggedIn && !!tokenUser?.userName}
                className={isLoggedIn && tokenUser?.userName ? 'exam-field-readonly' : ''}
                onChange={e => setForm(f => ({ ...f, examineeName: e.target.value }))}
              />
            </div>
            <div className="exam-field">
              <label className="req">사번 / 학번</label>
              <input
                type="text"
                placeholder="20240001"
                value={form.examineeNo}
                readOnly={isLoggedIn && !!tokenUser?.userId}
                className={isLoggedIn && tokenUser?.userId ? 'exam-field-readonly' : ''}
                onChange={e => setForm(f => ({ ...f, examineeNo: e.target.value }))}
              />
            </div>
            <div className="exam-field">
              <label className="req">시험종류</label>
              <select value={form.typeId}
                onChange={e => setForm(f => ({ ...f, typeId: e.target.value, subjectId: '', paperId: '' }))}>
                <option value="">선택하세요</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="exam-field">
              <label className="req">시험대상</label>
              <select value={form.subjectId} disabled={!form.typeId}
                onChange={e => setForm(f => ({ ...f, subjectId: e.target.value, paperId: '' }))}>
                <option value="">선택하세요</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}{s.grade ? ` (${s.grade})` : ''}</option>)}
              </select>
            </div>
            {papers.length > 1 && (
              <div className="exam-field">
                <label className="req">시험지</label>
                <select value={form.paperId}
                  onChange={e => setForm(f => ({ ...f, paperId: e.target.value }))}>
                  <option value="">선택하세요</option>
                  {papers.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
            )}
            {papers.length === 0 && form.typeId && form.subjectId && (
              <div className="exam-error">선택한 조건에 해당하는 활성 시험지가 없습니다.</div>
            )}
            {error && <div className="exam-error">{error}</div>}
            <button type="submit" className="exam-start-btn" disabled={loading || papers.length === 0}>
              {loading ? '시작 중...' : '시험 시작'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ExamEntry
