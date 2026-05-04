// ============================================================
// DB 어댑터 설정 — 인터페이스가 사용할 SQL/Procedure 매핑 정보
// 라우트: /eai/db-adapter-configs
// 핵심 필드: interfaceId(1:1), datasourceId(DB 연결 참조), statementId(MyBatis namespace)
// 작업유형(QUERY/INSERT/UPDATE/DELETE/PROCEDURE) + 결과유형(LIST/SINGLE/COUNT/NONE)으로 동작 결정
// ============================================================
import { useEffect, useRef, useState } from 'react'
import eaiApi, { handleEaiResponse } from '../../api/eaiApi'
import '../../eai.css'

// 행별 수정/삭제 메뉴 — 4개 어댑터 페이지 공통 패턴 (현재는 각 파일에 중복 정의)
function ActionMenu({ row, onEdit, onDelete }) {
  const [open, setOpen]     = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const ref    = useRef(null)
  const btnRef = useRef(null)

  const toggle = () => {
    if (!open && btnRef.current) {
      const wrap      = btnRef.current.closest('.grid-wrap')
      const bottom    = wrap ? wrap.getBoundingClientRect().bottom : window.innerHeight
      const btnBottom = btnRef.current.getBoundingClientRect().bottom
      setOpenUp(bottom - btnBottom < 110)
    }
    setOpen(v => !v)
  }

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className="action-menu" ref={ref}>
      <button ref={btnRef} className="action-btn" onClick={e => { e.stopPropagation(); toggle() }}>
        <svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
      </button>
      {open && (
        <div className={`action-dropdown ${openUp ? 'up' : ''}`}>
          <button className="action-item edit"   onClick={() => { onEdit(row);   setOpen(false) }}>수정</button>
          <button className="action-item delete" onClick={() => { onDelete(row); setOpen(false) }}>삭제</button>
        </div>
      )}
    </div>
  )
}

const OP_TYPES     = ['QUERY', 'INSERT', 'UPDATE', 'DELETE', 'PROCEDURE']
const RESULT_TYPES = ['LIST', 'SINGLE', 'COUNT', 'NONE']

const defaultForm = {
  interfaceId: '', datasourceId: '', statementId: '', operationType: 'QUERY',
  resultType: 'LIST', paramMapping: '', rollbackOnError: true, isActive: true,
}

// 기본정보 박스 5개 필드 모두 필수
const REQUIRED_FIELDS = {
  interfaceId:   '인터페이스ID',
  datasourceId:  'DataSource ID',
  statementId:   'Statement ID',
  operationType: '작업 유형',
  resultType:    '결과 유형',
}

const isEmpty = (v) => v === '' || v === null || v === undefined

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M10 18a7.952 7.952 0 004.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A8 8 0 1010 18zm0-14a6 6 0 110 12A6 6 0 0110 4z" />
    </svg>
  )
}

