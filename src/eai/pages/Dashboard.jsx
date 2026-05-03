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
      .catch(() => {})
      .finally(() => setLoading(false))
  }

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
