// ============================================================
// StatusBadge — 상태 코드 → 색상 배지
// status 문자열을 그대로 className에 붙여 CSS 클래스(.SUCCESS/.FAIL/.RETRY/.DLQ/...)로 매칭.
// 백엔드 enum이 그대로 시각화되므로 새 상태 추가 시 eai.css에도 색상 추가 필요.
// ============================================================
function StatusBadge({ status }) {
  return <span className={`eai-status-badge ${status ?? ''}`}>{status ?? '-'}</span>
}

export default StatusBadge
