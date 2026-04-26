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
    list:      ()     => `${portal}/portal/roles/list`,
    create:    ()     => `${portal}/portal/roles/save`,
    update:    ()     => `${portal}/portal/roles/update`,
    delete:    (id)   => `${portal}/portal/roles/delete/${id}`,
    checkCode: (code) => `${portal}/portal/roles/check-code/${code}`,
    nextId:    ()     => `${portal}/portal/roles/next-id`,
  },
  roleSetting: {
    list:   ()       => `${portal}/portal/roleSetting/list`,
    detail: (userId) => `${portal}/portal/roleSetting/${userId}`,
    update: (userId) => `${portal}/portal/roleSetting/${userId}`,
  },
  code: {
    list:   ()   => `${portal}/portal/codes/list`,
    detail: (id) => `${portal}/portal/codes/${id}`,
    create: ()   => `${portal}/portal/codes`,
    update: (id) => `${portal}/portal/codes/${id}`,
    delete: (id) => `${portal}/portal/codes/${id}`,
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
