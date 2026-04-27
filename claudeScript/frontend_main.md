
- src/portal 폴더를 생성하고 
- portal 폴더 아래에 
  - common
  - images
  - user 
  - menu 
  - role
  - system
  - utils
 폴더를 생성해주고

images 폴더외에 각각 폴더 아래에 css, js 폴더를 만들어줘

- main.html에서 3개의 componet로 화면을 구성하는데
  1. 상단 , 하단 구조로 나누고 
     상단 왼쪽에는 "Saffron Portal" 타이틀을 이미지로 만들어주고 옆에 "사용자","메뉴권한","권한관리","시스템" 메뉴를 만들어주고
     상단 오른쪽에는 접속계정 "User" 아이콘을 만들어줘

     하단은 좌우로 2개의 화면으로 구성하고 
     왼쪽은 일반Portal 메뉴처럼 상단의 메뉴가 클릭하면 상단메뉴 하위메뉴의 내용이 조회되도록 보여주고 
     오른쪽화면은 이후 대쉬보드, 공지사항등이 나올수 있도록 구성할거야 

  2. 위의 구조대로 3개의 주요Componet로 portal 폴더아래 saffronTop, saffronLeft, saffronMain 명으로 구현해줘

  3. 상단메뉴에 "사용자","메뉴권한","권한관리","시스템"로 수정해줘
  5. 상단메뉴에서 매뉴명을 클릭하면 왼쪽 saffronLeft에 서브메뉴를 보여주며 각 서브메뉴의 화면을 오른쪽  saffronMain 에 조회할수 있도록 해줘
     그리고 각메뉴는 아래의 폴더에 있는 component(jsx) 로 Link를 걸어주고 각각 component 페이지에 title을 메뉴명으로 해서 구현해줘
     - 사용자 -> user 폴더 
        - 사용자관리 -> user.jsx
        - 부서관리   -> dept.jsx
     - 메뉴관리 -> menu 폴더
        - 프로그램관리 -> program.jsx
        = 메뉴관리 - menu.jsx
     - 권한관리 -> role 폴더
        - 권한정보 -> role.jsx
        - 권한설정 -> roleSetting.jsx
     - 시스템관리 -> system 폴더
        - 코드관리 -> code.jsx
        - 스케줄관리 -> schedule.jsx
        - 환경설정관리 -> envSetting.jsx

   
  ┌───────────────────────────────────────┬─────────────────────────────────────────────────┐                                                                           
  │                 파일                  │                      내용                       │                                                                         
  ├───────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ src/portal/main/menuConfig.js         │ 메뉴 구조 공유 config (신규)                    │
  ├───────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ src/main/Main.jsx                     │ HashRouter 추가, state 제거                     │
  ├───────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ src/portal/main/SaffronTop.jsx        │ 메뉴 4개, useNavigate로 첫 서브메뉴 이동        │
  ├───────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ src/portal/main/SaffronLeft.jsx       │ Link 기반 서브메뉴, useLocation으로 active 감지 │
  ├───────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ src/portal/main/SaffronMain.jsx       │ Routes/Route로 각 컴포넌트 렌더링               │
  ├───────────────────────────────────────┼─────────────────────────────────────────────────┤
  │ src/portal/common/css/SaffronLeft.css │ Link 색상 스타일 추가                           │
  └───────────────────────────────────────┴─────────────────────────────────────────────────┘

  신규 컴포넌트 (9개):
  - user/user.jsx - 사용자관리
  - user/dept.jsx - 부서관리
  - menu/program.jsx - 프로그램관리
  - menu/menu.jsx - 메뉴관리
  - role/role.jsx - 권한정보
  - role/roleSetting.jsx - 권한설정
  - system/code.jsx - 코드관리
  - system/schedule.jsx - 스케줄관리
  - system/envSetting.jsx - 환경설정관리

상단 User 옆에 Logout 아이콘을 만들고 클릭하면  logout하고 index 페이지로 이동하도록 구현해줘   

-- backend로 http://localhost:8080/portal/menus/list 처럼 rest api를 호출하는데
   backend 아이피를 관리하는 config와 uri를 별도로 관리하고 component에서 uri를 메소드형태로 조회한후 
   뒤에 파라미터를 적용할수 있도록 코드를 수정해줘

