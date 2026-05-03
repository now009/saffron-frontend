import { useEffect, useState } from 'react'
import eaiApi from '../../api/eaiApi'
import '../../eai.css'

const OP_TYPES     = ['QUERY', 'INSERT', 'UPDATE', 'DELETE', 'PROCEDURE']
const RESULT_TYPES = ['LIST', 'SINGLE', 'COUNT', 'NONE']

const defaultForm = {
  interfaceId: '', datasourceId: '', statementId: '', operationType: 'QUERY',
  resultType: 'LIST', paramMapping: '', rollbackOnError: true, isActive: true,
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M10 18a7.952 7.952 0 004.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A8 8 0 1010 18zm0-14a6 6 0 110 12A6 6 0 0110 4z" />
    </svg>
  )
}

function DbAdapterConfig() {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState({ interfaceId: '', datasourceId: '' })
  const [modal, setModal]     = useState(null)
  const [form, setForm]       = useState(defaultForm)
  const [saving, setSaving]   = useState(false)

  const load = () => {
    setLoading(true)
    eaiApi.dbAdapterConfig.list(filter)
      .then(data => setList(Array.isArray(data) ? data : (data.content ?? [])))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openNew  = () => { setForm(defaultForm); setModal('new') }
  const openEdit = (item) => { setForm({ ...defaultForm, ...item }); setModal('edit') }
  const closeModal = () => setModal(null)

  const handleSave = async () => {
    setSaving(true)
    try {
      if (modal === 'edit') await eaiApi.dbAdapterConfig.update(form.id, form)
      else                  await eaiApi.dbAdapterConfig.create(form)
      closeModal(); load()
    } catch { alert('저장 중 오류가 발생했습니다.') }
    finally { setSaving(false) }
  }

  const handleDelete = async (e, item) => {
    e.stopPropagation()
    if (!window.confirm(`DB 어댑터 설정 [${item.interfaceId}]을 삭제하시겠습니까?`)) return
    await eaiApi.dbAdapterConfig.delete(item.id).catch(() => alert('삭제 중 오류가 발생했습니다.'))
    load()
  }

  const f = (key, label, placeholder = '') => (
    <div className="modal-field" key={key}>
      <label>{label}</label>
      <input type="text" value={form[key] ?? ''} placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
    </div>
  )

  return (
    <div className="content-area">
      <div className="content-body">
        <div className="grid-container">
          <div className="grid-toolbar">
            <div className="grid-toolbar-left">
              <span className="grid-title">DB 어댑터 설정</span>
            </div>
            <div className="grid-toolbar-right">
              <div className="grid-search-bar">
                <input type="text" placeholder="인터페이스ID" value={filter.interfaceId}
                  onChange={e => setFilter(f => ({ ...f, interfaceId: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && load()} />
                <button className="grid-search-btn" onClick={load}><SearchIcon /></button>
              </div>
              <div className="grid-search-bar">
                <input type="text" placeholder="DataSource ID" value={filter.datasourceId}
                  onChange={e => setFilter(f => ({ ...f, datasourceId: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && load()} />
                <button className="grid-search-btn" onClick={load}><SearchIcon /></button>
              </div>
              <button className="grid-add-btn" onClick={openNew}>+ 등록</button>
            </div>
          </div>

          <div className="grid-wrap">
            <table className="grid-table">
              <colgroup>
                <col style={{ width: 120 }} />
                <col style={{ width: 130 }} />
                <col />
                <col style={{ width: 100 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 60 }} />
                <col style={{ width: 80 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>인터페이스ID</th>
                  <th>DataSource ID</th>
                  <th>Statement ID</th>
                  <th>작업유형</th>
                  <th>결과유형</th>
                  <th>활성</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="grid-loading">로딩 중...</td></tr>
                ) : list.length === 0 ? (
                  <tr><td colSpan={7} className="grid-empty">데이터가 없습니다.</td></tr>
                ) : list.map(item => (
                  <tr key={item.id} onClick={() => openEdit(item)} style={{ cursor: 'pointer' }}>
                    <td>{item.interfaceId}</td>
                    <td>{item.datasourceId}</td>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>{item.statementId}</td>
                    <td>{item.operationType}</td>
                    <td>{item.resultType}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`eai-status-badge ${item.isActive ? 'ACTIVE' : 'INACTIVE'}`}>
                        {item.isActive ? 'Y' : 'N'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="grid-search-btn" style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={e => handleDelete(e, item)}>삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" style={{ width: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>{modal === 'edit' ? 'DB 어댑터 설정 수정' : 'DB 어댑터 설정 등록'}</span>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>×</button>
            </div>
            <div className="modal-body">
              <div className="eai-form-section">
                <h4>기본 정보</h4>
                {f('interfaceId',  '인터페이스ID',  'IF-0001')}
                {f('datasourceId', 'DataSource ID', 'DS_ERP')}
                {f('statementId',  'Statement ID',  'com.mapper.EaiMapper.selectData')}
                <div className="modal-field">
                  <label>작업 유형</label>
                  <select value={form.operationType}
                    onChange={e => setForm(f => ({ ...f, operationType: e.target.value }))}>
                    {OP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="modal-field">
                  <label>결과 유형</label>
                  <select value={form.resultType}
                    onChange={e => setForm(f => ({ ...f, resultType: e.target.value }))}>
                    {RESULT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="eai-form-section">
                <h4>추가 설정</h4>
                <div className="modal-field">
                  <label>파라미터 매핑 (JSON)</label>
                  <textarea rows={4} value={form.paramMapping ?? ''}
                    onChange={e => setForm(f => ({ ...f, paramMapping: e.target.value }))} />
                </div>
                <div className="modal-field">
                  <label>오류 시 롤백</label>
                  <select value={form.rollbackOnError ? 'true' : 'false'}
                    onChange={e => setForm(f => ({ ...f, rollbackOnError: e.target.value === 'true' }))}>
                    <option value="true">예</option>
                    <option value="false">아니오</option>
                  </select>
                </div>
                <div className="modal-field">
                  <label>활성화</label>
                  <select value={form.isActive ? 'true' : 'false'}
                    onChange={e => setForm(f => ({ ...f, isActive: e.target.value === 'true' }))}>
                    <option value="true">활성</option>
                    <option value="false">비활성</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn-cancel" onClick={closeModal}>취소</button>
              <button className="modal-btn-save" onClick={handleSave} disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DbAdapterConfig
