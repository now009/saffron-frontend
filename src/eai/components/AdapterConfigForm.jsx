// ============================================================
// AdapterConfigForm — 어댑터 유형(REST/SOAP/DB/FILE) 별 다형 설정 폼
// 사용처: InterfaceForm 2단계, InterfaceDetail 어댑터 탭
// 동작: adapterType prop이 주어지면 해당 유형의 필드만 렌더,
//       비어있으면 4개 탭으로 사용자가 직접 선택할 수 있게 노출.
// ============================================================
import { useState } from 'react'

const TABS = ['REST', 'SOAP', 'DB', 'FILE']

function RestFields({ cfg, onChange }) {
  return (
    <>
      <div className="modal-field">
        <label>URL</label>
        <input value={cfg.url ?? ''} onChange={e => onChange('url', e.target.value)} placeholder="https://..." />
      </div>
      <div className="modal-field">
        <label>HTTP Method</label>
        <select value={cfg.httpMethod ?? 'POST'} onChange={e => onChange('httpMethod', e.target.value)}>
          {['GET', 'POST', 'PUT', 'DELETE'].map(m => <option key={m}>{m}</option>)}
        </select>
      </div>
      <div className="modal-field">
        <label>타임아웃(ms)</label>
        <input type="number" value={cfg.timeoutMs ?? ''} onChange={e => onChange('timeoutMs', e.target.value)} />
      </div>
      <div className="modal-field">
        <label>인증방식</label>
        <select value={cfg.authType ?? 'NONE'} onChange={e => onChange('authType', e.target.value)}>
          {['NONE', 'BEARER', 'API_KEY', 'BASIC'].map(a => <option key={a}>{a}</option>)}
        </select>
      </div>
      {cfg.authType && cfg.authType !== 'NONE' && (
        <div className="modal-field">
          <label>인증값</label>
          <input value={cfg.authValue ?? ''} onChange={e => onChange('authValue', e.target.value)} />
        </div>
      )}
    </>
  )
}

function SoapFields({ cfg, onChange }) {
  return (
    <>
      <div className="modal-field">
        <label>WSDL URL</label>
        <input value={cfg.url ?? ''} onChange={e => onChange('url', e.target.value)} />
      </div>
      <div className="modal-field">
        <label>SOAPAction</label>
        <input value={cfg.soapAction ?? ''} onChange={e => onChange('soapAction', e.target.value)} />
      </div>
      <div className="modal-field">
        <label>타임아웃(ms)</label>
        <input type="number" value={cfg.timeoutMs ?? ''} onChange={e => onChange('timeoutMs', e.target.value)} />
      </div>
    </>
  )
}

function DbFields({ cfg, onChange }) {
  return (
    <>
      <div className="modal-field">
        <label>DataSource ID</label>
        <input value={cfg.datasourceId ?? ''} onChange={e => onChange('datasourceId', e.target.value)} />
      </div>
      <div className="modal-field">
        <label>Statement ID</label>
        <input value={cfg.statementId ?? ''} onChange={e => onChange('statementId', e.target.value)} />
      </div>
      <div className="modal-field">
        <label>작업유형</label>
        <select value={cfg.operationType ?? 'QUERY'} onChange={e => onChange('operationType', e.target.value)}>
          {['QUERY', 'INSERT', 'UPDATE', 'PROCEDURE'].map(o => <option key={o}>{o}</option>)}
        </select>
      </div>
    </>
  )
}

function FileFields({ cfg, onChange }) {
  return (
    <>
      <div className="modal-field">
        <label>SFTP Host</label>
        <input value={cfg.remoteHost ?? ''} onChange={e => onChange('remoteHost', e.target.value)} />
      </div>
      <div className="modal-field">
        <label>포트</label>
        <input type="number" value={cfg.remotePort ?? ''} onChange={e => onChange('remotePort', e.target.value)} />
      </div>
      <div className="modal-field">
        <label>계정</label>
        <input value={cfg.remoteUser ?? ''} onChange={e => onChange('remoteUser', e.target.value)} />
      </div>
      <div className="modal-field">
        <label>원격경로</label>
        <input value={cfg.remotePath ?? ''} onChange={e => onChange('remotePath', e.target.value)} />
      </div>
      <div className="modal-field">
        <label>파일패턴</label>
        <input value={cfg.filePattern ?? ''} onChange={e => onChange('filePattern', e.target.value)} placeholder="*.xml" />
      </div>
    </>
  )
}

// ─── 메인 — adapterType이 외부에서 결정되면 탭 비노출, 아니면 탭으로 선택 ───
function AdapterConfigForm({ adapterType, config, onChange }) {
  const [tab, setTab] = useState(adapterType ?? 'REST')

  // 변경 시 항상 adapterType을 함께 끼워 보냄 — 백엔드 폴리모픽 저장에 필수.
  const handleChange = (key, val) => onChange({ ...config, adapterType: tab, [key]: val })

  const activeTab = adapterType ?? tab

  return (
    <div className="eai-form-section">
      <h4>어댑터 설정</h4>
      {!adapterType && (
        <div className="wizard-steps" style={{ marginBottom: 16 }}>
          {TABS.map(t => (
            <button
              key={t}
              className={`wizard-step ${tab === t ? 'active' : ''}`}
              style={{ border: 'none', cursor: 'pointer', background: 'none' }}
              onClick={() => setTab(t)}
            >{t}</button>
          ))}
        </div>
      )}
      {activeTab === 'REST'  && <RestFields  cfg={config ?? {}} onChange={handleChange} />}
      {activeTab === 'SOAP'  && <SoapFields  cfg={config ?? {}} onChange={handleChange} />}
      {activeTab === 'DB'    && <DbFields    cfg={config ?? {}} onChange={handleChange} />}
      {activeTab === 'FILE'  && <FileFields  cfg={config ?? {}} onChange={handleChange} />}
    </div>
  )
}

export default AdapterConfigForm
