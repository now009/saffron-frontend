import { useState, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import '../common/css/SaffronLeft.css'

function ChevronIcon({ open }) {
  return (
    <svg className={`chev ${open ? 'open' : ''}`} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 10l5 5 5-5z" />
    </svg>
  )
}

const sortFn = (a, b) =>
  (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
  String(a.menuId ?? '').localeCompare(String(b.menuId ?? ''))

function SaffronLeft({ open, menus }) {
  const location = useLocation()

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
  const boardActive  = location.pathname.startsWith('/board/') || location.pathname.startsWith('/portal/boards')

  return (
    <aside className={`left-sidebar ${open ? '' : 'collapsed'}`}>
      <div className="sidebar-inner">
        <div className="sidebar-dynamic">
          {roots.length === 0 ? (
            <div className="sidebar-empty">접근 가능한 메뉴가 없습니다.</div>
          ) : (
            roots.map((root) => {
              const isOpen   = expanded.has(root.menuId)
              const children = childrenByParent.get(root.menuId) ?? []
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
                      {children.length === 0 ? (
                        <li className="sidebar-empty-sub">하위 메뉴 없음</li>
                      ) : children.map((c) => (
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
                      ))}
                    </ul>
                  )}
                </div>
              )
            })
          )}
        </div>
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

export default SaffronLeft
