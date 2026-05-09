// 상단 우측에 노출되는 정적 메뉴 (DB 메뉴와 무관)
// adminOnly: true 인 항목은 manager 사용자에게만 보임
export const TOP_MENUS = [
  { label: 'Portal', path: '/portal',       adminOnly: true  },
  { label: 'EAI',    path: '/eai',          adminOnly: false },
  { label: 'QBANK',  path: '/admin/qbank',  adminOnly: true  },
  { label: '시험',   path: '/exam',         adminOnly: false },
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

// /exam/* 경로 여부 — 포털 레이아웃을 사용하지 않는 독립 화면
export const isExamPath = (pathname) => pathname === '/exam' || pathname.startsWith('/exam/')
