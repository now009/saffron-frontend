export const MENUS = ['사용자', '메뉴권한', '권한관리', '시스템']

export const MENU_CONFIG = {
  '사용자': {
    pathKey: 'user',
    submenus: [
      { label: '사용자관리', path: '/user/user' },
      { label: '부서관리', path: '/user/dept' },
    ],
  },
  '메뉴권한': {
    pathKey: 'menu',
    submenus: [
      { label: '프로그램관리', path: '/menu/program' },
      { label: '메뉴관리', path: '/menu/menu' },
    ],
  },
  '권한관리': {
    pathKey: 'role',
    submenus: [
      { label: '권한정보', path: '/role/role' },
      { label: '권한설정', path: '/role/roleSetting' },
    ],
  },
  '시스템': {
    pathKey: 'system',
    submenus: [
      { label: '코드관리', path: '/system/code' },
      { label: '스케줄관리', path: '/system/schedule' },
      { label: '환경설정관리', path: '/system/envSetting' },
    ],
  },
}

export const PATH_TO_MENU = {
  user: '사용자',
  menu: '메뉴권한',
  role: '권한관리',
  system: '시스템',
}
