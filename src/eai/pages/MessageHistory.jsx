import { useEffect, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import MessageViewer from '../components/MessageViewer'
import eaiApi from '../api/eaiApi'
import '../eai.css'

const STATUS_OPTIONS = ['', 'SUCCESS', 'FAIL', 'RETRY', 'DLQ']

function MessageHistory() {
  const [list, setList]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [retrying, setRetrying] = useState(false)
  const [filter, setFilter]     = useState({ interfaceId: '', status: '', dateFrom: '', dateTo: '', keyword: '' })

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
    <div className="dashboard-area">
      <div className="grid-container">
        <div className="grid-toolbar">
          <span className="grid-title">메시지 이력</span>
          <div className="grid-toolbar-right">
            <input
              className="grid-search-input"
              placeholder="인터페이스ID"
              value={filter.interfaceId}
              onChange={e => setFilter(f => ({ ...f, interfaceId: e.target.value }))}
            />
            <select
              className="grid-search-input"
              value={filter.status}
              onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
            >
              <option value="">전체 상태</option>
              {STATUS_OPTIONS.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              className="grid-search-input"
              type="date"
              value={filter.dateFrom}
              onChange={e => setFilter(f => ({ ...f, dateFrom: e.target.value }))}
            />
            <span style={{ lineHeight: '30px', color: '#9ca3af' }}>~</span>
            <input
              className="grid-search-input"
              type="date"
              value={filter.dateTo}
              onChange={e => setFilter(f => ({ ...f, dateTo: e.target.value }))}
            />
            <button className="grid-search-btn" onClick={load}>검색</button>
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

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" style={{ width: 720, maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>메시지 상세 (ID: {selected.id})</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, fontSize: 13 }}>
              {[
                ['인터페이스', selected.interfaceId],
                ['상태',       <StatusBadge status={selected.status} />],
                ['송신',       selected.sourceSystem],
                ['수신',       selected.targetSystem],
                ['처리시간',   `${selected.processingMs}ms`],
                ['수신일시',   selected.createdAt ? String(selected.createdAt).slice(0, 16) : '-'],
              ].map(([k, v]) => (
                <div key={k}><span style={{ color: '#6b7280', marginRight: 6 }}>{k}:</span>{v}</div>
              ))}
            </div>

            {selected.errorMessage && (
              <div className="eai-alert danger" style={{ marginBottom: 12 }}>{selected.errorMessage}</div>
            )}

            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>요청 메시지</p>
              <MessageViewer value={selected.requestBody} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>응답 메시지</p>
              <MessageViewer value={selected.responseBody} />
            </div>

            {['FAIL', 'DLQ'].includes(selected.status) && (
              <div style={{ textAlign: 'right' }}>
                <button className="grid-add-btn" onClick={handleRetry} disabled={retrying}>
                  {retrying ? '처리 중...' : '재처리'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MessageHistory
