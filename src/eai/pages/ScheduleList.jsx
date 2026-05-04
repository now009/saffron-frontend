// ============================================================
// 스케줄 목록 — Cron 기반 자동 실행 스케줄 관리
// 라우트: /eai/schedules
// 동작: 활성/비활성 토글, 즉시 실행(run) 트리거
// 등록·수정 폼은 별도로 없음 — 인터페이스 등록 시 자동 생성된다는 가정
// ============================================================
import { useEffect, useState } from 'react'
import eaiApi from '../api/eaiApi'
import '../eai.css'

function ScheduleList() {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(null)

  const load = () => {
    setLoading(true)
    eaiApi.schedule.list()
      .then(data => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleRun = (id) => {
    if (!window.confirm('스케줄을 즉시 실행하시겠습니까?')) return
    setRunning(id)
    eaiApi.schedule.run(id)
      .then(() => { alert('실행 요청이 완료되었습니다.'); load() })
      .catch(() => alert('실행 중 오류가 발생했습니다.'))
      .finally(() => setRunning(null))
  }

  // 행 클릭 이벤트가 토글 버튼에 전파되지 않도록 차단 (현재 행 클릭 동작은 없지만 일관성 유지)
  const handleToggle = (e, item) => {
    e.stopPropagation()
    eaiApi.schedule.toggle(item.id, !item.isActive).then(load)
  }

  return (
    <div className="content-area">
      <div className="content-body">
        <div className="grid-container">
          <div className="grid-toolbar">
            <div className="grid-toolbar-left">
              <span className="grid-title">스케줄 관리</span>
            </div>
            <div className="grid-toolbar-right">
              <button className="grid-search-btn" onClick={load}>새로고침</button>
            </div>
          </div>

        <div className="grid-wrap">
          <table className="grid-table">
            <colgroup>
              <col style={{ width: 80 }} />
              <col style={{ width: 110 }} />
              <col />
              <col style={{ width: 150 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 150 }} />
              <col style={{ width: 150 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 80 }} />
            </colgroup>
            <thead>
              <tr>
                <th>ID</th>
                <th>인터페이스ID</th>
                <th>스케줄명</th>
                <th>Cron 표현식</th>
                <th>활성화</th>
                <th>마지막 실행</th>
                <th>다음 실행</th>
                <th>마지막 상태</th>
                <th>즉시 실행</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="grid-loading">로딩 중...</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={9} className="grid-empty">데이터가 없습니다.</td></tr>
              ) : list.map(item => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.interfaceId}</td>
                  <td>{item.scheduleName ?? item.name ?? '-'}</td>
                  <td><code style={{ fontSize: 11 }}>{item.cronExpression}</code></td>
                  <td>
                    <button
                      className={`eai-toggle-btn ${item.isActive ? 'on' : 'off'}`}
                      onClick={e => handleToggle(e, item)}
                    >{item.isActive ? 'ON' : 'OFF'}</button>
                  </td>
                  <td>{item.lastRunAt ? String(item.lastRunAt).slice(0, 16) : '-'}</td>
                  <td>{item.nextRunAt ? String(item.nextRunAt).slice(0, 16) : '-'}</td>
                  <td>{item.lastStatus ?? '-'}</td>
                  <td>
                    <button
                      className="grid-search-btn"
                      onClick={() => handleRun(item.id)}
                      disabled={running === item.id}
                    >{running === item.id ? '...' : '실행'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>
  )
}

export default ScheduleList
