// ============================================================
// 사용자관리 — 사용자 마스터 CRUD
// 라우트: /portal/users/list
// 모달 폼 특이사항:
//   - 신규 등록 시 userId 중복확인(checkId) 의무
//   - 부서 select는 모달 진입 시 부서 목록을 별도 API로 조회
//   - 비밀번호는 신규 등록 시에만 입력, 수정 시 빈값이면 변경 안 함 (백엔드 처리)
// ============================================================
import { useState, useEffect, useRef } from 'react'
import apiUri from '../../api/apiUri'
import serverConfig from '../../config/serverConfig'
import '../common/css/grid.css'

const PAGE_SIZE = 10

const SEARCH_FIELDS = [
  { value: 'userId',   label: '사용자 ID', bodyKey: 'userId'   },
  { value: 'userName', label: '사용자명',  bodyKey: 'userName' },
  { value: 'deptId',   label: '부서 ID',   bodyKey: 'deptId'   },
]

const COLUMNS = [
  { key: 'userId',    label: '사용자 ID', width: '120px' },
  { key: 'userName',  label: '사용자명',  width: '120px' },
  { key: 'deptName',  label: '부서명',    width: '150px' },
  { key: 'email',     label: '이메일',    width: '180px' },
  { key: 'phone',     label: '연락처',    width: '120px' },
  { key: 'position',  label: '직위',      width: '90px'  },
  { key: 'jobGrade',  label: '직급',      width: '90px'  },
  { key: 'useYn',     label: '사용',      width: '80px'  },
  { key: 'managerYn', label: '관리자',    width: '80px'  },
  { key: '__action',  label: '',          width: '48px'  },
]

function CellValue({ colKey, value }) {
  if (colKey === 'useYn' || colKey === 'managerYn') {
    return <span className={`grid-badge ${value === 'Y' ? 'on' : 'off'}`}>{value ?? '-'}</span>
  }
  return <>{value ?? '-'}</>
}

function ActionMenu({ row, onEdit, onDelete }) {
  const [open, setOpen]     = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const ref    = useRef(null)
  const btnRef = useRef(null)

  const toggle = () => {
    if (!open && btnRef.current) {
      const wrap = btnRef.current.closest('.grid-wrap')
      const bottom    = wrap ? wrap.getBoundingClientRect().bottom : window.innerHeight
      const btnBottom = btnRef.current.getBoundingClientRect().bottom
      setOpenUp(bottom - btnBottom < 110)
    }
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className="action-menu" ref={ref}>
      <button ref={btnRef} className="action-btn" onClick={toggle}>
        <svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
      </button>
      {open && (
        <div className={`action-dropdown ${openUp ? 'up' : ''}`}>
          <button className="action-item edit" onClick={() => { onEdit(row); setOpen(false) }}>수정</button>
          <button className="action-item delete" onClick={() => { onDelete(row); setOpen(false) }}>삭제</button>
        </div>
      )}
    </div>
  )
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
    </svg>
  )
}