// ─── DataSource 선택 서브모달 — DB 어댑터 등록/수정 시 datasourceId를 그리드에서 골라 입력 ───
// 메뉴관리의 ProgramSelectModal과 동일 패턴 (modal-overlay-top + radio 선택 → onSelect)
function DataSourceSelectModal({ onClose, onSelect }) {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [selected, setSelected] = useState(null)

  const fetchData = (kw = '') => {
    setLoading(true)
    setSelected(null)
    eaiApi.datasource.list({ datasourceId: kw })
      .then(data => setList(Array.isArray(data) ? data : (data?.content ?? [])))
      .catch(() => alert('DataSource 목록 조회 실패'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const handleConfirm = () => {
    if (!selected) { alert('DataSource를 선택하세요'); return }
    onSelect(selected)
  }

  return (
    <div className="modal-overlay modal-overlay-top" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ width: 640 }}>
        <div className="modal-header">
          <span className="modal-title">DataSource 목록</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-program-search">
          <div className="grid-search-bar">
            <input
              type="text"
              placeholder="DataSource ID"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchData(keyword)}
            />
            <button className="grid-search-btn" onClick={() => fetchData(keyword)}>
              <SearchIcon />
            </button>
          </div>
        </div>
        <div className="modal-program-list">
          {loading ? (
            <div className="modal-program-empty">조회 중...</div>
          ) : list.length === 0 ? (
            <div className="modal-program-empty">데이터가 없습니다.</div>
          ) : (
            <table className="modal-program-table">
              <thead>
                <tr>
                  <th className="radio-cell"></th>
                  <th>DataSource ID</th>
                  <th>DataSource명</th>
                  <th>DB 유형</th>
                  <th>사용자명</th>
                </tr>
              </thead>
              <tbody>
                {list.map(d => (
                  <tr
                    key={d.id ?? d.datasourceId}
                    className={`modal-program-row${selected?.datasourceId === d.datasourceId ? ' selected' : ''}`}
                    onClick={() => setSelected(d)}
                  >
                    <td className="radio-cell">
                      <input type="radio" readOnly checked={selected?.datasourceId === d.datasourceId} />
                    </td>
                    <td>{d.datasourceId}</td>
                    <td>{d.datasourceName ?? '-'}</td>
                    <td>{d.dbType ?? '-'}</td>
                    <td>{d.dbUsername ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose}>취소</button>
          <button className="modal-btn-save" onClick={handleConfirm}>선택</button>
        </div>
      </div>
    </div>
  )
}

function DbAdapterConfig() {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState({ interfaceId: '', datasourceId: '' })
  const [modal, setModal]     = useState(null)
  const [form, setForm]       = useState(defaultForm)
  const [saving, setSaving]   = useState(false)
  const [dsModal, setDsModal] = useState(false)   // DataSource 선택 서브모달 표시 여부

  const handleSelectDatasource = (ds) => {
    setForm(f => ({ ...f, datasourceId: ds.datasourceId }))
    setDsModal(false)
  }

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

  const validate = () => {
    for (const [key, label] of Object.entries(REQUIRED_FIELDS)) {
      if (isEmpty(form[key])) return `${label} 항목은 필수입니다.`
    }
    return null
  }

  const handleSave = async () => {
    const err = validate()
    if (err) { alert(err); return }
    setSaving(true)
    try {
      const res = modal === 'edit'
        ? await eaiApi.dbAdapterConfig.update(form.id, form)
        : await eaiApi.dbAdapterConfig.create(form)
      if (!handleEaiResponse(res)) return
      closeModal(); load()
    } catch { alert('저장 중 오류가 발생했습니다.') }
    finally { setSaving(false) }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`DB 어댑터 설정 [${item.interfaceId}]을 삭제하시겠습니까?`)) return
    try {
      const res = await eaiApi.dbAdapterConfig.delete(item.id)
      if (!handleEaiResponse(res)) return
      load()
    } catch { alert('삭제 중 오류가 발생했습니다.') }
  }

  const f = (key, label, placeholder = '', req = false) => (
    <div className="modal-field" key={key}>
      <label className={req ? 'req' : ''}>{label}</label>
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
                <col style={{ width: 48 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>인터페이스ID</th>
                  <th>DataSource ID</th>
                  <th>Statement ID</th>
                  <th>작업유형</th>
                  <th>결과유형</th>
                  <th>활성</th>
                  <th className="action-cell"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="grid-loading">로딩 중...</td></tr>
                ) : list.length === 0 ? (
                  <tr><td colSpan={7} className="grid-empty">데이터가 없습니다.</td></tr>
                ) : list.map(item => (
                  <tr key={item.id}>
                    <td>{item.interfaceId}</td>
                    <td>{item.datasourceId}</td>
                    <td className="eai-cell-mute">{item.statementId}</td>
                    <td>{item.operationType}</td>
                    <td>{item.resultType}</td>
                    <td className="eai-cell-center">
                      <span className={`eai-status-badge ${item.isActive ? 'ACTIVE' : 'INACTIVE'}`}>
                        {item.isActive ? 'Y' : 'N'}
                      </span>
                    </td>
                    <td className="action-cell">
                      <ActionMenu row={item} onEdit={openEdit} onDelete={handleDelete} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── 등록/수정 모달 — 좌: 기본정보, 우: 추가설정(파라미터 매핑·롤백·활성) ─── */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" style={{ width: 1080 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{modal === 'edit' ? 'DB 어댑터 설정 수정' : 'DB 어댑터 설정 등록'}</span>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="eai-modal-grid">
                <div className="eai-modal-col">
                  <div className="eai-form-section">
                    <h4>기본 정보</h4>
                    {f('interfaceId',  '인터페이스ID',  'IF-0001',                          true)}
                    <div className="modal-field" key="datasourceId">
                      <label className="req">DataSource ID</label>
                      <div className="modal-input-row">
                        <input
                          type="text"
                          value={form.datasourceId ?? ''}
                          placeholder="조회 버튼으로 선택"
                          readOnly
                        />
                        <button type="button" className="modal-lookup-btn" onClick={() => setDsModal(true)}>
                          <SearchIcon />
                        </button>
                      </div>
                    </div>
                    {f('statementId',  'Statement ID',  'com.mapper.EaiMapper.selectData', true)}
                    <div className="modal-field">
                      <label className="req">작업 유형</label>
                      <select value={form.operationType}
                        onChange={e => setForm(f => ({ ...f, operationType: e.target.value }))}>
                        {OP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="modal-field">
                      <label className="req">결과 유형</label>
                      <select value={form.resultType}
                        onChange={e => setForm(f => ({ ...f, resultType: e.target.value }))}>
                        {RESULT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="eai-modal-col">
                  <div className="eai-form-section">
                    <h4>추가 설정</h4>
                    <div className="modal-field modal-field-v">
                      <label>파라미터 매핑 (JSON)</label>
                      <textarea rows={6} value={form.paramMapping ?? ''}
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

      {/* ─── DataSource 선택 서브모달 (modal-overlay-top: z-index 1100, 메인 모달 위에 표시) ─── */}
      {dsModal && (
        <DataSourceSelectModal onClose={() => setDsModal(false)} onSelect={handleSelectDatasource} />
      )}
    </div>
  )
}

export default DbAdapterConfig