-- user_info
user_info ( 사용자정보 ) table 
   user_id       VARCHAR(50)    NOT NULL                  COMMENT '사용자ID',
   dept_id       VARCHAR(20)    NULL                      COMMENT '부서ID',
   user_name     VARCHAR(50)    NOT NULL                  COMMENT '사용자명',
   password      VARCHAR(255)   NOT NULL                  COMMENT '비밀번호',
   email         VARCHAR(100)   NULL                      COMMENT '이메일',
   phone         VARCHAR(50)    NULL                      COMMENT '연락처',
   position      VARCHAR(50)    NULL                      COMMENT '직위',
   job_grade     VARCHAR(20)    NULL                      COMMENT '직급',
   use_yn        CHAR(1)        DEFAULT 'Y'               COMMENT '사용여부',
   manager_yn    CHAR(1)        NULL                      COMMENT '시스템관리자여부',
   last_login_at TIMESTAMP      NULL                      COMMENT '최종로그인일시',
   created_user    VARCHAR(20)  DEFAULT 'system'          COMMENT '생성자',
   created_date    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
   update_user     VARCHAR(20)  DEFAULT 'system'          COMMENT '수정자',
   updated_date    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP COMMENT '수정일시'

위의 테이블 정보를 http://localhost:8080/portal/menus/list 통해 가져오고 menu/menu.jsx에 읽어온 내용을 grid로 구현해줘

- grid왼쪽에 input box, "메뉴아이디","메뉴명" select box를 만들고 "Search"아이콘을 만들어 조회
- grid하단에 10개 row단위로 page navigation을 구현해줘


-- menu
menu_info ( 메뉴정보 ) 
   menu_id        VARCHAR(50)    NOT NULL                  COMMENT '메뉴ID',
   parent_menu_id VARCHAR(50)    NULL                      COMMENT '상위메뉴ID',
   menu_name      VARCHAR(100)   NOT NULL                  COMMENT '메뉴명',
   menu_level     TINYINT        DEFAULT 1                 COMMENT '메뉴레벨(1:대,2:중,3:소)',
   menu_icon      VARCHAR(100)   NULL                      COMMENT '메뉴아이콘',
   sort_order     INT            DEFAULT 0                 COMMENT '정렬순서',
   use_yn         CHAR(1)        DEFAULT 'Y'               COMMENT '사용여부',
------------------------------------------------------------------------------------------------

-------------------------------------------------------------------------
 grid의 컬럼명을 조회된 결과에 따라 구현하고
  - 메뉴 ID : menuId
  - 메뉴명 : menuNameTree
  - 프로그램 ID : programId
  - 프로그램명 : programName
  - 프로그램 URI : programUrl
  - 메뉴사용여부 : use_yn 
- dept에 따라 menu명에 빈공간을 추가해 트리구조처럼 보이도독 구현

rest api 결과는 아래처럼 조회될거임
    {
        "depth": 0,
        "menuNameTree": "시스템관리",
        "menuId": "MENU001",
        "parentMenuId": null,
        "menuLevel": 1,
        "menuIcon": "icon-setting",
        "sortOrder": 1,
        "useYn": "Y",
        "treePath": "MENU001",
        "programId": null,
        "programCode": null,
        "programName": null,
        "programUrl": null
    },

----------------------------
1. 메뉴관리 grid에 컬럼을 추가할것인데 타이틀에는 없고 
   각 row의 오른쪽에 첨부된 이미지 모양의 selectbox을 만들고
   클릭하면 "수정","삭제" 항목이 나오게 구현해줘 

2. main.jsx의 grid row의 selectbox의 "삭제"를 선택하면    
http://localhost:8080/portal/menus/delete/MENU001 형태로 호출하고
"삭제하시겠습니까?" confirm창을 띄우고 
http://localhost:8080/portal/menus/delete/{menuId}로 삭제기능을 넣어줘
이걸 요구했는데 query가 요청된것 같지 않는데?

