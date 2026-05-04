// ============================================================
// EAI 대시보드 — 운영 KPI + 시간별 차트
// 라우트: /eai
// 데이터: monitoring.snapshot() 단일 API, 10초 폴링
// 임계치 도달 시 경고 배너(Kafka Lag>1000, DLQ>100) 자동 노출
// ============================================================
import { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import KpiCard from '../components/KpiCard'
import eaiApi from '../api/eaiApi'
import '../eai.css'

function Dashboard() {
  const [snap, setSnap] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    eaiApi.monitoring.snapshot()
      .then(setSnap)
      .catch(() => {})  // 폴링 실패 시 직전 데이터 유지 — 잠깐의 네트워크 끊김에 화면이 비지 않게
      .finally(() => setLoading(false))
  }

  // 10초 주기 폴링 — 페이지 이탈 시 cleanup으로 인터벌 해제 (메모리 누수 방지)
  useEffect(() => {
    load()
    const timer = setInterval(load, 10000)
    return () => clearInterval(timer)
  }, [])

  if (loading) return <div className="dashboard-area"><p>로딩 중...</p></div>
  if (!snap) return <div className="dashboard-area"><p>데이터를 불러올 수 없습니다.</p></div>

  return (
    <div className="dashboard-area">
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#1e293b' }}>EAI 대시보드</h2>

      <div className="kpi-grid">
        <KpiCard label="오늘 처리 건수"    value={(snap.todayCount ?? 0).toLocaleString()} sub="건" />
        <KpiCard label="성공률"            value={`${(snap.successRate ?? 0).toFixed(1)}%`} />
        <KpiCard label="평균 응답시간"     value={`${snap.avgResponseMs ?? 0}ms`} />
        <KpiCard label="활성 인터페이스"   value={String(snap.activeInterfaceCount ?? 0)} sub="개" />
      </div>

      {/* ─── 임계치 경고 배너 (조건부 노출) ─── */}
      {snap.kafkaConsumerLag > 1000 && (
        <div className="eai-alert warning">
          Kafka Consumer Lag: {snap.kafkaConsumerLag.toLocaleString()}건 — 처리 지연 발생
        </div>
      )}
      {snap.dlqCount > 100 && (
        <div className="eai-alert danger">
          DLQ 잔여 {snap.dlqCount}건 — 수동 재처리 필요
        </div>
      )}

      {/* ─── 시간별 처리량 라인차트 (백엔드 hourlyTrend 배열 비어있으면 미노출) ─── */}
      {snap.hourlyTrend?.length > 0 && (
        <div className="chart-section">
          <h3>시간별 처리량</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={snap.hourlyTrend}>
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ─── 오류 유형별 발생 건수 바차트 ─── */}
      {snap.errorBreakdown?.length > 0 && (
        <div className="chart-section">
          <h3>오류 유형별 현황</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={snap.errorBreakdown}>
              <XAxis dataKey="type" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default Dashboard
