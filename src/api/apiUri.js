import serverConfig from '../config/serverConfig'

const portal = serverConfig.portal.baseUrl
const auth = serverConfig.auth.baseUrl

const apiUri = {
  auth: {
    login: () => `${auth}/auth/login`,
  },
  user: {
    list:   ()   => `${portal}/portal/users/list`,
    create: ()   => `${portal}/portal/users/save`,
    update: ()   => `${portal}/portal/users/update`,
    delete: (id) => `${portal}/portal/users/delete/${id}`,
    checkId: (id) => `${portal}/portal/users/check-id/${id}`,
  },
  dept: {
    list:      ()     => `${portal}/portal/depts/list`,
    create:    ()     => `${portal}/portal/depts/save`,
    update:    ()     => `${portal}/portal/depts/update`,
    delete:    (id)   => `${portal}/portal/depts/delete/${id}`,
    nextId:    ()     => `${portal}/portal/depts/next-id`,
    checkCode: (code) => `${portal}/portal/depts/check-code/${code}`,
  },
  menus: {
    list:        ()   => `${portal}/portal/menus/list`,
    detail:      (id) => `${portal}/portal/menus/${id}`,
    create:      ()   => `${portal}/portal/menus/save`,
    update:      ()   => `${portal}/portal/menus/update`,
    delete:      (id) => `${portal}/portal/menus/delete/${id}`,
    nextId:      ()   => `${portal}/portal/menus/next-id`,
    parentMenus: ()   => `${portal}/portal/menus/parent-menus`,
  },
  program: {
    list:   ()   => `${portal}/portal/programs/list`,
    detail: (id) => `${portal}/portal/programs/${id}`,
    create: ()   => `${portal}/portal/programs/save`,
    update: ()   => `${portal}/portal/programs/update`,
    delete: (id) => `${portal}/portal/programs/delete/${id}`,
    nextId: ()   => `${portal}/portal/programs/next-id`,
  },
  role: {
    list:      ()       => `${portal}/portal/roles/list`,
    create:    ()       => `${portal}/portal/roles/save`,
    update:    ()       => `${portal}/portal/roles/update`,
    delete:    (id)     => `${portal}/portal/roles/delete/${id}`,
    checkCode: (code)   => `${portal}/portal/roles/check-code/${code}`,
    nextId:    ()       => `${portal}/portal/roles/next-id`,
    userMenus: (userId) => `${portal}/portal/roles/user-menus/${userId}`,
  },
  roleSetting: {
    roles:     ()         => `${portal}/portal/rolesetting`,
    menus:     (roleCode) => `${portal}/portal/rolesetting/${roleCode}/menus`,
    saveMenus: (roleCode) => `${portal}/portal/rolesetting/${roleCode}/menus`,
    users:     (roleCode) => `${portal}/portal/rolesetting/${roleCode}/users`,
    saveUsers: (roleCode) => `${portal}/portal/rolesetting/${roleCode}/users`,
    depts:     (roleCode) => `${portal}/portal/rolesetting/${roleCode}/depts`,
    saveDepts: (roleCode) => `${portal}/portal/rolesetting/${roleCode}/depts`,
  },
  code: {
    list:      ()     => `${portal}/portal/codes/list`,
    detail:    (id)   => `${portal}/portal/codes/${id}`,
    create:    ()     => `${portal}/portal/codes/save`,
    update:    ()     => `${portal}/portal/codes/update`,
    delete:    (id)   => `${portal}/portal/codes/delete/${id}`,
    checkCode: (code) => `${portal}/portal/codes/check-code/${code}`,
  },
  schedule: {
    list:   ()   => `${portal}/portal/schedule/list`,
    detail: (id) => `${portal}/portal/schedule/${id}`,
    create: ()   => `${portal}/portal/schedule`,
    update: (id) => `${portal}/portal/schedule/${id}`,
    delete: (id) => `${portal}/portal/schedule/${id}`,
  },
  envSetting: {
    list:   ()    => `${portal}/portal/envSetting/list`,
    detail: (key) => `${portal}/portal/envSetting/${key}`,
    update: (key) => `${portal}/portal/envSetting/${key}`,
  },
  notice: {
    list:   ()   => `${portal}/portal/notices/list`,
    detail: (id) => `${portal}/portal/notices/${id}`,
    create: ()   => `${portal}/portal/notices/save`,
    update: ()   => `${portal}/portal/notices/update`,
    delete: (id) => `${portal}/portal/notices/delete/${id}`,
    nextId: ()   => `${portal}/portal/notices/next-id`,
  },
  board: {
    list:    ()   => `${portal}/portal/boards/list`,
    detail:  (id) => `${portal}/portal/boards/${id}`,
    create:  ()   => `${portal}/portal/boards/save`,
    update:  ()   => `${portal}/portal/boards/update`,
    delete:  (id) => `${portal}/portal/boards/delete/${id}`,
    nextId:  ()   => `${portal}/portal/boards/next-id`,
    stats:   ()   => `${portal}/portal/boards/stats`,
  },
  post: {
    list:    ()                     => `${portal}/portal/boards/posts/list`,
    detail:  (id, currentUser)      => `${portal}/portal/boards/posts/${id}${currentUser ? `?currentUser=${encodeURIComponent(currentUser)}` : ''}`,
    create:  ()                     => `${portal}/portal/boards/posts/save`,
    update:  ()                     => `${portal}/portal/boards/posts/update`,
    delete:  (id)                   => `${portal}/portal/boards/posts/delete/${id}`,
    nextId:  ()                     => `${portal}/portal/boards/posts/next-id`,
    topLikes:(boardId, limit = 5)   => `${portal}/portal/boards/posts/top-likes?${boardId ? `boardId=${encodeURIComponent(boardId)}&` : ''}limit=${limit}`,
  },
  boardFile: {
    byPost:   (postId) => `${portal}/portal/boards/files/post/${postId}`,
    upload:   ()       => `${portal}/portal/boards/files/upload`,
    delete:   (id)     => `${portal}/portal/boards/files/delete/${id}`,
    download: (id)     => `${portal}/portal/boards/files/download/${id}`,
  },
  comment: {
    list:   ()   => `${portal}/portal/boards/comments/list`,
    create: ()   => `${portal}/portal/boards/comments/save`,
    update: ()   => `${portal}/portal/boards/comments/update`,
    delete: (id) => `${portal}/portal/boards/comments/delete/${id}`,
    nextId: ()   => `${portal}/portal/boards/comments/next-id`,
  },
  like: {
    check:  () => `${portal}/portal/boards/likes/check`,
    toggle: () => `${portal}/portal/boards/likes/toggle`,
  },
}

export default apiUri