3. 메뉴관리 리스트 grid에서 "수정"을 클릭하면 테이블 컬럼을 참조하여 입력/수정화면을 Modal로 구현
   - 메뉴수정 
     - title : 메뉴수정 
      
      menuId          VARCHAR(50)    NOT NULL                  COMMENT '메뉴ID',
      menuName        VARCHAR(100)   NOT NULL                  COMMENT '메뉴명',
      programId       VARCHAR(50)    NOT NULL                  COMMENT '프로그램ID',
      useYn           CHAR(1)        DEFAULT 'Y'               COMMENT '사용여부',

   - 메뉴입력 
     - grid 상단 조회버튼 옆에 Add 버튼을 생성하고 입력화면을 Modal로 구현 
     - title : 메뉴 생성 
         menuId          VARCHAR(50)    NOT NULL                  COMMENT '메뉴ID',
         parentMenuId    VARCHAR(50)    NULL                      COMMENT '상위메뉴ID',
         menuName        VARCHAR(100)   NOT NULL                  COMMENT '메뉴명',
         menuLevel       TINYINT        DEFAULT 1                 COMMENT '메뉴레벨(1:대,2:중,3:소)',
         programId       VARCHAR(50)    NOT NULL                  COMMENT '프로그램ID',
         sortOrder       INT            DEFAULT 0                 COMMENT '정렬순서',
         useYn           CHAR(1)        DEFAULT 'Y'               COMMENT '사용여부',
      - parentMenuId가 없으면 menuLevel은 "0"

   화면 하단에 "저장","취소"버튼을 구현

-- menu 생성시 menuId는 GET http://localhost:8080/portal/menus/next-id 로 조회하여 가져오며
화면에서는 readOnly로 구현
메뉴레벨은 입력가능으로 바꾸고 selectBox로 변경 ( 0 ~2 ) , 정렬순서 ( 0 ~ 20 ) 수정
상위메뉴 ID는 depth 0 ~ 1 까지 조회하여 selectBox로 구현

상위메뉴 조회 : GET http://localhost:8080/portal/menus/parent-menus   


add modal에서 backend로 save로 요청할때 파라미터를 어떻게 넘기는가?

-- 메뉴추가
                                                                                                                                                             POST http://localhost:8080/portal/menus/save로 
  Request Body:                                             
  {
    "menuId": "MENU006",
    "parentMenuId": "MENU001",
    "menuName": "테스트메뉴",
    "menuLevel": 1,
    "programId": "PRG001",
    "sortOrder": 3,
    "useYn": "Y"
  }
  전달하고 저장성공시 Modal화면 종료후 list 조회

-- 메뉴수정
POST http://localhost:8080/portal/menus/update       
{
  "menuId": "MENU001",
  "menuName": "시스템관리",
  "programId": "PRG001",
  "useYn": "Y"
}
  전달하고 저장성공시 Modal화면 종료후 list 조회

메뉴저장, 수정 실행시 Fail발생하면 메세지 alert띄고 Modal은 그대로 놔둘것  


-- 메뉴입력/수정 Modal에 
   - 프로그램 ID 아래에 프로그램 URL을 추가해주고
   - 프로그램 ID옆에 프로그램 목록을 조회할 수 있는 Modal을 추가해줘
   - 프로그램 목록 조달 Modal에는 프로그램 ID, 프로그램 URL이 List로 조회되며
   - 프로그램 목록 조회 Modal에서 프로그램 ID를 클릭하면 parent Modal에 프로그램 ID, URL이 input box에 나오도록 구현
   - 정렬순서를 inputbox로 수정하고 숫자만 입력할수 있도록 수정

   - 프로그램 ID 조회버튼을 돋보기모양의 아이콘으로 변경
   - 프로그램 조회는 예를 들어 POST /portal/programs/list?programId=PG001 이런식으로 호출

   - 프로그램 ID를 입력한후 조회버튼을 선택하면 입력된 프로그램 ID로 조회결과가 나오도록 , 조회결과가 없으면 데이타가 없습니다.
   - 프로그램 목록조회 Modal 사이즈를 메뉴 Modal 사이즈와 같게 하고 , 메뉴 Modal 중앙기준으로 오른쪽으로 보여지도록
   - 프로그램 목록조회 Modal : row 왼쪽에 radio button을 추가하고, 하단에 [선택] 버튼을 추가
   -                        선택된 row의 프로그램 ID, URL 을 parent 메뉴입력/수정 프로그램 ID, URL로 나타나게 구현

   메뉴입력/수정 Modal 에서 [저장]버튼을 선택하면 backend로 어떻게 호출하는가?

   [저장]버튼 선택후 결과가 성공이면 Modal창을 닫고, Menu list를 refresh하고, 실패면 fail 메세지를 alert창에 보여주고 Modal창을 닫음<update id="updateProgramUrl">

   
   program_info table에서 programCode 컬럼을 삭제했으니 관련 코드를 수정해줘   
   메뉴 추가/수정 Modal에서 menuLevel은 1부터 3까지로 수정
   menuLevel이 1이면 프로그램 ID, URL이 빈값으로 변경하며

   menu_info table에 menuDirYn 컬럼을 추가했어
   메뉴입력/수정 Modal에 "디렉토리 여부"를 프로그램ID 위에 "Y"/"N"을 선택하는 selectBox로 추가
   디렉토리 여부가 "Y"이면 프로그램ID,프로그램URL은 비활성화 되며, 저장시 빈값으로 전달하도록 구현해줘

   디렉토리 여부를 정렬순서 오른쪽으로 위치해주고
   [저장]버튼 선택시 디렉토리 여부가 "N"일때 상위메뉴가 없으면 "상위메뉴를 입력하세요" alert메세지를 보여줘

   -메뉴입력/수정 Modal 에서 상위메뉴가 선택되면 메뉴Level은 상위메뉴보다 하나 아래여야 하고 
   - 상위메뉴는 menuDirYn값이 "Y"인것만 조회되도록 수정

   menu list grid의 높이를 default로 10개가 나오는 size로 맞춰줘

   menu list grid 컬럼명 "메뉴사용여부" 를 "사용"으로 변경하고, 왼쪽에 "디렉토리" 컬럼을 추가해서 menuDirYn을 보여줘

   메뉴생성/수정에서 menuDirYn값이 파라미터로 전달되는지 확인해줘
   Query에서 NULL로 들어오는데

