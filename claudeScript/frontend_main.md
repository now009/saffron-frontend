# Saffron Frontend 구현 현황

## 1. 프로젝트 구조

```
src/
├── js/
│   └── App.jsx                      # 로그인 페이지 (Auth 서버 form submit)
├── main/
│   └── Main.jsx                     # 로그인 후 진입점 (토큰 수신 → localStorage 저장)
├── SaffronBody.jsx                  # 메인 랜딩 화면 (Portal 미선택 시)
├── SaffronTop.jsx                   # 상단 공통 (로그인 사용자, Portal 메뉴, Logout)
├── eai/
│   └── eaiMain.jsx                  # EAI 전용 랜딩 페이지
├── portal/
│   ├── main/
│   │   ├── menuConfig.js            # 상단 메뉴 구조 정의 (DB 미사용)
│   │   ├── PortalLeft.jsx           # 좌측 사이드 메뉴 (사용자 권한 기반)
│   │   └── PortalMain.jsx           # 우측 콘텐츠 영역 (Routes)
│   ├── common/css/
│   │   ├── grid.css
│   │   ├── SaffronLeft.css
│   │   └── SaffronTop.css
│   ├── images/
│   │   └── portal-logo.svg
│   ├── user/
│   │   ├── user.jsx                 # 사용자관리
│   │   └── dept.jsx                 # 부서관리
│   ├── menu/
│   │   ├── menu.jsx                 # 메뉴관리
│   │   └── program.jsx              # 프로그램관리
│   ├── role/
│   │   ├── role.jsx                 # 권한정보
│   │   └── roleSetting.jsx          # 권한설정
│   ├── system/
│   │   ├── code.jsx                 # 코드관리
│   │   ├── schedule.jsx             # 스케줄관리
│   │   └── envSetting.jsx           # 환경설정관리
│   ├── board/
│   │   ├── board.jsx                # 게시판 목록
│   │   ├── post.jsx                 # 글 작성
│   │   ├── postView.jsx             # 글 조회
│   │   ├── postEdit.jsx             # 글 수정
│   │   └── board.css
│   └── notice/
│       ├── notice.jsx               # 공지사항 목록
│       ├── noticeView.jsx           # 공지사항 상세/수정
│       └── notice.css
├── api/
│   └── apiUri.js                    # API URI 중앙 관리
└── config/
    └── serverConfig.js              # 서버 주소 및 토큰 헤더 관리
```

---

## 2. 인증 Flow

```
Frontend (8000)
    ↓ POST /auth/login (userId, password)
Auth (8090)
    ↓ access_token 발급 후 redirect → http://localhost:8080/main?access_token=xxx
Backend (8080) /main
    ↓ 토큰 검증 후 redirect → http://localhost:8000/main?access_token=xxx
Frontend /main
    ↓ URL에서 토큰 꺼내 localStorage 저장 → 메인 화면
```

---

## 3. API 엔드포인트

### User (/portal/users)
| URI | 설명 |
|-----|------|
| POST /portal/users/list | 목록 조회 (userId, userName, deptId 검색) |
| POST /portal/users/save | 등록 (password SHA2 해싱) |
| POST /portal/users/update | 수정 (password 제외) |
| POST /portal/users/delete/{userId} | 삭제 |
| GET  /portal/users/next-id | 다음 userId 채번 |
| GET  /portal/users/check-id/{userId} | ID 중복 확인 |

### Dept (/portal/depts)
| URI | 설명 |
|-----|------|
| POST /portal/depts/list | 목록 조회 (트리 구조) |
| POST /portal/depts/save | 등록 |
| POST /portal/depts/update | 수정 |
| POST /portal/depts/delete/{deptId} | 삭제 |
| GET  /portal/depts/next-id | 다음 deptId 채번 |
| GET  /portal/depts/check-code/{deptCode} | 부서코드 중복 확인 |

### Menu (/portal/menus)
| URI | 설명 |
|-----|------|
| POST /portal/menus/list | 목록 조회 (site 파라미터 포함) |
| POST /portal/menus/save | 등록 |
| POST /portal/menus/update | 수정 |
| POST /portal/menus/delete/{menuId} | 삭제 |
| GET  /portal/menus/next-id | 다음 menuId 채번 |
| GET  /portal/menus/parent-menus | 상위메뉴 목록 (menuDirYn=Y) |
| GET  /portal/roles/user-menus/{userId} | 사용자 권한 메뉴 조회 |

### Program (/portal/programs)
| URI | 설명 |
|-----|------|
| POST /portal/programs/list | 목록 조회 |
| POST /portal/programs/save | 등록 |
| POST /portal/programs/update | 수정 |
| POST /portal/programs/delete/{programId} | 삭제 |
| GET  /portal/programs/next-id | 다음 programId 채번 |

### Role (/portal/roles)
| URI | 설명 |
|-----|------|
| POST /portal/roles/list | 목록 조회 |
| POST /portal/roles/save | 등록 |
| POST /portal/roles/update | 수정 |
| POST /portal/roles/delete/{roleCode} | 삭제 |
| GET  /portal/roles/check-code/{roleCode} | 코드 중복 확인 |
| GET  /portal/roles/next-id | 다음 roleCode 채번 |

