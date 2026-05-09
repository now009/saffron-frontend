# 문제은행 / 설문조사 Web System

## 목차
1. [시스템 개요](#1-시스템-개요)
2. [DB 테이블 설계](#2-db-테이블-설계)
3. [DDL 및 예제 데이터 SQL](#3-ddl-및-예제-데이터-sql)
4. [Backend API 엔드포인트](#4-backend-api-엔드포인트)
5. [Frontend 구현 지시](#5-frontend-구현-지시)
6. [개발 순서](#6-개발-순서)

---

## 1. 시스템 개요

### 주요 기능

| 구분 | 기능 |
|------|------|
| 관리자 | 시험종류 설정 (기말시험, 중간시험, 설문 등) |
| 관리자 | 시험대상 설정 (국어, 수학, 학년 등) |
| 관리자 | 문항 등록 — 주관식 / 객관식 (2~8 선다형) |
| 관리자 | 문제 질문, 답안 (Text / 이미지), 정답 설정 |
| 관리자 | 채점 기능 |
| 응시자 | 이름 / 사번(학번) 입력 |
| 응시자 | 시험종류 + 시험대상 선택 후 응시 및 제출 |

### 테이블 관계 요약

```
exam_type ──┐
            ├──► exam_paper ──► question ──► question_choice
exam_subject┘                      │
                                   ▼
exam_session ──────────────► answer_sheet
```

---

## 2. DB 테이블 설계

| 테이블명 | 설명 |
|----------|------|
| `exam_type` | 시험 종류 (기말시험, 설문 등) |
| `exam_subject` | 시험 대상 (국어, 수학, 학년 등) |
| `exam_paper` | 출제 시험지 (종류 + 대상 묶음) |
| `question` | 문항 (질문, 유형, 배점) |
| `question_choice` | 객관식 보기 (텍스트/이미지, 정답 여부) |
| `exam_session` | 응시 세션 (이름, 사번, 시간) |
| `answer_sheet` | 제출 답안 및 채점 결과 |

---

## 3. DDL 및 예제 데이터 SQL

```sql
-- ============================================================
-- 문제은행 시스템 DDL + 예제 데이터
-- Database: saffron (MariaDB)
-- ============================================================

USE saffron;

-- ------------------------------------------------------------
-- 1. 시험 종류
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_type (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL COMMENT '시험종류명 (기말시험, 설문조사 등)',
  is_survey  TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '설문이면 1 (정답 없음)',
  created_at DATETIME              DEFAULT NOW()
) COMMENT='시험 종류';

-- ------------------------------------------------------------
-- 2. 시험 대상
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_subject (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL COMMENT '과목/대상명 (국어, 수학 등)',
  grade      VARCHAR(50)           COMMENT '학년 (1학년, 2학년 등, 선택)',
  created_at DATETIME              DEFAULT NOW()
) COMMENT='시험 대상';

-- ------------------------------------------------------------
-- 3. 출제 시험지 (종류 + 대상 조합)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_paper (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  exam_type_id    INT          NOT NULL,
  exam_subject_id INT          NOT NULL,
  title           VARCHAR(200)          COMMENT '시험지 제목',
  time_limit_min  INT                   COMMENT '제한시간(분), NULL=무제한',
  is_active       TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '출제 활성화 여부',
  created_at      DATETIME              DEFAULT NOW(),
  FOREIGN KEY (exam_type_id)    REFERENCES exam_type(id),
  FOREIGN KEY (exam_subject_id) REFERENCES exam_subject(id)
) COMMENT='출제 시험지';

-- ------------------------------------------------------------
-- 4. 문항
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS question (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  exam_paper_id INT          NOT NULL,
  seq           INT          NOT NULL COMMENT '출제 순서',
  q_type        ENUM('single','multi','subjective') NOT NULL
                             COMMENT 'single=단일선택, multi=다중선택, subjective=주관식',
  question_text TEXT         NOT NULL COMMENT '질문 내용',
  image_url     VARCHAR(500)          COMMENT '문제 이미지 경로',
  score         INT          NOT NULL DEFAULT 1 COMMENT '배점',
  created_at    DATETIME              DEFAULT NOW(),
  FOREIGN KEY (exam_paper_id) REFERENCES exam_paper(id)
) COMMENT='문항';

-- ------------------------------------------------------------
-- 5. 객관식 보기 (2~8개)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS question_choice (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT         NOT NULL,
  seq         INT         NOT NULL COMMENT '보기 번호 (1~8)',
  choice_text TEXT                 COMMENT '보기 텍스트',
  image_url   VARCHAR(500)         COMMENT '보기 이미지 경로',
  is_correct  TINYINT(1)  NOT NULL DEFAULT 0 COMMENT '정답 여부 (관리자 채점용)',
  FOREIGN KEY (question_id) REFERENCES question(id)
) COMMENT='객관식 보기';

-- ------------------------------------------------------------
-- 6. 응시 세션
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_session (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  exam_paper_id INT          NOT NULL,
  examinee_name VARCHAR(100) NOT NULL COMMENT '응시자 이름',
  examinee_no   VARCHAR(50)           COMMENT '사번 또는 학번',
  started_at    DATETIME              DEFAULT NOW(),
  submitted_at  DATETIME              COMMENT '제출 시각',
  total_score   INT                   COMMENT '채점 완료 후 합산 점수',
  FOREIGN KEY (exam_paper_id) REFERENCES exam_paper(id)
) COMMENT='응시 세션';

-- ------------------------------------------------------------
-- 7. 답안지
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS answer_sheet (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  session_id      INT        NOT NULL,
  question_id     INT        NOT NULL,
  answer_text     TEXT                COMMENT '주관식 답안',
  selected_choice INT                 COMMENT '객관식 선택 choice_id',
  is_correct      TINYINT(1)          COMMENT '채점 결과 (1=정답, 0=오답, NULL=미채점)',
  graded_at       DATETIME            COMMENT '채점 시각',
  FOREIGN KEY (session_id)  REFERENCES exam_session(id),
  FOREIGN KEY (question_id) REFERENCES question(id)
) COMMENT='제출 답안 및 채점 결과';


-- ============================================================
-- 예제 데이터
-- ============================================================

-- 1. 시험 종류
INSERT INTO exam_type (name, is_survey) VALUES
  ('중간고사', 0),
  ('기말고사', 0),
  ('수시평가', 0),
  ('만족도 설문', 1);

-- 2. 시험 대상
INSERT INTO exam_subject (name, grade) VALUES
  ('국어', '1학년'),
  ('수학', '1학년'),
  ('영어', '2학년'),
  ('과학', '2학년'),
  ('교육과정 만족도', NULL);

-- 3. 출제 시험지
INSERT INTO exam_paper (exam_type_id, exam_subject_id, title, time_limit_min, is_active) VALUES
  (1, 1, '1학년 국어 중간고사', 50, 1),
  (1, 2, '1학년 수학 중간고사', 60, 1),
  (4, 5, '2024년 교육과정 만족도 설문', NULL, 1);

-- 4. 문항 — 1학년 국어 중간고사 (exam_paper_id=1)
INSERT INTO question (exam_paper_id, seq, q_type, question_text, score) VALUES
  (1, 1, 'single',     '다음 중 맞춤법이 올바른 것은?', 2),
  (1, 2, 'single',     '다음 글의 중심 내용으로 가장 적절한 것은?', 3),
  (1, 3, 'multi',      '다음 중 품사가 같은 것을 모두 고르시오.', 4),
  (1, 4, 'subjective', '다음 시의 주제를 한 문장으로 서술하시오.', 5),
  (1, 5, 'single',     '밑줄 친 단어의 반의어는?', 2);

-- 5. 객관식 보기 — question 1 (맞춤법)
INSERT INTO question_choice (question_id, seq, choice_text, is_correct) VALUES
  (1, 1, '안되요',   0),
  (1, 2, '안돼요',   1),
  (1, 3, '않돼요',   0),
  (1, 4, '않되요',   0);

-- 객관식 보기 — question 2 (중심 내용)
INSERT INTO question_choice (question_id, seq, choice_text, is_correct) VALUES
  (2, 1, '자연과 인간의 공존', 1),
  (2, 2, '과학 기술의 발전',   0),
  (2, 3, '역사적 사건의 교훈', 0),
  (2, 4, '경제 성장의 중요성', 0);

-- 객관식 보기 — question 3 (품사, 다중선택)
INSERT INTO question_choice (question_id, seq, choice_text, is_correct) VALUES
  (3, 1, '빠르다', 1),
  (3, 2, '학교',   0),
  (3, 3, '아름답다', 1),
  (3, 4, '달리다', 0),
  (3, 5, '높다',   1);

-- 객관식 보기 — question 5 (반의어)
INSERT INTO question_choice (question_id, seq, choice_text, is_correct) VALUES
  (5, 1, '기쁨',   0),
  (5, 2, '슬픔',   1),
  (5, 3, '행복',   0),
  (5, 4, '설렘',   0);

-- 6. 문항 — 설문 (exam_paper_id=3)
INSERT INTO question (exam_paper_id, seq, q_type, question_text, score) VALUES
  (3, 1, 'single',     '전반적인 교육과정에 만족하십니까?', 0),
  (3, 2, 'single',     '강의 내용의 난이도는 적절했습니까?', 0),
  (3, 3, 'subjective', '개선이 필요한 사항을 자유롭게 작성해주세요.', 0);

-- 설문 보기 — question 6
INSERT INTO question_choice (question_id, seq, choice_text, is_correct) VALUES
  (6, 1, '매우 만족', 0),
  (6, 2, '만족',     0),
  (6, 3, '보통',     0),
  (6, 4, '불만족',   0),
  (6, 5, '매우 불만족', 0);

-- 설문 보기 — question 7
INSERT INTO question_choice (question_id, seq, choice_text, is_correct) VALUES
  (7, 1, '매우 쉬움', 0),
  (7, 2, '쉬움',     0),
  (7, 3, '적절함',   0),
  (7, 4, '어려움',   0),
  (7, 5, '매우 어려움', 0);

-- 7. 응시 세션 예제
INSERT INTO exam_session (exam_paper_id, examinee_name, examinee_no, submitted_at, total_score) VALUES
  (1, '홍길동', '20240001', NOW(), NULL),
  (1, '김영희', '20240002', NOW(), NULL);

-- 8. 답안지 예제 (홍길동 session_id=1)
INSERT INTO answer_sheet (session_id, question_id, answer_text, selected_choice) VALUES
  (1, 1, NULL, 6),   -- 보기 2번(seq=2) choice id=6 선택 (안돼요)
  (1, 2, NULL, 9),   -- 보기 1번 선택
  (1, 4, '이 시의 주제는 자연과 인간의 조화로운 공존이다.', NULL);
```

---

## 4. Backend API 엔드포인트

> **Prefix: `/api/qbank`**

### 관리자 API

| Method | URL | 설명 |
|--------|-----|------|
| `GET` | `/api/qbank/admin/exam-types` | 시험종류 목록 조회 |
| `POST` | `/api/qbank/admin/exam-types` | 시험종류 등록 |
| `PUT` | `/api/qbank/admin/exam-types/{id}` | 시험종류 수정 |
| `DELETE` | `/api/qbank/admin/exam-types/{id}` | 시험종류 삭제 |
| `GET` | `/api/qbank/admin/exam-subjects` | 시험대상 목록 조회 |
| `POST` | `/api/qbank/admin/exam-subjects` | 시험대상 등록 |
| `PUT` | `/api/qbank/admin/exam-subjects/{id}` | 시험대상 수정 |
| `DELETE` | `/api/qbank/admin/exam-subjects/{id}` | 시험대상 삭제 |
| `GET` | `/api/qbank/admin/papers` | 시험지 목록 조회 |
| `POST` | `/api/qbank/admin/papers` | 시험지 생성 |
| `PUT` | `/api/qbank/admin/papers/{id}` | 시험지 수정 |
| `DELETE` | `/api/qbank/admin/papers/{id}` | 시험지 삭제 |
| `GET` | `/api/qbank/admin/papers/{paperId}/questions` | 문항 목록 조회 |
| `POST` | `/api/qbank/admin/papers/{paperId}/questions` | 문항 등록 (이미지 업로드 포함) |
| `PUT` | `/api/qbank/admin/questions/{id}` | 문항 수정 |
| `DELETE` | `/api/qbank/admin/questions/{id}` | 문항 삭제 |
| `POST` | `/api/qbank/admin/questions/{id}/choices` | 보기 등록 |
| `PUT` | `/api/qbank/admin/choices/{id}` | 보기 수정 |
| `DELETE` | `/api/qbank/admin/choices/{id}` | 보기 삭제 |
| `GET` | `/api/qbank/admin/sessions` | 응시 세션 목록 조회 |
| `GET` | `/api/qbank/admin/sessions/{id}/answers` | 답안지 조회 |
| `POST` | `/api/qbank/admin/sessions/{id}/grade` | 채점 (자동+수동) |

### 응시자 API

| Method | URL | 설명 |
|--------|-----|------|
| `GET` | `/api/qbank/exam/types` | 시험종류 목록 (응시용) |
| `GET` | `/api/qbank/exam/subjects` | 시험대상 목록 (응시용) |
| `GET` | `/api/qbank/exam/papers` | 시험지 조회 (`?typeId=&subjectId=`) |
| `POST` | `/api/qbank/exam/sessions` | 응시 시작 (이름/사번 입력) |
| `POST` | `/api/qbank/exam/sessions/{id}/submit` | 답안 제출 |

### 주요 Request/Response 예시

```json
// POST /api/qbank/exam/sessions — 응시 시작
Request:
{
  "examPaperId": 1,
  "examineeName": "홍길동",
  "examineeNo": "20240001"
}
Response:
{
  "sessionId": 1,
  "title": "1학년 국어 중간고사",
  "timeLimitMin": 50,
  "questions": [
    {
      "id": 1,
      "seq": 1,
      "qType": "single",
      "questionText": "다음 중 맞춤법이 올바른 것은?",
      "imageUrl": null,
      "score": 2,
      "choices": [
        { "id": 5, "seq": 1, "choiceText": "안되요", "imageUrl": null },
        { "id": 6, "seq": 2, "choiceText": "안돼요", "imageUrl": null }
      ]
    }
  ]
}
// ※ is_correct는 응시자 응답에 절대 포함하지 않음

// POST /api/qbank/exam/sessions/{id}/submit — 답안 제출
Request:
{
  "answers": [
    { "questionId": 1, "selectedChoiceId": 6 },
    { "questionId": 4, "answerText": "자연과 인간의 조화로운 공존이다." }
  ]
}

// POST /api/qbank/admin/sessions/{id}/grade — 채점
Request:
{
  "autoGrade": true,
  "manualGrades": [
    { "questionId": 4, "isCorrect": true }
  ]
}
```

---

## 5. Frontend 구현 지시

### Claude에게 Backend 지시 프롬프트

```
[역할]
Spring Boot + MariaDB 기반 REST API 개발자.
DB: saffron (MariaDB), JPA 사용.
API prefix: /api/qbank

[구현 요청]
아래 엔드포인트를 구현해줘.
각 컨트롤러는 /api/qbank/admin/** 과 /api/qbank/exam/** 으로 분리.

1. POST /api/qbank/admin/exam-types          — 시험종류 등록
2. POST /api/qbank/admin/exam-subjects       — 시험대상 등록
3. POST /api/qbank/admin/papers              — 시험지 생성
4. POST /api/qbank/admin/papers/{id}/questions — 문항 등록 (multipart, 이미지 업로드 포함)
5. POST /api/qbank/admin/questions/{id}/choices — 보기 등록 (is_correct 포함)
6. GET  /api/qbank/exam/papers               — 응시자: 시험지 조회 (?typeId=&subjectId=)
7. POST /api/qbank/exam/sessions             — 응시 시작 (이름/사번, 문제+보기 반환, is_correct 제외)
8. POST /api/qbank/exam/sessions/{id}/submit — 답안 제출
9. POST /api/qbank/admin/sessions/{id}/grade — 채점 (자동채점 + 수동 주관식)

[DDL]
(위 DDL 섹션의 SQL 붙여넣기)

[조건]
- 이미지 업로드: multipart/form-data, 저장 경로 반환
- is_correct는 관리자 API 응답에만 포함, 응시자 API에서는 제외
- 자동채점: question_choice.is_correct 기준으로 answer_sheet.is_correct 일괄 업데이트
- exam_session.total_score = 정답 문항의 score 합산
```

### Claude에게 Frontend 지시 프롬프트

```
[역할]
React + TypeScript 프론트엔드 개발자.
API Base URL: http://localhost:8080/api/qbank
상태관리: React Query + useState
UI: Tailwind CSS

[관리자 화면 — /admin/*]
1. 시험종류/대상 CRUD 목록 페이지
2. 시험지 생성 폼 (종류 + 대상 드롭다운)
3. 문항 등록 폼:
   - 유형 선택 (단일/다중/주관식)
   - 질문 텍스트 + 이미지 업로드 (선택)
   - 보기 2~8개 동적 추가/삭제
   - 보기별 텍스트 or 이미지 업로드
   - 정답 체크박스 (관리자 전용)
4. 채점 화면: 세션 목록 → 답안지 조회 → 주관식 수동 채점

[응시자 화면 — /exam/*]
1. 이름 + 사번 입력 폼
2. 시험종류 / 시험대상 드롭다운 선택
3. 문제 렌더링:
   - 객관식(단일): 라디오버튼 + 이미지 보기 지원
   - 객관식(다중): 체크박스 + 이미지 보기 지원
   - 주관식: textarea
4. 제출 버튼 → 확인 모달 → POST /api/qbank/exam/sessions/{id}/submit

[공통 조건]
- 이미지 업로드 시 미리보기 기능 포함
- 관리자/응시자 라우트 완전 분리
- React Query로 서버 상태 관리
- 에러/로딩 상태 처리 필수
```

---

## 6. 개발 순서

```
Step 1. DB 생성
  └─ saffron DB에 DDL 실행 → 예제 데이터 INSERT

Step 2. Backend — 기능 단위로 순차 구현
  ├─ 엔티티 / Repository
  ├─ 시험종류 + 시험대상 CRUD
  ├─ 시험지 + 문항 + 보기 CRUD (이미지 업로드 포함)
  ├─ 응시 세션 + 답안 제출
  └─ 채점 로직 (자동 + 수동)

Step 3. Frontend
  ├─ 관리자 화면 (문항 등록 / 채점)
  ├─ 응시자 화면 (응시 / 제출)
  └─ 공통 컴포넌트 정리

Step 4. 통합 테스트
  └─ 관리자 출제 → 응시자 응시 → 채점 E2E 확인
```

> **각 Step을 Claude에게 넘길 때 DDL + 이전 Step 코드를 함께 붙여주면 일관성 있는 코드가 생성됩니다.**
