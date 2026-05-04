// ============================================================
// 좌측 사이드바 — 메뉴 트리(최대 3-depth) + 고정 링크(게시판/공지사항)
// props: open(접힘 여부), menus(서버에서 받은 메뉴 평면 배열)
// 동작: parentMenuId 기반으로 평면 배열을 트리로 재구성, 사용자 권한에 따라 메뉴는 이미 필터링된 상태
// ============================================================
import { useState, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import '../common/css/SaffronLeft.css'

// 메뉴 펼침 인디케이터 (▼ ↔ ▶)
function ChevronIcon({ open }) {
  return (
    <svg className={`chev ${open ? 'open' : ''}`} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 10l5 5 5-5z" />
    </svg>
  )
}

// sortOrder 우선, 동일 시 menuId 사전순 — DB sortOrder가 NULL이어도 안정 정렬 보장
const sortFn = (a, b) =>
  (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
  String(a.menuId ?? '').localeCompare(String(b.menuId ?? ''))

function PortalLeft({ open, menus }) {
  const location = useLocation()

  // 평면 배열 → 루트/자식맵으로 변환 (menus 변경 시에만 재계산)
  const { roots, childrenByParent } = useMemo(() => {
    const list = menus ?? []
    const childMap = new Map()
    const rootList = []
    for (const m of list) {
      if (m.parentMenuId) {
        const arr = childMap.get(m.parentMenuId) ?? []
        arr.push(m)
        childMap.set(m.parentMenuId, arr)
      } else {
        rootList.push(m)
      }
    }
    rootList.sort(sortFn)
    for (const arr of childMap.values()) arr.sort(sortFn)
    return { roots: rootList, childrenByParent: childMap }
  }, [menus])

  const [expanded, setExpanded] = useState(new Set())

  // 메뉴 로드 시 모든 루트 자동 펼침 — 사용자가 첫 진입 시 전체 구조를 한눈에 보도록
  useEffect(() => {
    setExpanded(new Set(roots.map((r) => r.menuId)))
  }, [roots])

  const toggleSection = (menuId) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(menuId)) next.delete(menuId)
      else next.add(menuId)
      return next
    })
  }

  const noticeActive = location.pathname.startsWith('/portal/notices')
  const boardActive  = location.pathname.startsWith('/portal/boards')

  return (
    <aside className={`left-sidebar ${open ? '' : 'collapsed'}`}>
      <div className="sidebar-inner">
        <div className="sidebar-dynamic">
          {roots.length === 0 ? (
            <div className="sidebar-empty">접근 가능한 메뉴가 없습니다.</div>
          ) : (
            roots.map((root) => {
              const children = childrenByParent.get(root.menuId) ?? []
              const isDirectory = children.length > 0

              if (!isDirectory) {
                return (
                  <div key={root.menuId} className="sidebar-section">
                    {root.programUrl ? (
                      <Link
                        to={root.programUrl}
                        className={`sidebar-section-header sidebar-section-link ${location.pathname === root.programUrl ? 'active' : ''}`}
                      >
                        <span>{root.menuName}</span>
                      </Link>
                    ) : (
                      <span className="sidebar-section-header sidebar-section-disabled">
                        {root.menuName}
                      </span>
                    )}
                  </div>
                )
              }

              const isOpen = expanded.has(root.menuId)
              return (
                <div key={root.menuId} className="sidebar-section">
                  <button
                    className="sidebar-section-header"
                    onClick={() => toggleSection(root.menuId)}
                  >
                    <span>{root.menuName}</span>
                    <ChevronIcon open={isOpen} />
                  </button>
                  {isOpen && (
                    <ul className="sidebar-submenu">
                      {children.map((c) => {
                        const grandchildren = childrenByParent.get(c.menuId) ?? []
                        if (grandchildren.length > 0) {
                          const isSubOpen = expanded.has(c.menuId)
                          return (
                            <li key={c.menuId}>
                              <button
                                className="sidebar-subgroup-header"
                                onClick={() => toggleSection(c.menuId)}
                              >
                                <span>{c.menuName}</span>
                                <ChevronIcon open={isSubOpen} />
                              </button>
                              {isSubOpen && (
                                <ul className="sidebar-submenu sidebar-submenu-depth2">
                                  {grandchildren.map((g) => (
                                    <li
                                      key={g.menuId}
                                      className={`sidebar-item ${location.pathname === g.programUrl ? 'active' : ''}`}
                                    >
                                      {g.programUrl ? (
                                        <Link to={g.programUrl}>{g.menuName}</Link>
                                      ) : (
                                        <span className="sidebar-item-disabled">{g.menuName}</span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          )
                        }
                        return (
                          <li
                            key={c.menuId}
                            className={`sidebar-item ${location.pathname === c.programUrl ? 'active' : ''}`}
                          >
                            {c.programUrl ? (
                              <Link to={c.programUrl}>{c.menuName}</Link>
                            ) : (
                              <span className="sidebar-item-disabled">{c.menuName}</span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )
            })
          )}
        </div>
        {/* ─── 고정 링크 — 권한 체크 없이 모든 사용자에 노출 ─── */}
        <div className="sidebar-pinned">
          <Link
            to="/portal/boards/list"
            className={`sidebar-pinned-item ${boardActive ? 'active' : ''}`}
          >
            게시판
          </Link>
          <Link
            to="/portal/notices/list"
            className={`sidebar-pinned-item ${noticeActive ? 'active' : ''}`}
          >
            공지사항
          </Link>
        </div>
      </div>
    </aside>
  )
}

export default PortalLeft