------------------------------------------------------------------------
- menu.jsx를 참조해서 program.jsx를 구현
program_info table 

  programId       VARCHAR(50)    NOT NULL                  COMMENT '프로그램ID',
  programName     VARCHAR(100)   NOT NULL                  COMMENT '프로그램명',
  programUrl      VARCHAR(255)   NULL                      COMMENT '프로그램URL',
  useYn           CHAR(1)        DEFAULT 'Y'               COMMENT '사용여부',
  sortOrder       INT            DEFAULT 0                 COMMENT '정렬순서',

   backend에서 제공하는 endpoint인데 참조해서 코드  수정해줘
  ┌──────────────────────────────────────────┬─────────────────────────────────────┬────────────────────────┐
  │                   URI                    │                설명                 │       성공 응답        │                                                                                                              
  ├──────────────────────────────────────────┼─────────────────────────────────────┼────────────────────────┤
  │ POST /portal/programs/list               │ 목록 조회 (programId/Name/Url 검색) │ ProgramDto 배열        │
  ├──────────────────────────────────────────┼─────────────────────────────────────┼────────────────────────┤
  │ POST /portal/programs/save               │ 등록                                │ 성공 시 전체 list 반환 │
  ├──────────────────────────────────────────┼─────────────────────────────────────┼────────────────────────┤
  │ POST /portal/programs/update             │ 수정                                │ 성공 시 전체 list 반환 │
  ├──────────────────────────────────────────┼─────────────────────────────────────┼────────────────────────┤
  │ POST /portal/programs/delete/{programId} │ 삭제                                │ ApiResponse            │
  ├──────────────────────────────────────────┼─────────────────────────────────────┼────────────────────────┤
  │ GET /portal/programs/next-id             │ 다음 ID 조회                        │ {"programId":"PGM011"} │
  └──────────────────────────────────────────┴─────────────────────────────────────┴────────────────────────┘

- menu.jsx를 참조해서 dept_info.jsx를 구현
   dept_info table 
  
                           deptId          VARCHAR(20)    NOT NULL                  COMMENT '부서ID',
                           parentDeptId    VARCHAR(20)    NULL                      COMMENT '상위부서ID',
                           deptCode        VARCHAR(20)    NOT NULL                  COMMENT '부서코드',
                           deptName        VARCHAR(100)   NOT NULL                  COMMENT '부서명',
                           deptLevel       TINYINT        DEFAULT 1                 COMMENT '부서레벨(1:본부,2:부,3:팀)',
                           sortOrder       INT            DEFAULT 0                 COMMENT '정렬순서',
                           useYn           CHAR(1)        DEFAULT 'Y'               COMMENT '사용여부',