### RoleSetting (/portal/rolesetting)
| URI | 설명 |
|-----|------|
| GET  /portal/rolesetting | Role 목록 조회 |
| GET  /portal/rolesetting/{roleCode}/menus | 메뉴 권한 조회 |
| POST /portal/rolesetting/{roleCode}/menus | 메뉴 권한 저장 |
| GET  /portal/rolesetting/{roleCode}/users | 소속 사용자 조회 |
| GET  /portal/rolesetting/{roleCode}/depts | 소속 부서 조회 |

### Code (/portal/codes)
| URI | 설명 |
|-----|------|
| POST /portal/codes/list | 목록 조회 (트리 구조) |
| POST /portal/codes/save | 등록 |
| POST /portal/codes/update | 수정 |
| POST /portal/codes/delete/{code} | 삭제 |
| GET  /portal/codes/check-code/{code} | 코드 중복 확인 |

### Notice (/portal/notices)
| URI | 설명 |
|-----|------|
| POST /portal/notices/list | 목록 조회 (title/noticeType/useYn 검색) |
| GET  /portal/notices/{noticeId} | 상세 조회 + viewCount 증가 |
| POST /portal/notices/save | 등록 |
| POST /portal/notices/update | 수정 |
| POST /portal/notices/delete/{noticeId} | 삭제 |
| GET  /portal/notices/next-id | 다음 noticeId 채번 (NT0000001 형식) |

### Schedule / EnvSetting
| URI | 설명 |
|-----|------|
| GET  /portal/schedule/list | 스케줄 목록 |
| GET/POST /portal/envSetting/* | 환경설정 |

---

## 4. 주요 구현 특이사항

### 공통
- `serverConfig.js`: 서버 baseUrl, 토큰 헤더 관리
- `apiUri.js`: 모든 API URI 메서드 형태로 중앙 관리
- `grid.css`: 공통 그리드/모달/뱃지 스타일

### 사용자 (user.jsx)
- 사용자ID: 직접 입력, 4자리 이상, 영문자 1개 이상, 특수문자 제외
- 중복 확인 버튼 필수 (저장 시 미확인이면 자동 실행)
- TEL: 3개 input 분리 입력, 저장 시 대시 포함 형태(`010-1234-5678`) 전송
- 비밀번호: `*` 표시, 변경 없으면 전송 제외

### 부서 (dept.jsx)
- 부서코드: 영문자·숫자만, 특수문자 제외, 중복 확인 필수
- 부서레벨: 1~3 selectBox, 수정 시 readOnly
- 상위부서 선택 시 레벨 자동 계산 (`부모레벨 + 1`, max 3)

### 메뉴 (menu.jsx)
- `menuDirYn=Y`: 디렉토리 메뉴 (프로그램ID/URL 비활성화)
- `menuDirYn=N`: 상위메뉴 필수
- 메뉴레벨: 1~3, 상위메뉴 선택 시 자동 설정
- site 파라미터: menuConfig.js 기반 selectBox 선택
- 프로그램 조회 모달: 우측 중앙 위치, radio 선택 후 [선택] 버튼

### 권한설정 (roleSetting.jsx)
- 응답 구조: `{ code: "200", message, data: [...] }`
- `extractData(res)` 헬퍼로 파싱
- 탭: 메뉴권한 / 소속사용자 / 소속부서
- 메뉴권한 저장 성공 시 Toast 알림

### 코드관리 (code.jsx)
- 백엔드 응답: `{ code, codeName, children: [...] }` 중첩 트리
- `flattenTree()` 로 flat 배열 변환 후 depth 기반 들여쓰기 표시
- parentCode 저장 시 빈값 → null 변환

### 공지사항 (notice.jsx / noticeView.jsx)
- 관리자(managerYn=Y)만 수정/삭제 가능
- 비관리자: 읽기 전용 텍스트 표시
- PortalMain.jsx 에서 최신 5건 미리보기

### SaffronTop.jsx
- `managerYn=Y`인 경우에만 "Portal" 메뉴 표시
- 상단 왼쪽: Portal 메뉴 (menuConfig.js 관리, DB 미사용)

---

## 5. menuConfig.js 구조 (src/portal/main/menuConfig.js)

```js
// site 값은 소문자로 API 파라미터에 사용
const SITE_LIST = [
  { label: 'Portal', value: 'portal' },
  { label: 'EAI',    value: 'eai'    },
]
```

---

## 6. menu_info 테이블 주요 컬럼

| 컬럼 | 설명 |
|------|------|
| menuId | 메뉴ID |
| parentMenuId | 상위메뉴ID |
| menuName | 메뉴명 |
| menuLevel | 메뉴레벨 (1~3) |
| programId | 연결 프로그램ID |
| sortOrder | 정렬순서 |
| useYn | 사용여부 |
| menuDirYn | 디렉토리 여부 (Y/N) |
| site | 사이트 구분 (portal/eai) |
