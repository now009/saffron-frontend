import { useState, useEffect, useRef } from 'react'
import apiUri from '../../api/apiUri'
import serverConfig from '../../config/serverConfig'
import '../common/css/grid.css'

const extractData = (res) => (res?.code === '200' ? (res.data ?? []) : [])

const PAGE_SIZE = 30

const buildTreeBy = (rows, idKey, parentKey) => {
  const byId        = new Map(rows.map(r => [r[idKey], r]))
  const childrenMap = new Map()
  const roots       = []
  for (const r of rows) {
    const p = r[parentKey]
    if (p && byId.has(p)) {
      const list = childrenMap.get(p) ?? []
      list.push(r)
      childrenMap.set(p, list)
    } else {
      roots.push(r)
    }
  }
  const sortFn = (a, b) =>
    (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
    String(a[idKey] ?? '').localeCompare(String(b[idKey] ?? ''))
  const result = []
  const visit  = (node, depth) => {
    result.push({ ...node, depth })
    const kids = (childrenMap.get(node[idKey]) ?? []).slice().sort(sortFn)
    for (const k of kids) visit(k, depth + 1)
  }
  for (const r of roots.slice().sort(sortFn)) visit(r, 0)
  return result
}

const buildMenuTree = (menus) => buildTreeBy(menus, 'menuId', 'parentMenuId')
const buildDeptTree = (depts) => buildTreeBy(depts, 'deptId', 'parentDeptId')

const asArray = (data) =>
  Array.isArray(data) ? data : data?.data ?? data?.list ?? data?.content ?? []

function Toast({ message, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 2500)
    return () => clearTimeout(t)
  }, [onDismiss])
  return (
    <div style={{
      position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
      background: '#1e293b', color: '#fff', padding: '10px 22px', borderRadius: '8px',
      fontSize: '13px', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
      whiteSpace: 'nowrap',
    }}>
      {message}
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

const USER_SEARCH_FIELDS = [
  { value: 'userId',   label: '사용자 ID' },
  { value: 'userName', label: '사용자명' },
]

const DEPT_SEARCH_FIELDS = [
  { value: 'deptId',   label: '부서 ID' },
  { value: 'deptName', label: '부서명' },
]

function GridSearchBar({ fields, field, input, onFieldChange, onInputChange, onSearch }) {
  return (
    <div className="grid-search-bar">
      <select value={field} onChange={(e) => onFieldChange(e.target.value)}>
        {fields.map((f) => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="검색어를 입력하세요"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch()}
      />
      <button className="grid-search-btn" onClick={onSearch}>
        <SearchIcon />
      </button>
    </div>
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
    <div className="grid-pagination" style={{ marginTop: '12px' }}>
      <button className="grid-page-btn" disabled={current === 1} onClick={() => onChange(1)}>«</button>
      <button className="grid-page-btn" disabled={current === 1} onClick={() => onChange(current - 1)}>‹</button>
      {start > 1 && <span className="grid-page-sep">…</span>}
      {pages.map((p) => (
        <button key={p} className={`grid-page-btn ${p === current ? 'active' : ''}`} onClick={() => onChange(p)}>
          {p}
        </button>
      ))}
      {end < total && <span className="grid-page-sep">…</span>}
      <button className="grid-page-btn" disabled={current === total} onClick={() => onChange(current + 1)}>›</button>
      <button className="grid-page-btn" disabled={current === total} onClick={() => onChange(total)}>»</button>
    </div>
  )
}

function TreeCell({ name, depth }) {
  return (
    <span className="tree-cell">
      {depth > 0 && (
        <span className="tree-indent" style={{ width: depth * 18 + 'px' }} />
      )}
      {depth > 0 && <span className="tree-branch">└─</span>}
      <span className={depth === 0 ? 'tree-root' : 'tree-leaf'}>{name ?? '-'}</span>
    </span>
  )
}

function MenuPermTab({ menus, loading, checkedMenus, onCheck, onToggleAll, onSave, roleName }) {
  const allChecked  = menus.length > 0 && menus.every(m => checkedMenus.has(m.menuId))
  const someChecked = menus.some(m => checkedMenus.has(m.menuId))
  const cbRef = useRef(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (cbRef.current) cbRef.current.indeterminate = !allChecked && someChecked
  }, [allChecked, someChecked])

  useEffect(() => { setCurrentPage(1) }, [menus])

  if (loading) return <div style={{ color: '#9ca3af', fontSize: '13px', padding: '16px 0' }}>조회 중...</div>

  const totalPages = Math.max(1, Math.ceil(menus.length / PAGE_SIZE))
  const pageRows   = menus.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>{roleName} · 메뉴 권한</span>
        <button className="modal-btn-save" style={{ padding: '6px 18px', fontSize: '13px' }} onClick={onSave}>저장</button>
      </div>
      <table className="grid-table">
        <colgroup>
          <col style={{ width: '44px' }} />
          <col />
          <col style={{ width: '76px' }} />
        </colgroup>
        <thead>
          <tr>
            <th style={{ textAlign: 'center' }}>
              <input type="checkbox" ref={cbRef} checked={allChecked} onChange={e => onToggleAll(e.target.checked)} />
            </th>
            <th>메뉴명</th>
            <th>사용여부</th>
          </tr>
        </thead>
        <tbody>
          {menus.length === 0 ? (
            <tr><td colSpan={3} className="grid-empty">메뉴가 없습니다.</td></tr>
          ) : pageRows.map(menu => {
            const checked = checkedMenus.has(menu.menuId)
            const depth   = menu.depth ?? Math.max(0, (menu.menuLevel ?? 1) - 1)
            return (
              <tr key={menu.menuId}>
                <td style={{ textAlign: 'center' }}>
                  <input type="checkbox" checked={checked} onChange={e => onCheck(menu.menuId, e.target.checked)} />
                </td>
                <td>
                  <TreeCell name={menu.menuNameTree ?? menu.menuName} depth={depth} />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span className={`grid-badge ${checked ? 'on' : 'off'}`}>{checked ? 'Y' : 'N'}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
    </div>
  )
}

function RoleUserTab({ roleCode, roleName, onToast }) {
  const [users, setUsers]             = useState([])
  const [checked, setChecked]         = useState(new Set())
  const [loading, setLoading]         = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchField, setSearchField] = useState(USER_SEARCH_FIELDS[0].value)
  const [searchInput, setSearchInput] = useState('')
  const [applied, setApplied]         = useState({ field: USER_SEARCH_FIELDS[0].value, keyword: '' })
  const cbRef = useRef(null)

  useEffect(() => {
    if (!roleCode) return
    setLoading(true)
    Promise.all([
      fetch(apiUri.user.list(), {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: '', userName: '', deptId: '' }),
      }).then(r => r.json()),
      fetch(apiUri.roleSetting.users(roleCode), { headers: serverConfig.token.authHeader() }).then(r => r.json()),
    ])
      .then(([allRes, assignedRes]) => {
        setUsers(asArray(allRes))
        setChecked(new Set(asArray(assignedRes).map(u => u.userId)))
        setCurrentPage(1)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [roleCode])

  const visibleUsers = applied.keyword
    ? users.filter(u =>
        String(u[applied.field] ?? '').toLowerCase().includes(applied.keyword.toLowerCase())
      )
    : users

  const allChecked  = visibleUsers.length > 0 && visibleUsers.every(u => checked.has(u.userId))
  const someChecked = visibleUsers.some(u => checked.has(u.userId))

  useEffect(() => {
    if (cbRef.current) cbRef.current.indeterminate = !allChecked && someChecked
  }, [allChecked, someChecked])

  const toggleOne = (userId, on) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (on) next.add(userId)
      else next.delete(userId)
      return next
    })
  }

  const toggleAll = (on) => {
    setChecked(prev => {
      const next = new Set(prev)
      for (const u of visibleUsers) {
        if (on) next.add(u.userId)
        else next.delete(u.userId)
      }
      return next
    })
  }

  const handleSearch = () => {
    setApplied({ field: searchField, keyword: searchInput.trim() })
    setCurrentPage(1)
  }

  const handleSave = async () => {
    if (!roleCode) return
    const body = users.map(u => ({ userId: u.userId, useYn: checked.has(u.userId) ? 'Y' : 'N' }))
    try {
      const res = await fetch(apiUri.roleSetting.saveUsers(roleCode), {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (json.code && json.code !== '200') {
        alert(json.message ?? '저장 실패')
        return
      }
      onToast?.('저장되었습니다')
    } catch (err) {
      alert(`저장 실패 (${err.message})`)
    }
  }

  if (loading) return <div style={{ color: '#9ca3af', fontSize: '13px', padding: '16px 0' }}>조회 중...</div>

  const totalPages = Math.max(1, Math.ceil(visibleUsers.length / PAGE_SIZE))
  const pageRows   = visibleUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>{roleName} · 사용자</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GridSearchBar
            fields={USER_SEARCH_FIELDS}
            field={searchField}
            input={searchInput}
            onFieldChange={setSearchField}
            onInputChange={setSearchInput}
            onSearch={handleSearch}
          />
          <button className="modal-btn-save" style={{ padding: '6px 18px', fontSize: '13px' }} onClick={handleSave}>저장</button>
        </div>
      </div>
      <table className="grid-table">
        <colgroup>
          <col style={{ width: '44px' }} />
          <col style={{ width: '120px' }} />
          <col style={{ width: '110px' }} />
          <col />
          <col style={{ width: '100px' }} />
          <col style={{ width: '76px' }} />
        </colgroup>
        <thead>
          <tr>
            <th style={{ textAlign: 'center' }}>
              <input type="checkbox" ref={cbRef} checked={allChecked} onChange={e => toggleAll(e.target.checked)} />
            </th>
            <th>사용자 ID</th>
            <th>사용자명</th>
            <th>부서</th>
            <th>직위</th>
            <th>사용여부</th>
          </tr>
        </thead>
        <tbody>
          {visibleUsers.length === 0 ? (
            <tr><td colSpan={6} className="grid-empty">
              {applied.keyword ? '검색 결과가 없습니다.' : '사용자가 없습니다.'}
            </td></tr>
          ) : pageRows.map((u, i) => {
            const on = checked.has(u.userId)
            return (
              <tr key={u.userId ?? i}>
                <td style={{ textAlign: 'center' }}>
                  <input type="checkbox" checked={on} onChange={e => toggleOne(u.userId, e.target.checked)} />
                </td>
                <td>{u.userId   ?? '-'}</td>
                <td>{u.userName ?? '-'}</td>
                <td>{u.deptName ?? '-'}</td>
                <td>{u.position ?? '-'}</td>
                <td style={{ textAlign: 'center' }}>
                  <span className={`grid-badge ${on ? 'on' : 'off'}`}>{on ? 'Y' : 'N'}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
    </div>
  )
}

function RoleDeptTab({ roleCode, roleName, onToast }) {
  const [depts, setDepts]             = useState([])
  const [checked, setChecked]         = useState(new Set())
  const [loading, setLoading]         = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchField, setSearchField] = useState(DEPT_SEARCH_FIELDS[0].value)
  const [searchInput, setSearchInput] = useState('')
  const [applied, setApplied]         = useState({ field: DEPT_SEARCH_FIELDS[0].value, keyword: '' })
  const cbRef = useRef(null)

  useEffect(() => {
    if (!roleCode) return
    setLoading(true)
    Promise.all([
      fetch(apiUri.dept.list(), {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ deptId: '', deptName: '', deptCode: '' }),
      }).then(r => r.json()),
      fetch(apiUri.roleSetting.depts(roleCode), { headers: serverConfig.token.authHeader() }).then(r => r.json()),
    ])
      .then(([allRes, assignedRes]) => {
        setDepts(buildDeptTree(asArray(allRes)))
        setChecked(new Set(asArray(assignedRes).map(d => d.deptId)))
        setCurrentPage(1)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [roleCode])

  const visibleDepts = applied.keyword
    ? depts.filter(d =>
        String(d[applied.field] ?? '').toLowerCase().includes(applied.keyword.toLowerCase())
      )
    : depts

  const allChecked  = visibleDepts.length > 0 && visibleDepts.every(d => checked.has(d.deptId))
  const someChecked = visibleDepts.some(d => checked.has(d.deptId))

  useEffect(() => {
    if (cbRef.current) cbRef.current.indeterminate = !allChecked && someChecked
  }, [allChecked, someChecked])

  const toggleOne = (deptId, on) => {
    const idx = depts.findIndex(d => d.deptId === deptId)
    if (idx === -1) return
    const parentDepth = depts[idx].depth ?? 0
    const ids = [deptId]
    for (let i = idx + 1; i < depts.length; i++) {
      if ((depts[i].depth ?? 0) <= parentDepth) break
      ids.push(depts[i].deptId)
    }
    setChecked(prev => {
      const next = new Set(prev)
      for (const id of ids) {
        if (on) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  const toggleAll = (on) => {
    setChecked(prev => {
      const next = new Set(prev)
      for (const d of visibleDepts) {
        if (on) next.add(d.deptId)
        else next.delete(d.deptId)
      }
      return next
    })
  }

  const handleSearch = () => {
    setApplied({ field: searchField, keyword: searchInput.trim() })
    setCurrentPage(1)
  }

  const handleSave = async () => {
    if (!roleCode) return
    const body = depts.map(d => ({ deptId: d.deptId, useYn: checked.has(d.deptId) ? 'Y' : 'N' }))
    try {
      const res = await fetch(apiUri.roleSetting.saveDepts(roleCode), {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (json.code && json.code !== '200') {
        alert(json.message ?? '저장 실패')
        return
      }
      onToast?.('저장되었습니다')
    } catch (err) {
      alert(`저장 실패 (${err.message})`)
    }
  }

  if (loading) return <div style={{ color: '#9ca3af', fontSize: '13px', padding: '16px 0' }}>조회 중...</div>

  const totalPages = Math.max(1, Math.ceil(visibleDepts.length / PAGE_SIZE))
  const pageRows   = visibleDepts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>{roleName} · 부서</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GridSearchBar
            fields={DEPT_SEARCH_FIELDS}
            field={searchField}
            input={searchInput}
            onFieldChange={setSearchField}
            onInputChange={setSearchInput}
            onSearch={handleSearch}
          />
          <button className="modal-btn-save" style={{ padding: '6px 18px', fontSize: '13px' }} onClick={handleSave}>저장</button>
        </div>
      </div>
      <table className="grid-table">
        <colgroup>
          <col style={{ width: '44px' }} />
          <col style={{ width: '130px' }} />
          <col />
          <col style={{ width: '76px' }} />
        </colgroup>
        <thead>
          <tr>
            <th style={{ textAlign: 'center' }}>
              <input type="checkbox" ref={cbRef} checked={allChecked} onChange={e => toggleAll(e.target.checked)} />
            </th>
            <th>부서 ID</th>
            <th>부서명</th>
            <th>사용여부</th>
          </tr>
        </thead>
        <tbody>
          {visibleDepts.length === 0 ? (
            <tr><td colSpan={4} className="grid-empty">
              {applied.keyword ? '검색 결과가 없습니다.' : '부서가 없습니다.'}
            </td></tr>
          ) : pageRows.map(d => {
            const on    = checked.has(d.deptId)
            const depth = applied.keyword ? 0 : (d.depth ?? Math.max(0, (d.deptLevel ?? 1) - 1))
            return (
              <tr key={d.deptId}>
                <td style={{ textAlign: 'center' }}>
                  <input type="checkbox" checked={on} onChange={e => toggleOne(d.deptId, e.target.checked)} />
                </td>
                <td>{d.deptId ?? '-'}</td>
                <td>
                  <TreeCell name={d.deptName ?? d.deptNameTree} depth={depth} />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span className={`grid-badge ${on ? 'on' : 'off'}`}>{on ? 'Y' : 'N'}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
    </div>
  )
}

const TABS = [
  { key: 'menu', label: '메뉴권한' },
  { key: 'user', label: '사용자' },
  { key: 'dept', label: '부서' },
]

function RoleSetting() {
  const [roles,        setRoles]        = useState([])
  const [selectedRole, setSelectedRole] = useState(null)
  const [menus,        setMenus]        = useState([])
  const [checkedMenus, setCheckedMenus] = useState(new Set())
  const [activeTab,    setActiveTab]    = useState('menu')
  const [toast,        setToast]        = useState(null)

  const [loadingRoles, setLoadingRoles] = useState(true)
  const [loadingMenus, setLoadingMenus] = useState(false)

  useEffect(() => {
    fetch(apiUri.roleSetting.roles(), { headers: serverConfig.token.authHeader() })
      .then(r => r.json())
      .then(res => setRoles(extractData(res)))
      .catch(() => {})
      .finally(() => setLoadingRoles(false))
  }, [])

  useEffect(() => {
    if (!selectedRole) { setMenus([]); setCheckedMenus(new Set()); return }
    setLoadingMenus(true)
    fetch(apiUri.roleSetting.menus(selectedRole.roleCode), { headers: serverConfig.token.authHeader() })
      .then(r => r.json())
      .then(res => {
        const list = buildMenuTree(extractData(res))
        setMenus(list)
        setCheckedMenus(new Set(list.filter(m => m.useYn === 'Y').map(m => m.menuId)))
      })
      .catch(() => {})
      .finally(() => setLoadingMenus(false))
  }, [selectedRole])

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setActiveTab('menu')
  }

  const handleCheckMenu = (menuId, checked) => {
    const idx = menus.findIndex(m => m.menuId === menuId)
    if (idx === -1) return
    const parentDepth = menus[idx].depth ?? 0
    const ids = [menuId]
    for (let i = idx + 1; i < menus.length; i++) {
      if ((menus[i].depth ?? 0) <= parentDepth) break
      ids.push(menus[i].menuId)
    }
    setCheckedMenus(prev => {
      const next = new Set(prev)
      for (const id of ids) {
        if (checked) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  const handleToggleAll = (checked) => {
    setCheckedMenus(checked ? new Set(menus.map(m => m.menuId)) : new Set())
  }

  const handleSaveMenus = async () => {
    if (!selectedRole) return
    const body = menus.map(m => ({ menuId: m.menuId, useYn: checkedMenus.has(m.menuId) ? 'Y' : 'N' }))
    try {
      const res = await fetch(apiUri.roleSetting.saveMenus(selectedRole.roleCode), {
        method: 'POST',
        headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.code !== '200') {
        alert(json.message ?? '저장 실패')
        return
      }
      const updated = buildMenuTree(json.data ?? [])
      setMenus(updated)
      setCheckedMenus(new Set(updated.filter(m => m.useYn === 'Y').map(m => m.menuId)))
      setToast('저장되었습니다')
    } catch (err) {
      alert(`저장 실패 (${err.message})`)
    }
  }

  return (
    <div className="content-area">
      <div className="content-body" style={{ padding: 0, display: 'flex', overflow: 'hidden', minHeight: '500px' }}>

        {/* 좌측: Role 목록 */}
        <div style={{ width: '220px', flexShrink: 0, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: '13px', color: '#374151' }}>
            권한 목록
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingRoles ? (
              <div style={{ padding: '16px', color: '#9ca3af', fontSize: '13px' }}>조회 중...</div>
            ) : roles.length === 0 ? (
              <div style={{ padding: '16px', color: '#9ca3af', fontSize: '13px' }}>데이터가 없습니다.</div>
            ) : roles.map(role => {
              const active = selectedRole?.roleCode === role.roleCode
              return (
                <div
                  key={role.roleCode}
                  onClick={() => handleRoleSelect(role)}
                  style={{
                    padding: '10px 16px', cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                    background: active ? '#eff6ff' : '#fff',
                    color: active ? '#2563eb' : '#374151',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <div style={{ fontSize: '13px' }}>{role.roleName}</div>
                  <div style={{ fontSize: '11px', color: active ? '#93c5fd' : '#9ca3af', marginTop: '2px' }}>{role.roleCode}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 우측: 탭 패널 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedRole ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '14px' }}>
              좌측에서 권한을 선택하세요
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', paddingLeft: '16px' }}>
                {TABS.map(tab => {
                  const active = activeTab === tab.key
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      style={{
                        padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
                        fontSize: '13px', fontWeight: active ? 600 : 400,
                        color: active ? '#2563eb' : '#6b7280',
                        borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
                        marginBottom: '-1px',
                      }}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
                {activeTab === 'menu' && (
                  <MenuPermTab
                    menus={menus}
                    loading={loadingMenus}
                    checkedMenus={checkedMenus}
                    onCheck={handleCheckMenu}
                    onToggleAll={handleToggleAll}
                    onSave={handleSaveMenus}
                    roleName={selectedRole.roleName}
                  />
                )}
                {activeTab === 'user' && (
                  <RoleUserTab
                    roleCode={selectedRole.roleCode}
                    roleName={selectedRole.roleName}
                    onToast={setToast}
                  />
                )}
                {activeTab === 'dept' && (
                  <RoleDeptTab
                    roleCode={selectedRole.roleCode}
                    roleName={selectedRole.roleName}
                    onToast={setToast}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}

export default RoleSetting