User 엔드포인트 (/portal/users)
                                                                                                                                                                                                                           
  ┌────────────────────────────────────┬───────────────────────────────────────────────┐
  │                URI                 │                     설명                      │                                                                                                                                   
  ├────────────────────────────────────┼───────────────────────────────────────────────┤
  │ POST /portal/users/list            │ userId, userName, deptId 검색 + deptName JOIN │
  ├────────────────────────────────────┼───────────────────────────────────────────────┤
  │ POST /portal/users/save            │ 등록 (password SHA2 해싱), 성공 시 list 반환  │
  ├────────────────────────────────────┼───────────────────────────────────────────────┤
  │ POST /portal/users/update          │ 수정 (password 제외), 성공 시 list 반환       │
  ├────────────────────────────────────┼───────────────────────────────────────────────┤
  │ POST /portal/users/delete/{userId} │ 삭제                                          │
  ├────────────────────────────────────┼───────────────────────────────────────────────┤
  │ GET /portal/users/next-id          │ {"userId":"user010"}                          │
  └────────────────────────────────────┴───────────────────────────────────────────────┘
              
- menu.jsx를 참조해서 user_info.jsx를 구현
  user_info table
                           userId          VARCHAR(50)    NOT NULL                  COMMENT '사용자ID',
                           deptId          VARCHAR(20)    MULL                      COMMENT '부서ID',
                           userName        VARCHAR(50)    NOT NULL                  COMMENT '사용자명',
                           password        VARCHAR(255)   NOT NULL                  COMMENT '비밀번호',
                           email           VARCHAR(100)                             COMMENT '이메일',
                           phone           VARCHAR(50)                              COMMENT '연락처',
                           position        VARCHAR(50)                              COMMENT '직위',
                           jobGrade        VARCHAR(20)                              COMMENT '직급',
                           useYn           CHAR(1)        DEFAULT 'Y'               COMMENT '사용여부',
                           managerYn       CHAR(1)                                  COMMENT '시스템관리자여부',
                           lastLoginAt     TIMESTAMP                                COMMENT '최종로그인일시',
                           
Dept 엔드포인트 (/portal/depts)

  ┌────────────────────────────────────┬────────────────────────────────────────────────────────────┐
  │                URI                 │                            설명                            │
  ├────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ POST /portal/depts/list            │ deptId, deptName, deptCode 검색 (WITH RECURSIVE 트리 구조) │
  ├────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ POST /portal/depts/save            │ 등록, 성공 시 list 반환                                    │
  ├────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ POST /portal/depts/update          │ 수정, 성공 시 list 반환                                    │
  ├────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ POST /portal/depts/delete/{deptId} │ 삭제 (하위부서/소속사용자 존재 시 fail)                    │
  ├────────────────────────────────────┼────────────────────────────────────────────────────────────┤
  │ GET /portal/depts/next-id          │ {"deptId":"DEPT011"}                                       │
  └────────────────────────────────────┴────────────────────────────────────────────────────────────┘

  -- User 상세
  -- 수정/입력시 
   -- 이메일 입력시 이메일규칙 체크 - @, 도메인체크 로직 추가
   -- "이메일" --> "E-Mail" 로 변경
   -- "연락처" --> "TEL"로 변경
      input box를 3개로 분리 하고 숫자인지 체크 - ( 숫자 3자리 - 숫자 4자리 - 숫자 - 4자리 )
      backend요청시 3개를 합쳐 하나의 변수로 전달 ( "-" 제거하고 전송)
   -- 비밀번호 inputbox 표시 ( * )로 표현 - 변경사항이 없으면 backend로 전송할때 제외   

  -- TEL의 정보는 "-"을 제거하고 숫자만 보여줘 010-1234-5678 -> 010 1234 5678로 수정
  -- 사용자ID와 사용자명의 input box를 축소해서 같은 row에 보여줘

grid에서는 대쉬가 포함된 backend에서 오는 형태로 표현하고, 백엔드가 "010-1234-5678" (대시 포함) 해서 보내줘. 추가/수정화면에서는 대시를 제외하고 3개의 input box에서 보여줘.
백엔드로 전송할 때도 대시 포함 형태("010-1234-5678") 전송


