import serverConfig from '../config/serverConfig'

const portal = serverConfig.portal.baseUrl
const auth = serverConfig.auth.baseUrl

const apiUri = {
  auth: {
    login: () => `${auth}/auth/login`,
  },
  user: {
    list:   ()   => `${portal}/portal/user/list`,
    detail: (id) => `${portal}/portal/user/${id}`,
    create: ()   => `${portal}/portal/user`,
    update: (id) => `${portal}/portal/user/${id}`,
    delete: (id) => `${portal}/portal/user/${id}`,
  },
  dept: {
    list:   ()   => `${portal}/portal/dept/list`,
    detail: (id) => `${portal}/portal/dept/${id}`,
    create: ()   => `${portal}/portal/dept`,
    update: (id) => `${portal}/portal/dept/${id}`,
    delete: (id) => `${portal}/portal/dept/${id}`,
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
    list:   ()   => `${portal}/portal/program/list`,
    detail: (id) => `${portal}/portal/program/${id}`,
    create: ()   => `${portal}/portal/program`,
    update: (id) => `${portal}/portal/program/${id}`,
    delete: (id) => `${portal}/portal/program/${id}`,
  },
  role: {
    list:   ()   => `${portal}/portal/role/list`,
    detail: (id) => `${portal}/portal/role/${id}`,
    create: ()   => `${portal}/portal/role`,
    update: (id) => `${portal}/portal/role/${id}`,
    delete: (id) => `${portal}/portal/role/${id}`,
  },
  roleSetting: {
    list:   ()       => `${portal}/portal/roleSetting/list`,
    detail: (userId) => `${portal}/portal/roleSetting/${userId}`,
    update: (userId) => `${portal}/portal/roleSetting/${userId}`,
  },
  code: {
    list:   ()   => `${portal}/portal/code/list`,
    detail: (id) => `${portal}/portal/code/${id}`,
    create: ()   => `${portal}/portal/code`,
    update: (id) => `${portal}/portal/code/${id}`,
    delete: (id) => `${portal}/portal/code/${id}`,
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
}

export default apiUri
