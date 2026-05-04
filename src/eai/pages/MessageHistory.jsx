// ============================================================
// 메시지 처리 이력 — 인터페이스가 처리한 모든 메시지의 송수신 기록
// 라우트: /eai/history
// 동작: 상태/날짜/인터페이스ID 필터, 행 클릭 시 모달로 요청·응답 본문 표시
//       FAIL/DLQ 상태 메시지에서만 재처리 버튼 노출
// ============================================================
import { useEffect, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import MessageViewer from '../components/MessageViewer'
import eaiApi from '../api/eaiApi'
import '../eai.css'

const STATUS_OPTIONS = ['', 'SUCCESS', 'FAIL', 'RETRY', 'DLQ']

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M10 18a7.952 7.952 0 004.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A8 8 0 1010 18zm0-14a6 6 0 110 12A6 6 0 0110 4z" />
    </svg>
  )
}

function MessageHistory() {
  const [list, setList]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [retrying, setRetrying] = useState(false)
  const [filter, setFilter]     = useState({ interfaceId: '', status: '', dateFrom: '', dateTo: '' })

  const load = () => {
    setLoading(true)
    eaiApi.message.list(filter)
      .then(data => setList(Array.isArray(data) ? data : (data.content ?? [])))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleRetry = () => {
    if (!window.confirm('선택한 메시지를 재처리하시겠습니까?')) return
    setRetrying(true)
    eaiApi.message.retry(selected.id)
      .then(() => { alert('재처리 요청이 완료되었습니다.'); setSelected(null); load() })
      .catch(() => alert('재처리 중 오류가 발생했습니다.'))
      .finally(() => setRetrying(false))
  }

  return (
    <div className="content-area">
      <div className="content-body">
        <div className="grid-container">
          <div className="grid-toolbar">
            <div className="grid-toolbar-left">
              <span className="grid-title">메시지 이력</span>
            </div>
            <div className="grid-toolbar-right">
              <select
                className="site-select"
                value={filter.status}
                onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
              >
                <option value="">전체 상태</option>
                {STATUS_OPTIONS.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input
                className="grid-date-input"
                type="date"
                value={filter.dateFrom}
                onChange={e => setFilter(f => ({ ...f, dateFrom: e.target.value }))}
              />
              <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>~</span>
              <input
                className="grid-date-input"
                type="date"
                value={filter.dateTo}
                onChange={e => setFilter(f => ({ ...f, dateTo: e.target.value }))}
              />
              <div className="grid-search-bar">
                <input
                  type="text"
                  placeholder="인터페이스ID"
                  value={filter.interfaceId}
                  onChange={e => setFilter(f => ({ ...f, interfaceId: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && load()}
                />
                <button className="grid-search-btn" onClick={load}><SearchIcon /></button>
              </div>
            </div>
          </div>

          <div className="grid-wrap">
            <table className="grid-table">
              <colgroup>
                <col style={{ width: 80 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 90 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 150 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>인터페이스ID</th>
                  <th>송신</th>
                  <th>수신</th>
                  <th>방향</th>
                  <th>상태</th>
                  <th>처리(ms)</th>
                  <th>수신일시</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="grid-loading">로딩 중...</td></tr>
                ) : list.length === 0 ? (
                  <tr><td colSpan={8} className="grid-empty">데이터가 없습니다.</td></tr>
                ) : list.map(item => (
                  <tr key={item.id} onClick={() => setSelected(item)} style={{ cursor: 'pointer' }}>
                    <td>{item.id}</td>
                    <td>{item.interfaceId}</td>
                    <td>{item.sourceSystem}</td>
                    <td>{item.targetSystem}</td>
                    <td>{item.direction}</td>
                    <td><StatusBadge status={item.status} /></td>
                    <td style={{ textAlign: 'right' }}>{item.processingMs}</td>
                    <td>{item.createdAt ? String(item.createdAt).slice(0, 16) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── 메시지 상세 모달 — 행 클릭 시 표시, 외부 클릭 시 닫힘 ─── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" style={{ width: 720, maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">메시지 상세 (ID: {selected.id})</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', marginBottom: 16 }}>
                {[
                  ['인터페이스', selected.interfaceId],
                  ['상태',       <StatusBadge status={selected.status} />],
                  ['송신',       selected.sourceSystem],
                  ['수신',       selected.targetSystem],
                  ['처리시간',   `${selected.processingMs}ms`],
                  ['수신일시',   selected.createdAt ? String(selected.createdAt).slice(0, 16) : '-'],
                ].map(([k, v]) => (
                  <div key={k} style={{ fontSize: '0.85rem' }}>
                    <span style={{ color: '#6b7280', fontWeight: 600, marginRight: 6 }}>{k}</span>{v}
                  </div>
                ))}
              </div>

              {selected.errorMessage && (
                <div className="eai-alert danger">{selected.errorMessage}</div>
              )}

              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4b5563', margin: '12px 0 4px' }}>요청 메시지</p>
              <MessageViewer value={selected.requestBody} />

              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4b5563', margin: '12px 0 4px' }}>응답 메시지</p>
              <MessageViewer value={selected.responseBody} />
            </div>

            {/* 재처리는 FAIL/DLQ에서만 의미 있음 — SUCCESS/RETRY 상태는 닫기 버튼만 */}
            {['FAIL', 'DLQ'].includes(selected.status) && (
              <div className="modal-footer">
                <button className="modal-btn-save" onClick={handleRetry} disabled={retrying}>
                  {retrying ? '처리 중...' : '재처리'}
                </button>
                <button className="modal-btn-cancel" onClick={() => setSelected(null)}>닫기</button>
              </div>
            )}
            {!['FAIL', 'DLQ'].includes(selected.status) && (
              <div className="modal-footer">
                <button className="modal-btn-cancel" onClick={() => setSelected(null)}>닫기</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MessageHistory