- 생성화면에서 사용자 ID는 사용자가 직접입력할수 있도록 수정
- 사용자 ID 옆에 "사람모양" 아이콘으로 중복체크 기능 추가
- 사용자 ID 는 4자리이상이고 영문자 1개이상 포함하며, 특수문자 제외
- 비밀번호는 최소 4자리 이상 
- 사용자ID,중복체크아이콘,사용자명의 Layout을 Modal을 벗어나지 않도록 맞춰줘
- 생성/수정 Modal에서 사용자ID,중복체크아이콘,사용자명을 제외하고 
  inputbox와 lable을 한 row에 맞춰줘 
  부서관리,메뉴,프로그램 Modal도 같이 맞춰줘
  - 사용자ID,중복체크아이콘 
  - 사용자명 
  두 row로 분리해줘

- 중복체크아이콘을 선택하면 사용자ID에 입력된 ID로 backend에 중복확인을 하고 
  중복되었으면 "사용중인 아이디입니다" 메세지를 alert으로 표현

  호출 URI: GET http://localhost:8080/portal/users/check-id/{userId}
  응답:  
   - 중복      │ {"messageCode":"fail","message":"이미 사용중인 ID입니다"}  
   - 사용 가능 │ {"messageCode":"success","message":"사용 가능한 ID입니다"} 
   
 생성Modal에서 사용자명 inputbox를 공백으로 변경해줘  

-- dept_info
  -- 부서생성 Modal
    - 부서코드 - 영문자,숫자로만 구성, 특수문자 제외
  -- 부서생성/수정 
    - 부서레벨을 1(본부).. 이 아닌 숫자 1 ~3으로 selectbox에 나오게 헤줘
    -  부서레벨을 1 ~ 3으로 변경

-- 부서생성할때 부서코드 중복체크 로직 추가해줘
-- 성공하면 alert메세지 없이 바로 저장 로직 진행
  호출 URI:                                                                                                                                                                                
  GET http://localhost:8080/portal/depts/check-code/{deptCode}                                                                                                                             
                                                                                                                                                                                           
  응답:                                                                                                                                                                                    
                                                            
  ┌───────────┬──────────────────────────────────────────────────────────────────┐
  │  케이스   │                               응답                               │
  ├───────────┼──────────────────────────────────────────────────────────────────┤
  │ 중복      │ {"messageCode":"fail","message":"이미 사용중인 부서코드입니다"}  │
  ├───────────┼──────────────────────────────────────────────────────────────────┤
  │ 사용 가능 │ {"messageCode":"success","message":"사용 가능한 부서코드입니다"} │
  └───────────┴──────────────────────────────────────────────────────────────────┘    

--------------------------------------------
role_info

1. role.jsx 화면을 아래 테이블을 기준으로 구현해줘
TABLE role_info 
         roleCode        VARCHAR(50)    NOT NULL                  COMMENT '권한코드',
         roleName        VARCHAR(100)   NOT NULL                  COMMENT '권한명',
         description     VARCHAR(255)                             COMMENT '권한설명',
         useYn           CHAR(1)        DEFAULT 'Y'               COMMENT '사용여부',

2. 메뉴를 참조해서 구현
3. Grid 
   - 컬럼은 roleCode,roleName,description,useYn 4개를 기본       
   - Tree구조는 없음
   - roleCode는 추가일때는 자동생성, 수정일때는 readOnly

4. role endpoint 
  │                   URI                   │                     설명                     │                                                                                               
  ├─────────────────────────────────────────┼──────────────────────────────────────────────┤
  │ POST /portal/roles/list                 │ roleCode, roleName 검색 조회                 │
  ├─────────────────────────────────────────┼──────────────────────────────────────────────┤
  │ POST /portal/roles/save                 │ 등록, 성공 시 전체 list 반환                 │
  ├─────────────────────────────────────────┼──────────────────────────────────────────────┤
  │ POST /portal/roles/update               │ 수정, 성공 시 전체 list 반환                 │
  ├─────────────────────────────────────────┼──────────────────────────────────────────────┤
  │ POST /portal/roles/delete/{roleCode}    │ 삭제                                         │
  ├─────────────────────────────────────────┼──────────────────────────────────────────────┤
  │ GET /portal/roles/check-code/{roleCode} │ 권한코드 중복 확인                           │
  ├─────────────────────────────────────────┼──────────────────────────────────────────────┤
  │ GET /portal/roles/next-id               │ 다음 roleCode 자동생성 (ROLE001, ROLE002...) │   


