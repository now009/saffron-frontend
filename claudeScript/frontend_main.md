
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



