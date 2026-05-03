function StatusBadge({ status }) {
  return <span className={`eai-status-badge ${status ?? ''}`}>{status ?? '-'}</span>
}

export default StatusBadge
