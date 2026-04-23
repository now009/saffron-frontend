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
        <Route path="/" element={<Dashboard />} />
        <Route path="/user/user" element={<User />} />
        <Route path="/user/dept" element={<Dept />} />
        <Route path="/menu/program" element={<Program />} />
        <Route path="/menu/menu" element={<Menu />} />
        <Route path="/role/role" element={<Role />} />
        <Route path="/role/roleSetting" element={<RoleSetting />} />
        <Route path="/system/code" element={<Code />} />
        <Route path="/system/schedule" element={<Schedule />} />
        <Route path="/system/envSetting" element={<EnvSetting />} />
      </Routes>
    </main>
  )
}

export default SaffronMain
