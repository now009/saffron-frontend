// ============================================================
// 인터페이스 목록 — 등록된 EAI 인터페이스 그리드 + 필터
// 라우트: /eai/interfaces
// 동작: 상태/유형/키워드로 필터, 행 클릭 시 상세, 토글 버튼으로 활성/비활성 즉시 변경
// 응답 형태: 백엔드가 배열 또는 페이징 객체({content:[]}) 양쪽 가능 → 가드 처리
// ============================================================
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import eaiApi, { handleEaiResponse } from '../api/eaiApi'
import '../eai.css'

// 첫 항목 ''는 select의 "전체" 옵션용 — 백엔드 enum과 분리해 유지
const ADAPTER_TYPES = ['', 'REST', 'SOAP', 'DB', 'FILE']
const STATUS_TYPES  = ['', 'ACTIVE', 'WARNING', 'ERROR', 'INACTIVE']

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M10 18a7.952 7.952 0 004.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A8 8 0 1010 18zm0-14a6 6 0 110 12A6 6 0 0110 4z" />
    </svg>
  )
}

function InterfaceList() {
  const navigate = useNavigate()
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState({ status: '', adapterType: '', keyword: '' })

  const load = () => {
    setLoading(true)
    eaiApi.interface.list(filter)
      .then(data => setList(Array.isArray(data) ? data : (data.content ?? [])))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // 행 onClick(상세 이동)이 토글 버튼에도 전파되지 않도록 stopPropagation
  const handleToggle = async (e, item) => {
    e.stopPropagation()
    if (!window.confirm(`인터페이스를 ${item.isActive ? '비활성화' : '활성화'}하시겠습니까?`)) return
    try {
      const res = await eaiApi.interface.toggle(item.id, !item.isActive)
      if (!handleEaiResponse(res)) return
      load()
    } catch { alert('처리 중 오류가 발생했습니다.') }
  }

  return (
    <div className="content-area eai-compact">
      <div className="content-body">
        <div className="grid-container">
          <div className="grid-toolbar">
            <div className="grid-toolbar-left">
              <span className="grid-title">인터페이스 관리</span>
            </div>
            <div className="grid-toolbar-right">
              <select
                className="site-select"
                value={filter.status}
                onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
              >
                <option value="">전체 상태</option>
                {STATUS_TYPES.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                className="site-select"
                value={filter.adapterType}
                onChange={e => setFilter(f => ({ ...f, adapterType: e.target.value }))}
              >
                <option value="">전체 유형</option>
                {ADAPTER_TYPES.slice(1).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="grid-search-bar">
                <input
                  type="text"
                  placeholder="키워드 검색"
                  value={filter.keyword}
                  onChange={e => setFilter(f => ({ ...f, keyword: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && load()}
                />
                <button className="grid-search-btn" onClick={load}><SearchIcon /></button>
              </div>
              <button className="grid-add-btn" onClick={() => navigate('/eai/interfaces/new')}>+ 등록</button>
            </div>
          </div>

          <div className="grid-wrap">
            <table className="grid-table">
              <colgroup>
                <col style={{ width: 110 }} />
                <col />
                <col style={{ width: 100 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 70 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 90 }} />
                <col style={{ width: 130 }} />
                <col style={{ width: 80 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>인터페이스ID</th>
                  <th>인터페이스명</th>
                  <th>송신시스템</th>
                  <th>수신시스템</th>
                  <th>유형</th>
                  <th>상태</th>
                  <th>오늘 처리</th>
                  <th>마지막 실행</th>
                  <th>활성화</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="grid-loading">로딩 중...</td></tr>
                ) : list.length === 0 ? (
                  <tr><td colSpan={9} className="grid-empty">데이터가 없습니다.</td></tr>
                ) : list.map(item => (
                  <tr key={item.id} onClick={() => navigate(`/eai/interfaces/${item.id}`)}>
                    <td>{item.interfaceId}</td>
                    <td>{item.name}</td>
                    <td>{item.sourceSystem}</td>
                    <td>{item.targetSystem}</td>
                    <td className="eai-cell-center">{item.adapterType}</td>
                    <td className="eai-cell-center"><StatusBadge status={item.status} /></td>
                    <td className="eai-cell-center">{(item.todayCount ?? 0).toLocaleString()}</td>
                    <td>{item.lastRunAt ? String(item.lastRunAt).slice(0, 16) : '-'}</td>
                    <td className="eai-cell-center">
                      <button
                        className={`eai-toggle-btn ${item.isActive ? 'on' : 'off'}`}
                        onClick={e => handleToggle(e, item)}
                      >{item.isActive ? 'ON' : 'OFF'}</button>
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

export default InterfaceList
