import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdapterConfigForm from '../components/AdapterConfigForm'
import MappingRuleEditor from '../components/MappingRuleEditor'
import MessageViewer from '../components/MessageViewer'
import eaiApi from '../api/eaiApi'
import '../eai.css'

const STEPS = ['기본 정보', '어댑터 설정', '매핑 규칙', '검토 · 테스트']
const ADAPTER_TYPES = ['REST', 'SOAP', 'DB', 'FILE']

const defaultForm = { interfaceId: '', name: '', sourceSystem: '', targetSystem: '', adapterType: 'REST', description: '' }

function InterfaceForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [step, setStep]       = useState(0)
  const [form, setForm]       = useState(defaultForm)
  const [adapter, setAdapter] = useState({})
  const [rules, setRules]     = useState([])
  const [testPayload, setTestPayload]   = useState('{}')
  const [testResult, setTestResult]     = useState(null)
  const [testLoading, setTestLoading]   = useState(false)
  const [saving, setSaving]             = useState(false)
  const [loading, setLoading]           = useState(isEdit)

  useEffect(() => {
    if (!isEdit) return
    Promise.all([
      eaiApi.interface.get(id),
      eaiApi.adapter.get(id),
      eaiApi.mapping.list(id),
    ]).then(([i, a, r]) => {
      setForm({
        interfaceId: i.interfaceId ?? '',
        name: i.name ?? '',
        sourceSystem: i.sourceSystem ?? '',
        targetSystem: i.targetSystem ?? '',
        adapterType: i.adapterType ?? 'REST',
        description: i.description ?? '',
      })
      setAdapter(a ?? {})
      setRules(Array.isArray(r) ? r : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id, isEdit])

  const handleSave = async () => {
    setSaving(true)
    try {
      let saved
      if (isEdit) {
        saved = await eaiApi.interface.update(id, form)
      } else {
        saved = await eaiApi.interface.create(form)
      }
      const ifaceId = saved.id ?? id
      await eaiApi.adapter.save({ ...adapter, interfaceId: form.interfaceId, adapterType: form.adapterType })
      await eaiApi.mapping.save(form.interfaceId, rules)
      navigate(`/eai/interfaces/${ifaceId}`)
    } catch (e) {
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = () => {
    setTestLoading(true)
    setTestResult(null)
    eaiApi.interface.test(id ?? form.interfaceId, testPayload)
      .then(r => setTestResult(JSON.stringify(r, null, 2)))
      .catch(e => setTestResult(String(e)))
      .finally(() => setTestLoading(false))
  }

  if (loading) return <div className="dashboard-area"><p>로딩 중...</p></div>

  return (
    <div className="dashboard-area">
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{isEdit ? '인터페이스 수정' : '인터페이스 등록'}</h2>

      <div className="wizard-steps">
        {STEPS.map((s, i) => (
          <button
            key={s}
            className={`wizard-step ${step === i ? 'active' : i < step ? 'done' : ''}`}
            style={{ border: 'none', cursor: 'pointer', background: 'none' }}
            onClick={() => setStep(i)}
          >{s}</button>
        ))}
      </div>

      {step === 0 && (
        <div className="eai-form-section">
          <h4>기본 정보</h4>
          <div className="form-grid">
            {[
              ['interfaceId', '인터페이스ID', 'text', 'IF-0001'],
              ['name',        '인터페이스명', 'text', ''],
              ['sourceSystem','송신시스템',   'text', ''],
              ['targetSystem','수신시스템',   'text', ''],
            ].map(([key, label, type, placeholder]) => (
              <div className="form-row" key={key}>
                <label>{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  placeholder={placeholder}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div className="form-row">
              <label>어댑터 유형</label>
              <select value={form.adapterType} onChange={e => setForm(f => ({ ...f, adapterType: e.target.value }))}>
                {ADAPTER_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>설명</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                style={{ width: '100%', padding: '4px 8px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 4, resize: 'vertical' }}
              />
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <AdapterConfigForm adapterType={form.adapterType} config={adapter} onChange={setAdapter} />
      )}

      {step === 2 && (
        <MappingRuleEditor rules={rules} onChange={setRules} />
      )}

      {step === 3 && (
        <div>
          <div className="eai-form-section">
            <h4>설정 요약</h4>
            <table style={{ fontSize: 13, borderCollapse: 'collapse', width: '100%' }}>
              <tbody>
                {[
                  ['인터페이스ID', form.interfaceId],
                  ['인터페이스명', form.name],
                  ['송신시스템',   form.sourceSystem],
                  ['수신시스템',   form.targetSystem],
                  ['어댑터유형',   form.adapterType],
                  ['매핑규칙',     `${rules.length}개`],
                ].map(([k, v]) => (
                  <tr key={k} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 12px', color: '#6b7280', width: 120, fontWeight: 500 }}>{k}</td>
                    <td style={{ padding: '6px 12px' }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="eai-form-section">
            <h4>테스트 전송</h4>
            <div style={{ marginBottom: 8 }}>
              <textarea
                rows={5}
                value={testPayload}
                onChange={e => setTestPayload(e.target.value)}
                style={{ width: '100%', fontFamily: 'monospace', fontSize: 12, padding: 8, border: '1px solid #d1d5db', borderRadius: 4, boxSizing: 'border-box' }}
              />
            </div>
            <button className="grid-search-btn" onClick={handleTest} disabled={testLoading}>
              {testLoading ? '전송 중...' : '테스트 전송'}
            </button>
            {testResult && (
              <div style={{ marginTop: 12 }}>
                <MessageViewer value={testResult} />
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
        <div>
          {step > 0 && <button className="grid-search-btn" onClick={() => setStep(s => s - 1)}>이전</button>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="grid-search-btn" onClick={() => navigate('/eai/interfaces')}>취소</button>
          {step < STEPS.length - 1
            ? <button className="grid-add-btn" onClick={() => setStep(s => s + 1)}>다음</button>
            : <button className="grid-add-btn" onClick={handleSave} disabled={saving}>{saving ? '저장 중...' : '저장'}</button>
          }
        </div>
      </div>
    </div>
  )
}

export default InterfaceForm
