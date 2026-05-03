import { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import eaiApi from '../api/eaiApi'
import '../eai.css'

function MetricCard({ label, value, unit = '', warn, danger }) {
  let bg = '#fff'
  if (danger && value >= danger) bg = '#fee2e2'
  else if (warn && value >= warn)  bg = '#fef9c3'
  return (
    <div className="kpi-card" style={{ background: bg }}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{typeof value === 'number' ? value.toLocaleString() : (value ?? '-')}{unit}</div>
    </div>
  )
}

function Monitoring() {
  const [snap, setSnap]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState([])

  const load = () => {
    eaiApi.monitoring.snapshot()
      .then(data => {
        setSnap(data)
        setHistory(h => [...h.slice(-29), {
          time: new Date().toLocaleTimeString('ko', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          lag:  data.kafkaConsumerLag ?? 0,
          tps:  data.currentTps ?? 0,
          dlq:  data.dlqCount ?? 0,
        }])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const timer = setInterval(load, 5000)
    return () => clearInterval(timer)
  }, [])

  if (loading) return <div className="dashboard-area"><p>로딩 중...</p></div>

  return (
    <div className="dashboard-area">
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#1e293b' }}>실시간 모니터링</h2>

      <div className="kpi-grid">
        <MetricCard label="Kafka Consumer Lag" value={snap?.kafkaConsumerLag} warn={500} danger={1000} />
        <MetricCard label="현재 TPS"            value={snap?.currentTps} unit="tps" />
        <MetricCard label="DLQ 잔여"            value={snap?.dlqCount} warn={50} danger={100} />
        <MetricCard label="평균 응답시간"        value={snap?.avgResponseMs} unit="ms" warn={2000} danger={5000} />
      </div>

      {snap?.kafkaConsumerLag > 1000 && (
        <div className="eai-alert danger">Kafka Consumer Lag {snap.kafkaConsumerLag.toLocaleString()}건 초과 — 즉시 확인 필요</div>
      )}
      {snap?.dlqCount > 100 && (
        <div className="eai-alert danger">DLQ {snap.dlqCount}건 누적 — 수동 재처리 필요</div>
      )}

      <div className="chart-section">
        <h3>Kafka Lag 추이 (실시간)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={history}>
            <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="lag" stroke="#ef4444" strokeWidth={2} dot={false} name="Lag" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-section">
        <h3>TPS / DLQ 추이</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={history}>
            <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="tps" fill="#2563eb" name="TPS" />
            <Bar dataKey="dlq" fill="#f97316" name="DLQ" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {snap?.hourlyTrend?.length > 0 && (
        <div className="chart-section">
          <h3>시간별 처리량</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={snap.hourlyTrend}>
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default Monitoring
