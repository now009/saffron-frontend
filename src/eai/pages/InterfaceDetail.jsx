import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import AdapterConfigForm from '../components/AdapterConfigForm'
import MappingRuleEditor from '../components/MappingRuleEditor'
import eaiApi from '../api/eaiApi'
import '../eai.css'

function InterfaceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [iface, setIface]     = useState(null)
  const [adapter, setAdapter] = useState(null)
  const [rules, setRules]     = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('info')

  useEffect(() => {
    Promise.all([
      eaiApi.interface.get(id),
      eaiApi.adapter.get(id),
      eaiApi.mapping.list(id),
    ]).then(([i, a, r]) => {
      setIface(i)
      setAdapter(a)
      setRules(Array.isArray(r) ? r : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="content-area"><div className="content-body"><p>로딩 중...</p></div></div>
  if (!iface) return <div className="content-area"><div className="content-body"><p>인터페이스를 찾을 수 없습니다.</p></div></div>

  return (
    <div className="content-area">
    <div className="content-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{iface.name}</h2>
          <span style={{ fontSize: 12, color: '#6b7280' }}>{iface.interfaceId}</span>
          {' '}
          <StatusBadge status={iface.status} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="grid-add-btn" onClick={() => navigate(`/eai/interfaces/${id}/edit`)}>수정</button>
          <button className="grid-search-btn" onClick={() => navigate('/eai/interfaces')}>목록</button>
        </div>
      </div>

      <div className="wizard-steps">
        {[['info', '기본 정보'], ['adapter', '어댑터 설정'], ['mapping', '매핑 규칙']].map(([key, label]) => (
          <button
            key={key}
            className={`wizard-step ${tab === key ? 'active' : ''}`}
            style={{ border: 'none', cursor: 'pointer', background: 'none' }}
            onClick={() => setTab(key)}
          >{label}</button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="eai-form-section">
          <h4>기본 정보</h4>
          <table style={{ fontSize: 13, borderCollapse: 'collapse', width: '100%' }}>
            <tbody>
              {[
                ['인터페이스ID', iface.interfaceId],
                ['인터페이스명', iface.name],
                ['송신시스템',   iface.sourceSystem],
                ['수신시스템',   iface.targetSystem],
                ['어댑터유형',   iface.adapterType],
                ['활성화',       iface.isActive ? 'Y' : 'N'],
                ['오늘 처리',    (iface.todayCount ?? 0).toLocaleString() + '건'],
                ['마지막 실행',  iface.lastRunAt ? String(iface.lastRunAt).slice(0, 16) : '-'],
                ['등록일',       iface.createdAt ? String(iface.createdAt).slice(0, 10) : '-'],
              ].map(([k, v]) => (
                <tr key={k} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px', color: '#6b7280', width: 130, fontWeight: 500 }}>{k}</td>
                  <td style={{ padding: '8px 12px' }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'adapter' && (
        <AdapterConfigForm adapterType={iface.adapterType} config={adapter} onChange={() => {}} />
      )}

      {tab === 'mapping' && (
        <MappingRuleEditor rules={rules} onChange={() => {}} />
      )}
    </div>
    </div>
  )
}

export default InterfaceDetail
