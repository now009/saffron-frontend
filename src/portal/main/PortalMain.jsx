import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import apiUri from '../../api/apiUri.js'
import serverConfig from '../../config/serverConfig.js'
import '../common/css/SaffronMain.css'
import '../common/css/grid.css'
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
import EaiMain from '../../eai/eaiMain.jsx'

const TYPE_LABEL = { NORMAL: '일반', IMPORTANT: '중요', POPUP: '팝업' }
const TYPE_BADGE = { NORMAL: 'off', IMPORTANT: 'level1', POPUP: 'level2' }

function PortalDashboard() {
  const navigate = useNavigate()
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(apiUri.notice.list(), {
      method: 'POST',
      headers: { ...serverConfig.token.authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.list ?? data.content ?? data.data ?? [])
        const sorted = [...list].sort((a, b) => {
          const ad = new Date(String(a.createdDate ?? '').replace(' ', 'T')).getTime() || 0
          const bd = new Date(String(b.createdDate ?? '').replace(' ', 'T')).getTime() || 0
          return bd - ad
        })
        setNotices(sorted.slice(0, 5))
      })
      .catch(() => setNotices([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="dashboard-area">
      <div className="dashboard-welcome">
        <h2>Saffron Portal에 오신 것을 환영합니다.</h2>
        <p>좌측 메뉴를 클릭하여 시작하세요.</p>
      </div>

      <div className="grid-container" style={{ marginTop: '24px' }}>
        <div className="grid-toolbar">
          <span className="grid-title">최근 공지사항</span>
          <div className="grid-toolbar-right">
            <button className="grid-add-btn" onClick={() => navigate('/portal/notices/list')}>
              목록
            </button>
          </div>
        </div>

        <div className="grid-wrap">
          <table className="grid-table">
            <colgroup>
              <col style={{ width: '120px' }} />
              <col style={{ width: '90px'  }} />
              <col />
              <col style={{ width: '110px' }} />
              <col style={{ width: '120px' }} />
            </colgroup>
            <thead>
              <tr>
                <th>번호</th>
                <th>유형</th>
                <th>제목</th>
                <th>작성자</th>
                <th>등록일</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="grid-loading">데이터를 불러오는 중...</td></tr>
              ) : notices.length === 0 ? (
                <tr><td colSpan={5} className="grid-empty">공지사항이 없습니다.</td></tr>
              ) : notices.map((n) => (
                <tr key={n.noticeId} onClick={() => navigate(`/portal/notices/${n.noticeId}`)}>
                  <td>{n.noticeId}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`grid-badge ${TYPE_BADGE[n.noticeType] ?? 'off'}`}>
                      {TYPE_LABEL[n.noticeType] ?? n.noticeType ?? '-'}
                    </span>
                  </td>
                  <td>
                    {n.isPinned === 'Y' && <span className="grid-badge admin" style={{ marginRight: 6 }}>고정</span>}
                    {n.title}
                  </td>
                  <td>{n.createdUser ?? '-'}</td>
                  <td>{n.createdDate ? String(n.createdDate).slice(0, 10) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PortalMain() {
  return (
    <main className="main-content">
      <Routes>
        <Route path="/portal"                    element={<PortalDashboard />} />
        <Route path="/eai"                       element={<EaiMain />} />
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

export default PortalMain
