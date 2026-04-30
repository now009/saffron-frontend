import { Routes, Route } from 'react-router-dom'
import '../common/css/SaffronMain.css'
import User from '../user/user.jsx'
import Dept from '../user/dept.jsx'
import Program from '../menu/program.jsx'
import Menu from '../menu/menu.jsx'
import Role from '../role/role.jsx'
import RoleSetting from '../role/roleSetting.jsx'
import Code from '../system/code.jsx'
import Schedule from '../system/schedule.jsx'
import EnvSetting from '../system/envSetting.jsx'
import Notice from '../notice/notice.jsx'
import NoticeView from '../notice/noticeView.jsx'
import Board from '../board/board.jsx'
import Post from '../board/post.jsx'
import PostView from '../board/postView.jsx'
import PostEdit from '../board/postEdit.jsx'

function Dashboard() {
  return (
    <div className="dashboard-area">
      <div className="dashboard-welcome">
        <h2>Saffron Portal에 오신 것을 환영합니다.</h2>
        <p>상단 메뉴를 클릭하여 시작하세요.</p>
      </div>
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <span className="card-icon">👤</span>
          <span className="card-label">사용자 관리</span>
        </div>
        <div className="dashboard-card">
          <span className="card-icon">🔐</span>
          <span className="card-label">메뉴 권한</span>
        </div>
        <div className="dashboard-card">
          <span className="card-icon">🛡️</span>
          <span className="card-label">권한 관리</span>
        </div>
        <div className="dashboard-card">
          <span className="card-icon">⚙️</span>
          <span className="card-label">시스템 설정</span>
        </div>
      </div>
    </div>
  )
}

function SaffronMain() {
  return (
    <main className="main-content">
      <Routes>
        <Route path="/"                          element={<Dashboard />} />
        <Route path="/portal/users/list"         element={<User />} />
        <Route path="/portal/depts/list"         element={<Dept />} />
        <Route path="/portal/menus/list"         element={<Menu />} />
        <Route path="/portal/programs/list"      element={<Program />} />
        <Route path="/portal/codes/list"         element={<Code />} />
        <Route path="/portal/roles/list"         element={<Role />} />
        <Route path="/portal/rolesetting/list"   element={<RoleSetting />} />
        <Route path="/portal/schedules/list"     element={<Schedule />} />
        <Route path="/portal/env-settings/list"  element={<EnvSetting />} />
        <Route path="/portal/notices/list"       element={<Notice />} />
        <Route path="/portal/notices/new"        element={<NoticeView />} />
        <Route path="/portal/notices/:noticeId"  element={<NoticeView />} />
        <Route path="/portal/boards/list"                    element={<Board />} />
        <Route path="/portal/boards/posts/:boardId"          element={<Post />} />
        <Route path="/portal/boards/:boardId/write"          element={<PostEdit />} />
        <Route path="/portal/boards/:boardId/write/:postId"  element={<PostEdit />} />
        <Route path="/portal/boards/:boardId/:postId"        element={<PostView />} />
      </Routes>
    </main>
  )
}

export default SaffronMain
