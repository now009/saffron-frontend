
1. project는 react 로 구성할것
2. js,css, image는 각가의 폴더를 생성
3. wep port는 8080
4. index.html에 "Saffron Front" tile 이미지가 필요하고 화면 중간에 login 버튼을 생성
5. react app를 위한 plugin 자동 설치

1. index.html에 아이디 / 비번 입력 기능을 넣어주고 이 정보로 login 버튼을 클릭하면 
   http://localhost:8081/login 로 이동하도록 수정
2. http://localhost:8081/login 정보는 별도의 scr/config 폴더에 auth파일을 만들어 관리할수 있도록 해줘    

front : http://localhost:8000


- redirect URL을 http://localhost:8000/main.html 로 변경
- front에서 fetch를 이용하므로 CORS를 해결할수 있도록 헤더를 수정해줘
- 그리고 인증받은 access_token으로 backend api에서 계속 활용할수 있도록 하고
- front에서 access_token을 활용할수 있도록 하려면 어떻게 해야 되는가?

④ 프론트엔드에서 access_token 활용 방법

  현재 흐름에서 main.html은 ?access_token=<JWT>를 URL로 받습니다.

  // main.html 로드 시 URL에서 토큰 추출 후 저장                                                                                                                                                   
  const params = new URLSearchParams(window.location.search);
  const token = params.get('access_token');

  if (token) {
  sessionStorage.setItem('access_token', token);
  // URL에서 토큰 제거 (보안)
  window.history.replaceState({}, '', window.location.pathname);
  }

  // 이후 API 호출 시 헤더에 포함
  async function callApi(url) {
  const token = sessionStorage.getItem('access_token');
  const response = await fetch(url, {
  headers: {
  'Authorization': `Bearer ${token}`
  }
  });
  return response.json();
  }

  최종 흐름 요약:

  [Frontend :8000] POST /auth/login → sffronAuth :8090
  sffronAuth → 302 → saffron-api :8080/main?access_token=<JWT>
  saffron-api (JWT 검증) → 302 → frontend :8000/main.html?access_token=<JWT>
  [Frontend] URL에서 토큰 추출 → sessionStorage 저장
  [Frontend] fetch('/api/...', Authorization: Bearer <JWT>) → saffron-api :8080

  =======================================================================================