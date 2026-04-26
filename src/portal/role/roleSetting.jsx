import { useState, useEffect, useRef } from 'react'
import apiUri from '../../api/apiUri'
import serverConfig from '../../config/serverConfig'
import '../common/css/grid.css'

const extractData = (res) => (res?.code === '200' ? (res.data ?? []) : [])

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

function MenuPermTab({ menus, loading, checkedMenus, onCheck, onToggleAll, onSave, roleName }) {
  const allChecked  = menus.length > 0 && menus.every(m => checkedMenus.has(m.menuId))
  const someChecked = menus.some(m => checkedMenus.has(m.menuId))
  const cbRef = useRef(null)

  useEffect(() => {
    if (cbRef.current) cbRef.current.indeterminate = !allChecked && someChecked
  }, [allChecked, someChecked])

  if (loading) return <div style={{ color: '#9ca3af', fontSize: '13px', padding: '16px 0' }}>조회 중...</div>

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
          ) : menus.map(menu => {
            const isTop   = menu.menuLevel === 1 || !menu.parentMenuId
            const checked = checkedMenus.has(menu.menuId)
            return (
              <tr key={menu.menuId}>
                <td style={{ textAlign: 'center' }}>
                  <input type="checkbox" checked={checked} onChange={e => onCheck(menu.menuId, e.target.checked)} />
                </td>
                <td>
                  <span style={{
                    paddingLeft: isTop ? '0' : '20px',
                    fontWeight: isTop ? 600 : 400,
                    fontSize: '13px',
                    color: isTop ? '#1e293b' : '#475569',
                  }}>
                    {!isTop && <span style={{ color: '#94a3b8', marginRight: '4px' }}>└─</span>}
                    {menu.menuName}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span className={`grid-badge ${checked ? 'on' : 'off'}`}>{checked ? 'Y' : 'N'}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function RoleUserTab({ users, loading }) {
  if (loading) return <div style={{ color: '#9ca3af', fontSize: '13px', padding: '16px 0' }}>조회 중...</div>
  if (users.length === 0) return <div style={{ color: '#9ca3af', fontSize: '13px', padding: '16px 0' }}>소속 사용자가 없습니다.</div>
  return (
    <table className="grid-table">
      <colgroup>
        <col style={{ width: '120px' }} />
        <col style={{ width: '110px' }} />
        <col />
        <col style={{ width: '100px' }} />
        <col style={{ width: '90px' }} />
      </colgroup>
      <thead>
        <tr>
          <th>사용자 ID</th>
          <th>사용자명</th>
          <th>부서</th>
          <th>직위</th>
          <th>할당유형</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u, i) => (
          <tr key={u.userId ?? i}>
            <td>{u.userId   ?? '-'}</td>
            <td>{u.userName ?? '-'}</td>
            <td>{u.deptName ?? '-'}</td>
            <td>{u.position ?? '-'}</td>
            <td style={{ textAlign: 'center' }}>
              <span className={`grid-badge ${u.assignType === 'USER' ? 'on' : 'off'}`}>
                {u.assignType === 'USER' ? '직접' : '부서'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function RoleDeptTab({ depts, loading }) {
  if (loading) return <div style={{ color: '#9ca3af', fontSize: '13px', padding: '16px 0' }}>조회 중...</div>
  if (depts.length === 0) return <div style={{ color: '#9ca3af', fontSize: '13px', padding: '16px 0' }}>소속 부서가 없습니다.</div>
  return (
    <table className="grid-table">
      <colgroup>
        <col style={{ width: '130px' }} />
        <col />
        <col style={{ width: '76px' }} />
      </colgroup>
      <thead>
        <tr>
          <th>부서 ID</th>
          <th>부서명</th>
          <th>레벨</th>
        </tr>
      </thead>
      <tbody>
        {depts.map(d => (
          <tr key={d.deptId}>
            <td>{d.deptId    ?? '-'}</td>
            <td>{d.deptName  ?? '-'}</td>
            <td style={{ textAlign: 'center' }}>{d.deptLevel ?? '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const TABS = [
  { key: 'menu', label: '메뉴권한' },
  { key: 'user', label: '소속사용자' },
  { key: 'dept', label: '소속부서' },
]

function RoleSetting() {
  const [roles,        setRoles]        = useState([])
  const [selectedRole, setSelectedRole] = useState(null)
  const [menus,        setMenus]        = useState([])
  const [checkedMenus, setCheckedMenus] = useState(new Set())
  const [users,        setUsers]        = useState([])
  const [depts,        setDepts]        = useState([])
  const [activeTab,    setActiveTab]    = useState('menu')
  const [toast,        setToast]        = useState(null)

  const [loadingRoles, setLoadingRoles] = useState(true)
  const [loadingMenus, setLoadingMenus] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingDepts, setLoadingDepts] = useState(false)

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
        const list = extractData(res)
        setMenus(list)
        setCheckedMenus(new Set(list.filter(m => m.useYn === 'Y').map(m => m.menuId)))
      })
      .catch(() => {})
      .finally(() => setLoadingMenus(false))
  }, [selectedRole])

  useEffect(() => {
    if (!selectedRole) return
    if (activeTab === 'user') {
      setLoadingUsers(true)
      fetch(apiUri.roleSetting.users(selectedRole.roleCode), { headers: serverConfig.token.authHeader() })
        .then(r => r.json())
        .then(res => setUsers(extractData(res)))
        .catch(() => {})
        .finally(() => setLoadingUsers(false))
    }
    if (activeTab === 'dept') {
      setLoadingDepts(true)
      fetch(apiUri.roleSetting.depts(selectedRole.roleCode), { headers: serverConfig.token.authHeader() })
        .then(r => r.json())
        .then(res => setDepts(extractData(res)))
        .catch(() => {})
        .finally(() => setLoadingDepts(false))
    }
  }, [selectedRole, activeTab])

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setActiveTab('menu')
    setUsers([])
    setDepts([])
  }

  const handleCheckMenu = (menuId, checked) => {
    setCheckedMenus(prev => {
      const next = new Set(prev)
      checked ? next.add(menuId) : next.delete(menuId)
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
      const updated = json.data ?? []
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
                {activeTab === 'user' && <RoleUserTab users={users} loading={loadingUsers} />}
                {activeTab === 'dept' && <RoleDeptTab depts={depts} loading={loadingDepts} />}
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
