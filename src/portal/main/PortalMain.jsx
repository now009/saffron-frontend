// ============================================================
// 포털 메인 — 라우트 테이블 + 대시보드(공지사항 위젯)
// 라우트 prefix: /portal (관리), /eai (EAI 모듈)
// PortalDashboard: /portal 진입 시 표시되는 환영 화면 + 최근 공지 5건
// ============================================================
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
import EaiDashboard    from '../../eai/pages/Dashboard.jsx'
import InterfaceList   from '../../eai/pages/InterfaceList.jsx'
import InterfaceDetail from '../../eai/pages/InterfaceDetail.jsx'
import InterfaceForm   from '../../eai/pages/InterfaceForm.jsx'
import MessageHistory  from '../../eai/pages/MessageHistory.jsx'
import ScheduleList    from '../../eai/pages/ScheduleList.jsx'
import Monitoring      from '../../eai/pages/Monitoring.jsx'
import Datasource      from '../../eai/pages/adapter/Datasource.jsx'
import DbAdapterConfig from '../../eai/pages/adapter/DbAdapterConfig.jsx'
import RestConfig      from '../../eai/pages/adapter/RestConfig.jsx'
import SoapConfig      from '../../eai/pages/adapter/SoapConfig.jsx'

// 공지 유형 enum → UI 표시값/배지 색상 매핑
const TYPE_LABEL = { NORMAL: '일반', IMPORTANT: '중요', POPUP: '팝업' }
const TYPE_BADGE = { NORMAL: 'off', IMPORTANT: 'level1', POPUP: 'level2' }

function PortalDashboard() {
  const navigate = useNavigate()
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)

  // 공지 목록을 받아 최신 5건만 노출
  // 백엔드 응답이 array / { list } / { content } / { data } 어느 형태로 오든 호환
  // createdDate가 'YYYY-MM-DD HH:MM:SS' 문자열이라 'T'로 치환 후 Date 파싱
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

// ─── 라우트 테이블 — 좌: portal 관리(사용자/메뉴/권한 등), 우: EAI 모듈 ───
function PortalMain() {
  return (
    <main className="main-content">
      <Routes>
        <Route path="/portal"                    element={<PortalDashboard />} />
        <Route path="/eai"                         element={<EaiDashboard />} />
        <Route path="/eai/interfaces"            element={<InterfaceList />} />
        <Route path="/eai/interfaces/new"        element={<InterfaceForm />} />
        <Route path="/eai/interfaces/:id"        element={<InterfaceDetail />} />
        <Route path="/eai/interfaces/:id/edit"   element={<InterfaceForm />} />
        <Route path="/eai/history"               element={<MessageHistory />} />
        <Route path="/eai/schedules"             element={<ScheduleList />} />
        <Route path="/eai/monitoring"             element={<Monitoring />} />
        <Route path="/eai/datasources"           element={<Datasource />} />
        <Route path="/eai/db-adapter-configs"    element={<DbAdapterConfig />} />
        <Route path="/eai/rest-configs"          element={<RestConfig />} />
        <Route path="/eai/soap-configs"          element={<SoapConfig />} />
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