// ─── 등록/수정 모달 — 부서 select는 동적 로드, 신규 등록 시 ID 중복확인 필수 ───
function UserModal({ mode, form: initialForm, onClose, onSave }) {
  const [form, setForm] = useState(initialForm)
  const [depts, setDepts] = useState([])
  const [idStatus, setIdStatus] = useState(null)
  const isEdit = mode === 'edit'

  useEffect(() => {
    fetch(apiUri.dept.list(), {
      method: 'POST',
      headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ deptId: '', deptName: '', deptCode: '' }),
    })
      .then((r) => r.json())
      .then((data) => setDepts(Array.isArray(data) ? data : data.list ?? []))
      .catch(() => {})
  }, [])

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }))

  // 숫자만 입력 + 최대 길이 제한 (전화번호 입력에 사용)
  const onlyDigits = (val, max) => val.replace(/\D/g, '').slice(0, max)

  const handleUserIdChange = (val) => {
    set('userId', val)
    setIdStatus(null)
  }

  const handleCheckId = async () => {
    if (!form.userId) return
    setIdStatus('checking')
    try {
      const res = await fetch(apiUri.user.checkId(form.userId), {
        headers: serverConfig.token.authHeader(),
      })
      const data = await res.json()
      if (data.messageCode === 'fail') {
        alert(data.message)
        setIdStatus('taken')
      } else {
        setIdStatus('ok')
      }
    } catch {
      setIdStatus(null)
    }
  }

  // 저장 검증 — 신규 등록일 때만 ID 정책(길이/문자/중복확인) 강제
  // 수정 시에는 password 빈값이면 변경하지 않음 (백엔드 합의)
  const handleSubmit = () => {
    if (!form.userId) { alert('사용자 ID를 입력하세요'); return }
    if (!isEdit) {
      if (form.userId.length < 4) { alert('사용자 ID는 4자리 이상이어야 합니다'); return }
      if (!/^[a-zA-Z0-9]+$/.test(form.userId)) { alert('사용자 ID는 영문자와 숫자만 사용할 수 있습니다'); return }
      if (!/[a-zA-Z]/.test(form.userId)) { alert('사용자 ID는 영문자를 1개 이상 포함해야 합니다'); return }
      if (idStatus !== 'ok') { alert('사용자 ID 중복확인을 해주세요'); return }
    }
    if (!form.userName) { alert('사용자명을 입력하세요'); return }
    if (!isEdit && !form.password) { alert('비밀번호를 입력하세요'); return }
    if (form.password && form.password.length < 4) { alert('비밀번호는 4자리 이상 입력하세요'); return }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      alert('E-Mail 형식이 올바르지 않습니다.')
      return
    }
    const phone1 = form.phone1 ?? ''
    const phone2 = form.phone2 ?? ''
    const phone3 = form.phone3 ?? ''
    if ((phone1 || phone2 || phone3) && (phone1.length !== 3 || phone2.length !== 4 || phone3.length !== 4)) {
      alert('TEL은 3자리-4자리-4자리 숫자로 입력하세요.')
      return
    }
    const payload = { ...form, phone: phone1 ? `${phone1}-${phone2}-${phone3}` : '' }
    delete payload.phone1
    delete payload.phone2
    delete payload.phone3
    if (isEdit && !payload.password) delete payload.password
    onSave(payload)
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{isEdit ? '사용자 수정' : '사용자 생성'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-field">
            <label>사용자 ID</label>
            {isEdit ? (
              <input value={form.userId} readOnly />
            ) : (
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div className="modal-input-row">
                  <input
                    value={form.userId}
                    onChange={(e) => handleUserIdChange(e.target.value)}
                    placeholder="사용자 ID"
                    maxLength={20}
                  />
                  <button
                    className="modal-lookup-btn"
                    onClick={handleCheckId}
                    disabled={idStatus === 'checking'}
                    title="중복확인"
                  >
                    <PersonIcon />
                  </button>
                </div>
                {idStatus === 'ok'       && <span className="id-status ok">사용 가능한 ID입니다</span>}
                {idStatus === 'taken'    && <span className="id-status taken">이미 사용 중인 ID입니다</span>}
                {idStatus === 'checking' && <span className="id-status checking">확인 중...</span>}
              </div>
            )}
          </div>
          <div className="modal-field">
            <label>사용자명</label>
            <input value={form.userName} onChange={(e) => set('userName', e.target.value)} placeholder="" autoComplete="off" />
          </div>
          <div className="modal-field">
            <label>비밀번호</label>
            <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder={isEdit ? '변경 시에만 입력' : ''} autoComplete="new-password" />
          </div>
          <div className="modal-field">
            <label>부서</label>
            <select value={form.deptId} onChange={(e) => set('deptId', e.target.value)}>
              <option value="">미지정</option>
              {depts.map((d) => (
                <option key={d.deptId} value={d.deptId}>
                  {d.deptNameTree ?? d.deptName} ({d.deptId})
                </option>
              ))}
            </select>
          </div>
          <div className="modal-field">
            <label>E-Mail</label>
            <input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="example@domain.com" />
          </div>
          <div className="modal-field">
            <label>TEL</label>
            <div className="modal-phone-inputs">
              <input value={form.phone1 ?? ''} maxLength={3} onChange={(e) => set('phone1', onlyDigits(e.target.value, 3))} placeholder="" />
              <span>-</span>
              <input value={form.phone2 ?? ''} maxLength={4} onChange={(e) => set('phone2', onlyDigits(e.target.value, 4))} placeholder="0000" />
              <span>-</span>
              <input value={form.phone3 ?? ''} maxLength={4} onChange={(e) => set('phone3', onlyDigits(e.target.value, 4))} placeholder="0000" />
            </div>
          </div>
          <div className="modal-field-row">
            <div className="modal-field">
              <label>직위</label>
              <input value={form.position} onChange={(e) => set('position', e.target.value)} placeholder="직위" />
            </div>
            <div className="modal-field">
              <label>직급</label>
              <input value={form.jobGrade} onChange={(e) => set('jobGrade', e.target.value)} placeholder="직급" />
            </div>
          </div>
          <div className="modal-field-row">
            <div className="modal-field">
              <label>사용 여부</label>
              <select value={form.useYn} onChange={(e) => set('useYn', e.target.value)}>
                <option value="Y">Y</option>
                <option value="N">N</option>
              </select>
            </div>
            <div className="modal-field">
              <label>시스템관리자</label>
              <select value={form.managerYn} onChange={(e) => set('managerYn', e.target.value)}>
                <option value="N">N</option>
                <option value="Y">Y</option>
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose}>취소</button>
          <button className="modal-btn-save" onClick={handleSubmit}>저장</button>
        </div>
      </div>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
    </svg>
  )
}