-- 메뉴를 참조하여 코드관리 메뉴를 구현해줘
-- code 폴더를 생성하고 code.jsx 로 구현해줘

backend endpoint
- list POST /portal/code/list  - parentCode를 기준으로 Groupping해 조회
- 생성 POST /portal/code,
- 수정 POST /portal/code/{code},
- 삭제 POST /portal/code/{code}

-----------------------------------------------
TODO
backend에서 
 - DB 쿼리: selectAllCodes — 전체 코드를 parentCode, sortOrder, code 순으로 flat하게 조회
  - 트리 빌드: ava 재귀로 parentCode 기준 중첩 구조 생성                                                                                                    
  - 응답 형태:
  [                                                                                                                                                                                        
    {                                                       
      "code": "COLOR",
      "codeName": "색상",
      "children": [
        { "code": "COLOR_RED", "codeName": "빨강", "children": [] },
        { "code": "COLOR_BLUE", "codeName": "파랑", "children": [] }
      ]
    }
  ]
  - parentCode 파라미터: /list 호출 시 parentCode를 전달하면 해당 노드부터의 서브트리만 반환, 미전달 시 전체 트리

  - front code list grid에서 메뉴트리처럼 parentCode 아래에 코드를 조회되도록 수정

    ex) code는 예제로 claude 이해를돕기위함임
        BOARD_TYPE - 게시판유형 
         |_ FAQ
         |_ 자유게시판
         ...
        DEFT_LEVEL - 부서레벨 
         |_ 본부
         |_ 부
         ...

코드생성 Modal에서 Code값을 사용자관리처럼 중복체크 로직 추가
  GET    │ /portal/codes/check-code/{code} │ 코드 중복 체크         

code grid에서 descrition을 제거해줘  

code modal 추가/수정에서 설명을 제거해줘

------------------------------------------------------------
권한 설정 화면 (RoleSettomg.jsx) 구현해줘

[화면 구조]
- 좌우 2단 레이아웃
  - 좌측: Role 목록 패널 (220px 고정)
  - 우측: 메뉴 권한 패널 (탭: 메뉴권한 / 소속사용자 / 소속부서)

[API 연동]
1. Role 목록 조회
   - GET /api/roles
   - 응답: [ { roleCode, roleName, description, useYn } ]

2. Role 선택 시 메뉴 권한 조회
   - GET /api/roles/{roleCode}/menus
   - 응답: [ { menuId, parentMenuId, menuName, menuLevel, menuIcon, sortOrder, useYn } ]

3. 저장 버튼 클릭 시
   - POST /api/roles/{roleCode}/menus
   - Body: [ { menuId, useYn } ]

[컴포넌트 구조]
RoleSettingjsx
├── RoleList.jsx        ← 좌측 Role 목록
└── RoleMenuPanel.jsx   ← 우측 패널
    ├── MenuPermTable.jsx   ← 메뉴 권한 테이블 (체크박스)
    ├── RoleUserList.jsx    ← 소속 사용자 탭
    └── RoleDeptList.jsx    ← 소속 부서 탭

[상태관리]
- selectedRole: 선택된 Role 객체
- menuList: 전체 메뉴 트리
- checkedMenus: 체크된 menuId Set
- activeTab: 현재 활성 탭

[UX 조건]
- Role 클릭 시 우측 메뉴 권한 즉시 갱신
- 전체선택 체크박스로 일괄 ON/OFF
- 체크 상태에 따라 사용/미사용 뱃지 표시
- 저장 성공 시 Toast 알림
- 메뉴는 level 1(굵게) / level 2(들여쓰기) 구분 표시

