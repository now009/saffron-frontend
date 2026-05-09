import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import qbankApi from '../../api/qbankApi'
import '../../../portal/common/css/SaffronMain.css'
import '../../../portal/common/css/grid.css'

const NAV_CARDS = [
  { label: '시험지 관리',     sub: '시험지 등록·수정·문항 편집',    path: '/admin/qbank/papers',   icon: '📄' },
  { label: '시험유형/대상',   sub: '시험종류·시험대상 마스터 관리', path: '/admin/qbank/types',    icon: '🗂️' },
  { label: '채점 관리',       sub: '응시 결과 조회·주관식 채점',    path: '/admin/qbank/sessions', icon: '✅' },
]

function KpiCard({ label, value }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
      padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e2530', lineHeight: 1 }}>{value}</span>
    </div>
  )
}

function QbankDashboard() {
  const navigate = useNavigate()
  const [counts,   setCounts]   = useState({ papers: '-', types: '-', subjects: '-', sessions: '-' })
  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.allSettled([
      qbankApi.paper.list(),
      qbankApi.examType.list(),
      qbankApi.examSubject.list(),
      qbankApi.session.list(),
    ]).then(([papers, types, subjects, sess]) => {
      const toArr = (r) => (r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : [])
      const p = toArr(papers)
      const t = toArr(types)
      const s = toArr(subjects)
      const se = toArr(sess)
      setCounts({ papers: p.length, types: t.length, subjects: s.length, sessions: se.length })
      setSessions(se.slice(0, 5))
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="dashboard-area">
      <div className="dashboard-welcome">
        <h2>QBANK 관리</h2>
        <p>시험지·문항을 등록하고 응시 결과를 관리하세요.</p>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 24 }}>
        <KpiCard label="시험지"   value={loading ? '...' : String(counts.papers)}   />
        <KpiCard label="시험종류" value={loading ? '...' : String(counts.types)}    />
        <KpiCard label="시험대상" value={loading ? '...' : String(counts.subjects)} />
        <KpiCard label="총 응시"  value={loading ? '...' : String(counts.sessions)} />
      </div>

      {/* 바로가기 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 20 }}>
        {NAV_CARDS.map(c => (
          <button
            key={c.path}
            onClick={() => navigate(c.path)}
            style={{
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
              padding: '18px 20px', textAlign: 'left', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 14,
              transition: 'box-shadow 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f7ef8'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(79,126,248,0.12)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <span style={{ fontSize: 28 }}>{c.icon}</span>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e2530' }}>{c.label}</div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 3 }}>{c.sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* 최근 응시 현황 */}
      <div className="grid-container" style={{ marginTop: 24 }}>
        <div className="grid-toolbar">
          <span className="grid-title">최근 응시 현황</span>
          <div className="grid-toolbar-right">
            <button className="grid-add-btn" onClick={() => navigate('/admin/qbank/sessions')}>
              전체 보기
            </button>
          </div>
        </div>
        <div className="grid-wrap">
          <table className="grid-table">
            <colgroup>
              <col style={{ width: '80px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '120px' }} />
              <col />
              <col style={{ width: '90px' }} />
              <col style={{ width: '120px' }} />
            </colgroup>
            <thead>
              <tr>
                <th>ID</th>
                <th>응시자명</th>
                <th>사번</th>
                <th>시험지</th>
                <th>점수</th>
                <th>응시일시</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="grid-loading">데이터를 불러오는 중...</td></tr>
              ) : sessions.length === 0 ? (
                <tr><td colSpan={6} className="grid-empty">응시 내역이 없습니다.</td></tr>
              ) : sessions.map(s => (
                <tr key={s.id} onClick={() => navigate('/admin/qbank/sessions')} style={{ cursor: 'pointer' }}>
                  <td>{s.id}</td>
                  <td>{s.examineeName ?? '-'}</td>
                  <td>{s.examineeNo ?? '-'}</td>
                  <td>{s.paperTitle ?? s.examPaperId ?? '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    {s.totalScore != null ? `${s.totalScore}점` : '-'}
                  </td>
                  <td>{s.startedAt ? String(s.startedAt).slice(0, 16).replace('T', ' ') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default QbankDashboard