function Pagination({ current, total, onChange }) {
  const WINDOW = 5
  let start = Math.max(1, current - Math.floor(WINDOW / 2))
  let end   = Math.min(total, start + WINDOW - 1)
  if (end - start + 1 < WINDOW) start = Math.max(1, end - WINDOW + 1)
  const pages = []
  for (let i = start; i <= end; i++) pages.push(i)
  if (total <= 1) return null
  return (
    <div className="grid-pagination">
      <button className="grid-page-btn" disabled={current === 1} onClick={() => onChange(1)}>«</button>
      <button className="grid-page-btn" disabled={current === 1} onClick={() => onChange(current - 1)}>‹</button>
      {start > 1 && <span className="grid-page-sep">…</span>}
      {pages.map((p) => (
        <button key={p} className={`grid-page-btn ${p === current ? 'active' : ''}`} onClick={() => onChange(p)}>{p}</button>
      ))}
      {end < total && <span className="grid-page-sep">…</span>}
      <button className="grid-page-btn" disabled={current === total} onClick={() => onChange(current + 1)}>›</button>
      <button className="grid-page-btn" disabled={current === total} onClick={() => onChange(total)}>»</button>
    </div>
  )
}

// ─── 메인 — 사용자 목록 그리드 + 검색 + 등록/수정/삭제 ───
function User() {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)

  const [searchField, setSearchField] = useState(SEARCH_FIELDS[0].value)
  const [searchInput, setSearchInput] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const fetchData = async (field = '', keyword = '') => {
    setLoading(true)
    try {
      const bodyKey = SEARCH_FIELDS.find((f) => f.value === field)?.bodyKey ?? field
      const body = { userId: '', userName: '', deptId: '' }
      if (keyword && bodyKey) body[bodyKey] = keyword

      const res = await fetch(apiUri.user.list(), {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`)
      const data = await res.json()
      setRows(Array.isArray(data) ? data : data.list ?? data.content ?? [])
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchData(searchField, searchInput)
  }

  const handleEdit = (row) => {
    const parts = (row.phone ?? '').split('-')
    setModal({
      mode: 'edit',
      form: {
        userId:    row.userId    ?? '',
        userName:  row.userName  ?? '',
        password:  '',
        deptId:    row.deptId    ?? '',
        email:     row.email     ?? '',
        phone1:    parts[0] ?? '',
        phone2:    parts[1] ?? '',
        phone3:    parts[2] ?? '',
        position:  row.position  ?? '',
        jobGrade:  row.jobGrade  ?? '',
        useYn:     row.useYn     ?? 'Y',
        managerYn: row.managerYn ?? 'N',
      },
    })
  }

  const handleAdd = () => {
    setModal({
      mode: 'add',
      form: { userId: '', userName: '', password: '', deptId: '', email: '', phone1: '010', phone2: '', phone3: '', position: '', jobGrade: '', useYn: 'Y', managerYn: 'N' },
    })
  }

  const handleSave = async (form) => {
    const isEdit = modal.mode === 'edit'
    try {
      const url = isEdit ? apiUri.user.update() : apiUri.user.create()
      const res = await fetch(url, {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      setModal(null)
      if (Array.isArray(data)) {
        setRows(data)
        setCurrentPage(1)
      } else if (data.messageCode === 'fail') {
        alert(data.message)
      } else {
        fetchData(searchField, searchInput)
      }
    } catch (err) {
      setModal(null)
      alert(`저장 실패 (${err.message})`)
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm('삭제하시겠습니까?')) return
    try {
      const res = await fetch(apiUri.user.delete(row.userId), {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (data.messageCode === 'fail') {
        alert(data.message)
        return
      }
      fetchData(searchField, searchInput)
    } catch (err) {
      alert(`삭제 실패 (${err.message})`)
    }
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageRows   = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="content-area">
      <div className="content-body">
        <div className="grid-container">
          <div className="grid-toolbar">
            <span className="grid-title">사용자관리</span>
            <div className="grid-toolbar-right">
              <span className="grid-count">총 <span>{rows.length}</span>건</span>
              <div className="grid-search-bar">
                <select value={searchField} onChange={(e) => setSearchField(e.target.value)}>
                  {SEARCH_FIELDS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="검색어를 입력하세요"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button className="grid-search-btn" onClick={handleSearch}><SearchIcon /></button>
              </div>
              <button className="grid-add-btn" onClick={handleAdd}>+ Add</button>
            </div>
          </div>

          <div className="grid-wrap" style={{ minHeight: '453px' }}>
            <table className="grid-table">
              <colgroup>
                {COLUMNS.map((col) => <col key={col.key} style={{ width: col.width }} />)}
              </colgroup>
              <thead>
                <tr>
                  {COLUMNS.map((col) => (
                    <th key={col.key} className={col.key === '__action' ? 'action-cell' : ''}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={COLUMNS.length} className="grid-loading">데이터를 불러오는 중...</td></tr>
                ) : pageRows.length === 0 ? (
                  <tr><td colSpan={COLUMNS.length} className="grid-empty">
                    {searchInput ? '검색 결과가 없습니다.' : '데이터가 없습니다.'}
                  </td></tr>
                ) : (
                  pageRows.map((row, idx) => (
                    <tr key={row.userId ?? idx}>
                      {COLUMNS.map((col) => (
                        <td key={col.key} className={col.key === '__action' ? 'action-cell' : ''}>
                          {col.key === '__action'
                            ? <ActionMenu row={row} onEdit={handleEdit} onDelete={handleDelete} />
                            : <CellValue colKey={col.key} value={row[col.key]} />
                          }
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
        </div>
      </div>
      {modal && (
        <UserModal
          mode={modal.mode}
          form={modal.form}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

export default User
