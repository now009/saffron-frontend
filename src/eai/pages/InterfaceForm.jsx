// ============================================================
// 인터페이스 등록·수정 — 4단계 위저드 폼
// 라우트: /eai/interfaces/new , /eai/interfaces/:id/edit
// 단계: 기본정보 → 어댑터 설정 → 매핑 규칙 → 검토 · 테스트
// 저장 시 인터페이스/어댑터/매핑 API를 순차 호출 (트랜잭션성 보장 안 됨 — 중간 실패 시 부분 저장 가능성)
// 4단계에서 interface.test() 로 페이로드 시험전송 후 결과를 MessageViewer로 표시
// ============================================================
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdapterConfigForm from '../components/AdapterConfigForm'
import MappingRuleEditor from '../components/MappingRuleEditor'
import MessageViewer from '../components/MessageViewer'
import eaiApi, { handleEaiResponse } from '../api/eaiApi'
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

  // 수정 모드일 때만 기존 데이터 로드 — 신규 등록은 defaultForm 그대로 사용
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

  // 인터페이스 → 어댑터 → 매핑 순차 저장.
  // 각 단계에서 success=false 시 즉시 중단 (이전 단계는 롤백되지 않으므로 부분 저장 가능성 있음).
  // 응답에 entity id가 보장되지 않으므로 신규 등록 시 목록으로 이동 (수정은 상세 유지).
  const handleSave = async () => {
    setSaving(true)
    try {
      const ifaceRes = isEdit
        ? await eaiApi.interface.update(id, form)
        : await eaiApi.interface.create(form)
      if (!handleEaiResponse(ifaceRes)) return

      const adapterRes = await eaiApi.adapter.save({ ...adapter, interfaceId: form.interfaceId, adapterType: form.adapterType })
      if (!handleEaiResponse(adapterRes)) return

      const mappingRes = await eaiApi.mapping.save(form.interfaceId, rules)
      if (!handleEaiResponse(mappingRes)) return

      navigate(isEdit ? `/eai/interfaces/${id}` : '/eai/interfaces')
    } catch (e) {
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // 테스트 전송은 응답 본문 자체가 결과 — JSON으로 그대로 표시 (handleEaiResponse 미사용)
  const handleTest = () => {
    setTestLoading(true)
    setTestResult(null)
    eaiApi.interface.test(id ?? form.interfaceId, testPayload)
      .then(r => setTestResult(JSON.stringify(r, null, 2)))
      .catch(e => setTestResult(String(e)))
      .finally(() => setTestLoading(false))
  }

  if (loading) return <div className="content-area"><div className="content-body"><p>로딩 중...</p></div></div>

  return (
    <div className="content-area">
      <div className="content-body">
      <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16, color: '#1e2530' }}>{isEdit ? '인터페이스 수정' : '인터페이스 등록'}</h2>

      {/* ─── 단계 인디케이터 — 클릭으로 임의 단계 점프 가능 (검증 없음) ─── */}
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

      {/* ─── 1단계: 기본 정보 ─── */}
      {step === 0 && (
        <div className="eai-form-section">
          <h4>기본 정보</h4>
          {[
            ['interfaceId', '인터페이스ID', 'text', 'IF-0001'],
            ['name',        '인터페이스명', 'text', ''],
            ['sourceSystem','송신시스템',   'text', ''],
            ['targetSystem','수신시스템',   'text', ''],
          ].map(([key, label, type, placeholder]) => (
            <div className="modal-field" key={key}>
              <label>{label}</label>
              <input
                type={type}
                value={form[key]}
                placeholder={placeholder}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="modal-field">
            <label>어댑터 유형</label>
            <select value={form.adapterType} onChange={e => setForm(f => ({ ...f, adapterType: e.target.value }))}>
              {ADAPTER_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="modal-field modal-field-v">
            <label>설명</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
        </div>
      )}

      {/* ─── 2단계: 어댑터 설정 (REST/SOAP/DB/FILE 다형) ─── */}
      {step === 1 && (
        <AdapterConfigForm adapterType={form.adapterType} config={adapter} onChange={setAdapter} />
      )}

      {/* ─── 3단계: 매핑 규칙 ─── */}
      {step === 2 && (
        <MappingRuleEditor rules={rules} onChange={setRules} />
      )}

      {/* ─── 4단계: 검토·테스트 (페이로드 시험전송) ─── */}
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
                style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.83rem', padding: 8, border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box', outline: 'none' }}
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
          {step > 0 && <button className="modal-btn-cancel" onClick={() => setStep(s => s - 1)}>이전</button>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="modal-btn-cancel" onClick={() => navigate('/eai/interfaces')}>취소</button>
          {step < STEPS.length - 1
            ? <button className="modal-btn-save" onClick={() => setStep(s => s + 1)}>다음</button>
            : <button className="modal-btn-save" onClick={handleSave} disabled={saving}>{saving ? '저장 중...' : '저장'}</button>
          }
        </div>
      </div>
      </div>
    </div>
  )
}

export default InterfaceForm
