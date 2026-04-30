// 상단 우측에 노출되는 정적 메뉴 (DB 메뉴와 무관)
// adminOnly: true 인 항목은 manager 사용자에게만 보임
export const TOP_MENUS = [
  { label: 'Portal', path: '/portal', adminOnly: true },
  { label: 'EAI',    path: '/eai',    adminOnly: false },
]

// 현재 location.pathname을 받아 site 식별자 (소문자) 반환
//   /portal/...  → 'portal'
//   /eai/...     → 'eai'
//   /            → null
export const getCurrentSite = (pathname) => {
  for (const m of TOP_MENUS) {
    if (pathname === m.path || pathname.startsWith(m.path + '/')) {
      return m.label.toLowerCase()
    }
  }
  return null
}
