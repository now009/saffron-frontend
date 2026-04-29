# Web EAI 시스템 아키텍처 설계 가이드

> 중견기업 사내 시스템 대상 Web 기반 EAI 전체 개요

---

## 목차

1. [EAI / ETL / DataBus 개요](#1-eai--etl--databus-%EA%B0%9C%EC%9A%94)
2. [Web EAI 아키텍처 계층 구조](#2-web-eai-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98-%EA%B3%84%EC%B8%B5-%EA%B5%AC%EC%A1%B0)
3. [아키텍처 다이어그램](#3-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98-%EB%8B%A4%EC%9D%B4%EC%96%B4%EA%B7%B8%EB%9E%A8)
4. [주요 기능 목록](#4-%EC%A3%BC%EC%9A%94-%EA%B8%B0%EB%8A%A5-%EB%AA%A9%EB%A1%9D)
5. [권장 기술 스택](#5-%EA%B6%8C%EC%9E%A5-%EA%B8%B0%EC%88%A0-%EC%8A%A4%ED%83%9D)
6. [핵심 설계 원칙](#6-%ED%95%B5%EC%8B%AC-%EC%84%A4%EA%B3%84-%EC%9B%90%EC%B9%99)
7. [솔루션 비교](#7-%EC%86%94%EB%A3%A8%EC%85%98-%EB%B9%84%EA%B5%90)

---

## 1. EAI / ETL / DataBus 개요

### 1.1 EAI (Enterprise Application Integration)

기업 내 애플리케이션들을 통합·연계하는 미들웨어 솔루션입니다. 서로 다른 시스템(ERP, CRM, SCM 등)들이 데이터를 실시간으로 주고받을 수 있도록 **중앙 허브(Hub & Spoke)** 방식으로 연결합니다.

**주요 특징**

- 실시간 이벤트 기반 데이터 연계
- 비즈니스 프로세스 자동화 (워크플로우)
- 메시지 변환 및 라우팅
- 단일 통합 관리 포인트

```
[시스템A] ──┐
[시스템B] ──┤── [EAI Hub/Broker] ──┬── [시스템C]
[시스템D] ──┘                      └── [시스템E]
```

### 1.2 ETL (Extract, Transform, Load)

데이터를 추출·변환·적재하는 배치 중심 데이터 통합 솔루션입니다.

```
[Source DB/파일]
      │
      ▼
  Extract (추출)  →  Transform (변환)  →  Load (적재)
  SQL, API, 파일     정제/형식변환         DW, Data Lake
```

**주요 특징**

- 배치(Batch) 처리 중심 (야간 배치 등)
- 대용량 데이터 처리에 강점
- 데이터 품질 관리 및 이력 추적

### 1.3 Data Bus (메시지 버스)

Publisher가 메시지를 버스에 발행하면, Subscriber가 필요한 메시지를 가져가는 **Pub/Sub 패턴** 기반 아키텍처입니다.

```
[서비스A] → publish ──┐
[서비스B] → publish ──┤── [ Message Bus ] ──┬── subscribe → [서비스D]
[서비스C] → publish ──┘   (Kafka 등)        └── subscribe → [서비스E]
```

**주요 특징**

- 비동기 처리 → 시스템 간 의존도 최소화
- 높은 확장성 및 고가용성
- 이벤트 드리븐 아키텍처(EDA) 구현

---

## 3. 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────┐
│                        클라이언트 계층                            │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────┐ ┌──────────┐ │
│  │ Web Browser  │ │  Mobile App  │ │ API Client │ │  Admin   │ │
│  │ React/Vue SPA│ │ iOS/Android  │ │ 외부시스템  │ │ Console  │ │
│  └──────┬───────┘ └──────┬───────┘ └─────┬──────┘ └────┬─────┘ │
└─────────┼────────────────┼───────────────┼─────────────┼───────┘
          └────────────────┴───────────────┴─────────────┘
                                   │ HTTPS
┌──────────────────────────────────▼──────────────────────────────┐
│                         게이트웨이 계층                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                       API Gateway                         │  │
│  │    인증(JWT/OAuth2) · 라우팅 · Rate Limiting · SSL         │  │
│  └───────────────────────────────┬───────────────────────────┘  │
└──────────────────────────────────┼──────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────┐
│                         EAI Core Engine                          │
│  ┌──────────────┐ ┌────────────────┐ ┌────────────┐ ┌────────┐ │
│  │    Message   │→│    Workflow    │→│ Transform  │→│Schedul │ │
│  │    Broker    │ │    Engine      │ │   / Map    │ │  -er   │ │
│  │Kafka/RabbitMQ│ │ 프로세스 자동화│ │XML↔JSON변환│ │배치/이벤│ │
│  └──────────────┘ └────────────────┘ └────────────┘ └────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                          어댑터 계층                              │
│  ┌─────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐ │
│  │REST Adapter │ │SOAP Adapter│ │ DB Adapter │ │File Adapter │ │
│  │HTTP/OpenAPI │ │ WSDL/XML   │ │JDBC/MyBatis│ │FTP/SFTP/CSV │ │
│  └──────┬──────┘ └─────┬──────┘ └─────┬──────┘ └──────┬──────┘ │
└─────────┼──────────────┼──────────────┼────────────────┼────────┘
          │              │              │                │
┌─────────▼──────────────▼──────────────▼────────────────▼────────┐
│                       연계 대상 시스템                             │
│  ┌────────┐  ┌────────┐  ┌──────────┐  ┌────────┐  ┌─────────┐ │
│  │  ERP   │  │  CRM   │  │Legacy DB │  │그룹웨어│  │외부파트너│ │
│  │SAP/Orac│  │Salesfor│  │Oracle/MS │  │EHR/KMS │  │ EDI/B2B │ │
│  └────────┘  └────────┘  └──────────┘  └────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────────────┘

                    공통 인프라 (우측 수직 배치)
        ┌──────────┬──────────┬──────────┬──────────┐
        │ 모니터링  │ 로깅/감사 │  설정관리 │ 보안/암호화│
        └──────────┴──────────┴──────────┴──────────┘
```

---

## 4. 주요 기능 목록

기능 영역세부 기능**인터페이스 관리**인터페이스 등록/수정/삭제, 버전 관리, On/Off 제어**메시지 흐름**실시간 라우팅, 변환(XML↔JSON↔CSV), 필터링**워크플로우**조건 분기, 병렬 처리, 재시도 정책, 타임아웃 설정**모니터링**실시간 처리 현황, 오류 알람, 처리량/지연시간 대시보드**로그/감사**송수신 메시지 이력, 변경 감사 로그, 보관 정책**보안**데이터 암호화, IP 화이트리스트, 역할 기반 접근 제어(RBAC)**배치/스케줄**Cron 기반 스케줄링, 이벤트 트리거, 배치 모니터링

---

## 5. 권장 기술 스택

### 5.1 Backend

```
Spring Boot 3.x        → 핵심 엔진, 어댑터 서비스
Spring Integration     → 메시지 라우팅/변환 파이프라인
Apache Kafka           → 메시지 브로커 (비동기 처리)
Spring Batch           → 배치/스케줄 처리
MyBatis / JPA          → DB 연동
```

### 5.2 Frontend (Admin Console + 모니터링)

```
React 18 + TypeScript
React Flow             → 인터페이스 흐름도 시각화 (drag & drop)
Chart.js / Recharts    → 처리량/오류율 대시보드
React Query            → 실시간 데이터 폴링
Ant Design / MUI       → UI 컴포넌트 라이브러리
```

### 5.3 인프라

```
Docker + Kubernetes    → 컨테이너 배포, 무중단 업데이트
Redis                  → 세션, 캐싱, 분산 락
PostgreSQL             → 인터페이스 메타데이터, 이력 저장
Elasticsearch          → 메시지 로그 검색 (선택)
Nginx                  → API Gateway / Reverse Proxy
Prometheus + Grafana   → 모니터링 및 알람
```

### 5.4 인증/보안

```
Keycloak / Spring Security + JWT  → 사용자 인증
OAuth2 / API Key                  → 시스템 간 인증
TLS 1.3                           → 전송 구간 암호화
AES-256                           → 민감 데이터 암호화
```

### 5.5 기술 스택 요약표

영역기술버전용도Web FrameworkSpring Boot3.xREST API 서버메시지 브로커Apache Kafka3.x비동기 메시지 처리워크플로우Spring Integration6.x파이프라인 자동화배치 처리Spring Batch5.x대용량 배치프론트엔드React + TypeScript18.xSPA 관리 포털다이어그램React Flow11.x인터페이스 흐름도DBPostgreSQL15.x메타데이터/이력캐시Redis7.x세션/캐싱컨테이너Kubernetes1.28+배포/운영모니터링Prometheus + Grafana-운영 모니터링

---

## 6. 핵심 설계 원칙

### 6.1 느슨한 결합 (Loose Coupling)

어댑터 패턴으로 연계 시스템 변경 시 Core Engine 수정 없이 해당 어댑터만 교체합니다.

```java
// 어댑터 인터페이스 정의
public interface EaiAdapter {
    EaiMessage send(EaiMessage message);
    EaiMessage receive(String interfaceId);
}

// REST 어댑터 구현
@Component("restAdapter")
public class RestAdapter implements EaiAdapter {
    @Override
    public EaiMessage send(EaiMessage message) {
        // REST API 호출 로직
    }
}

// SOAP 어댑터 구현 (교체 시 이 클래스만 수정)
@Component("soapAdapter")
public class SoapAdapter implements EaiAdapter {
    @Override
    public EaiMessage send(EaiMessage message) {
        // SOAP 호출 로직
    }
}
```

### 6.2 이중화 / 고가용성

- Kafka 클러스터 (3 broker 이상)
- DB Primary / Replica 이중화
- Spring Boot 다중 인스턴스 + L4 로드밸런싱
- 단일 장애점(SPOF) 제거

### 6.3 이력 추적

모든 메시지 송수신을 DB에 기록하여 장애 재현 및 감사 대응이 가능하도록 합니다.

```sql
-- 메시지 이력 테이블 예시
CREATE TABLE eai_message_history (
    id              BIGSERIAL PRIMARY KEY,
    interface_id    VARCHAR(50)  NOT NULL,   -- 인터페이스 ID
    direction       VARCHAR(10)  NOT NULL,   -- SEND / RECEIVE
    source_system   VARCHAR(100),            -- 송신 시스템
    target_system   VARCHAR(100),            -- 수신 시스템
    message_body    TEXT,                    -- 메시지 원문 (암호화)
    status          VARCHAR(20),             -- SUCCESS / FAIL / RETRY
    created_at      TIMESTAMP DEFAULT NOW(),
    processed_at    TIMESTAMP
);
```

### 6.4 플러그인 어댑터 구조

신규 연계 시스템 추가 시 어댑터 클래스만 개발해 배포할 수 있는 확장 구조입니다.

```
신규 시스템 추가 시:
  1. EaiAdapter 인터페이스 구현
  2. @Component 등록
  3. 인터페이스 메타데이터 DB 등록
  4. Core Engine 코드 변경 없음 ✅
```

### 6.5 재시도 / 오류 처리 전략

오류 유형처리 전략네트워크 오류지수 백오프 재시도 (최대 3회)타임아웃재시도 후 Dead Letter Queue 이동변환 오류즉시 실패 처리 + 알람 발송중복 메시지멱등성 키(Idempotency Key)로 중복 제거

---