endpoint를 체크해줘
  - GET /portal/rolesetting                                                                                                                                                                
  - GET /portal/rolesetting/{roleCode}/menus
  - POST /portal/rolesetting/{roleCode}/menus                                                                                                                                              
  - GET /portal/rolesetting/{roleCode}/users                
  - GET /portal/rolesetting/{roleCode}/depts


  각 엔드포인트의 응답 JSON 구조입니다.  화면에 이 구조를 참조해서 보여줘                                                                                                
                                         
  ---                                                                                                                                                                                      
  1. GET /portal/rolesetting                                                                                                                                                               
  {                                                                                                                                                                                        
    "code": "200",                                          
    "message": "success",
    "data": [
      { "roleCode": "ROLE_ADMIN",   "roleName": "시스템관리자", "description": "모든 메뉴 및 기능 접근 가능", "useYn": "Y" },
      { "roleCode": "ROLE_MANAGER", "roleName": "팀장",        "description": "부서 관련 메뉴 및 승인 기능 접근", "useYn": "Y" },
      { "roleCode": "ROLE_USER",    "roleName": "일반사용자",   "description": "기본 메뉴 조회 및 본인 데이터 수정", "useYn": "Y" }
    ]
  }

  ---
  2. GET /portal/rolesetting/{roleCode}/menus
  {
    "code": "200",
    "message": "success",
    "data": [
      { "menuId": "MENU001", "parentMenuId": null,      "menuName": "시스템관리",   "menuLevel": 1, "menuIcon": "icon-setting", "sortOrder": 1, "useYn": "Y" },
      { "menuId": "MENU010", "parentMenuId": "MENU001", "menuName": "공통코드관리", "menuLevel": 2, "menuIcon": "icon-code",    "sortOrder": 1, "useYn": "Y" },
      { "menuId": "MENU011", "parentMenuId": "MENU001", "menuName": "메뉴관리",     "menuLevel": 2, "menuIcon": "icon-menu",    "sortOrder": 2, "useYn": "N" },
      { "menuId": "MENU002", "parentMenuId": null,      "menuName": "사용자관리",   "menuLevel": 1, "menuIcon": "icon-user",    "sortOrder": 2, "useYn": "N" }
    ]
  }

  ▎ useYn: 해당 role에 메뉴가 할당되어 있으면 "Y", 없으면 "N"

  ---
  3. POST /portal/rolesetting/{roleCode}/menus

  Request Body:
  [
    { "menuId": "MENU001", "useYn": "Y" },
    { "menuId": "MENU010", "useYn": "Y" },
    { "menuId": "MENU011", "useYn": "N" }
  ]

  Response (저장 후 최신 목록 반환):
  {
    "code": "200",
    "message": "success",
    "data": [
      { "menuId": "MENU001", "parentMenuId": null,      "menuName": "시스템관리",   "menuLevel": 1, "menuIcon": "icon-setting", "sortOrder": 1, "useYn": "Y" },
      { "menuId": "MENU010", "parentMenuId": "MENU001", "menuName": "공통코드관리", "menuLevel": 2, "menuIcon": "icon-code",    "sortOrder": 1, "useYn": "Y" },
      { "menuId": "MENU011", "parentMenuId": "MENU001", "menuName": "메뉴관리",     "menuLevel": 2, "menuIcon": "icon-menu",    "sortOrder": 2, "useYn": "N" }
    ]
  }

  ---
  4. GET /portal/rolesetting/{roleCode}/users
  {
    "code": "200",
    "message": "success",
    "data": [
      { "userId": "now009",  "userName": "홍길동", "deptName": "본사",         "position": "대표이사", "assignType": "USER" },
      { "userId": "user006", "userName": "강백엔", "deptName": "백엔드개발팀", "position": "과장",     "assignType": "DEPT" }
    ]
  }

  ▎ assignType: "USER" = 사용자 직접 할당, "DEPT" = 부서를 통해 할당

  ---
  5. GET /portal/rolesetting/{roleCode}/depts
  {
    "code": "200",
    "message": "success",
    "data": [
      { "deptId": "DEPT003", "deptName": "개발본부",     "deptLevel": 2 },
      { "deptId": "DEPT007", "deptName": "백엔드개발팀", "deptLevel": 3 }
    ]
  }

  ---
  404 응답 (roleCode 없는 경우)
  {
    "code": "404",
    "message": "존재하지 않는 권한입니다",
    "data": null
  }

  ----------------------

  인증 Flow
  Frontend (8000)
    ↓ POST /auth/login (userId, password)
Auth (8090)
    ↓ access_token 발급 후 redirect → http://localhost:8080/main?access_token=xxx
Backend (8080) /main
    ↓ 토큰 검증 후 redirect → http://localhost:8000/main?access_token=xxx
Frontend /main
    ↓ URL에서 토큰 꺼내 localStorage 저장 → 메인 화면
    