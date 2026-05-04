// ============================================================
// KpiCard — 대시보드 단일 지표 카드
// 사용처: Dashboard, Monitoring (kpi-grid 안에서 4열 그리드로 배치됨)
// props: label(상단 작은 글자), value(큰 숫자), sub(단위 등 부가 텍스트)
// ============================================================
function KpiCard({ label, value, sub }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}

export default KpiCard
