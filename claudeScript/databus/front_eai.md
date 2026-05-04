# Frontend EAI 개발 요청 스크립트 (VS Code)
> 기존 포탈(사용자/메뉴 관리) 위에 EAI 관리 기능을 추가 개발하는 요청입니다.

---

## 전제 조건 (VS Code에 전달할 컨텍스트)

```
현재 프로젝트는 React 18 + TypeScript 기반 포탈 SPA입니다.
사용자 관리, 메뉴 관리 등 공통 포탈 기능은 이미 개발되어 있습니다.
기존 라우터, 레이아웃, 공통 컴포넌트, API 클라이언트 구조를 그대로 활용하여
EAI 관련 페이지와 컴포넌트를 추가해 주세요.
```

---

## 요청 1 — 디렉토리 구조 추가

```
기존 src/ 디렉토리 아래에 아래 구조를 추가해 주세요.

src/
├── /eai/pages/
│   ├── Dashboard.tsx          # EAI 실시간 모니터링 대시보드
│   ├── InterfaceList.tsx      # 인터페이스 목록 조회
│   ├── InterfaceForm.tsx      # 인터페이스 등록/수정 4단계 위저드
│   ├── InterfaceDetail.tsx    # 인터페이스 상세 + 어댑터 설정 보기
│   ├── MessageHistory.tsx     # 메시지 송수신 이력 조회 + 재처리
│   ├── FlowDesigner.tsx       # 워크플로우 흐름도 편집기 (React Flow)
│   ├── ScheduleList.tsx       # 배치 스케줄 목록 + Cron 설정
│   └── Monitoring.tsx         # Kafka Lag, SLA, TPS 모니터링 차트
├── /eai/components/
│   ├── AdapterConfigForm.tsx  # 어댑터 설정 입력 폼 (REST/SOAP/DB/FILE 탭)
│   ├── MappingRuleEditor.tsx  # 소스→타깃 필드 매핑 테이블 편집기
│   ├── MessageViewer.tsx      # JSON/XML 메시지 원문 뷰어 (접기/펼치기)
│   ├── StatusBadge.tsx        # 운영/경고/오류/비활성 상태 뱃지
│   ├── KpiCard.tsx            # 처리건수/성공률/응답시간 KPI 카드
│   └── PartitionChart.tsx     # Kafka 파티션별 처리량 차트
├── /eai/hooks/
│   ├── useEaiDashboard.ts     # 대시보드 실시간 SSE 구독 훅
│   ├── useInterfaceList.ts    # 인터페이스 목록 조회/필터링 훅
│   └── useMessageHistory.ts   # 메시지 이력 조회 + 페이징 훅
├── /eai/api/
│   ├── interfaceApi.ts        # 인터페이스 CRUD API 호출 함수
│   ├── messageApi.ts          # 메시지 이력 조회/재처리 API
│   ├── monitoringApi.ts       # 모니터링 지표 조회 API
│   └── scheduleApi.ts         # 스케줄 조회/실행 API
└── /eai/types/
    └── eai.types.ts           # EAI 관련 TypeScript 타입 정의
```

---

## 요청 2 — 라우터 추가

```typescript
// 기존 router/index.tsx (또는 App.tsx)에 아래 라우트를 추가해 주세요.
// 기존 포탈 레이아웃(GNB, 사이드바)을 그대로 사용합니다.

{
  path: '/eai',
  element: <PortalLayout />,          // 기존 레이아웃 컴포넌트 사용
  children: [
    { index: true,              element: <EaiDashboard /> },
    { path: 'interfaces',       element: <InterfaceList /> },
    { path: 'interfaces/new',   element: <InterfaceForm /> },
    { path: 'interfaces/:id',   element: <InterfaceDetail /> },
    { path: 'interfaces/:id/edit', element: <InterfaceForm /> },
    { path: 'history',          element: <MessageHistory /> },
    { path: 'flow-designer',    element: <FlowDesigner /> },
    { path: 'schedules',        element: <ScheduleList /> },
    { path: 'monitoring',       element: <Monitoring /> },
  ]
}
```

---

## 요청 3 — 타입 정의 (eai.types.ts)

```typescript
아래의 내용을 현재의 프로젝트 구조에 맞춰 생성해줘
// src/eai/types/eai.types.ts 파일을 아래 내용으로 생성해 주세요.

export type AdapterType = 'REST' | 'SOAP' | 'DB' | 'FILE';
export type InterfaceStatus = 'ACTIVE' | 'WARNING' | 'ERROR' | 'INACTIVE';
export type Direction = 'SEND' | 'RECEIVE';
export type MessageStatus = 'SUCCESS' | 'FAIL' | 'RETRY' | 'DLQ';

export interface InterfaceDef {
  id: number;
  interfaceId: string;       // IF-XXXX
  name: string;
  sourceSystem: string;
  targetSystem: string;
  adapterType: AdapterType;
  status: InterfaceStatus;
  isActive: boolean;
  todayCount: number;
  lastRunAt: string | null;
  createdAt: string;
}

export interface AdapterConfig {
  id: number;
  interfaceId: string;
  adapterType: AdapterType;
  // REST
  url?: string;
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  timeoutMs?: number;
  authType?: 'NONE' | 'BEARER' | 'API_KEY' | 'BASIC';
  authValue?: string;
  // DB
  datasourceId?: string;
  statementId?: string;
  operationType?: 'QUERY' | 'INSERT' | 'UPDATE' | 'PROCEDURE';
  // FILE
  remoteHost?: string;
  remotePath?: string;
  filePattern?: string;
}

export interface MessageHistory {
  id: number;
  interfaceId: string;
  direction: Direction;
  sourceSystem: string;
  targetSystem: string;
  status: MessageStatus;
  requestBody: string;
  responseBody: string;
  errorMessage?: string;
  processingMs: number;
  createdAt: string;
  processedAt: string | null;
}

export interface MappingRule {
  id: number;
  interfaceId: string;
  sourcePath: string;   // $.order.orderId
  targetPath: string;   // /Order/OrderNo
  transformType: 'COPY' | 'FORMAT' | 'CODE_MAP' | 'EXPRESSION';
  transformExpr?: string;
  sortOrder: number;
}

export interface DashboardSnapshot {
  todayCount: number;
  successRate: number;
  avgResponseMs: number;
  activeInterfaceCount: number;
  kafkaConsumerLag: number;
  dlqCount: number;
  errorBreakdown: { type: string; count: number }[];
  hourlyTrend: { hour: string; count: number }[];
}
```

---

## 요청 4 — API 호출 함수 (interfaceApi.ts)

```typescript
// src/eai/api/interfaceApi.ts
// 기존 프로젝트의 axios 인스턴스(apiClient)를 import해서 사용해 주세요.

import { apiClient } from '@/api/apiClient'; // 기존 공통 axios 인스턴스
import type { InterfaceDef, AdapterConfig, MappingRule } from '@/eai/types//eai.types';

// 인터페이스 목록 조회
export const getInterfaceList = (params?: {
  status?: string;
  adapterType?: string;
  keyword?: string;
  page?: number;
  size?: number;
}) => apiClient.get<{ content: InterfaceDef[]; totalElements: number }>('/eai/api/interfaces', { params });

// 인터페이스 단건 조회
export const getInterface = (id: number) =>
  apiClient.get<InterfaceDef>(`/eai/api/interfaces/${id}`);

// 인터페이스 등록
export const createInterface = (data: Partial<InterfaceDef>) =>
  apiClient.post<InterfaceDef>('/eai/api/interfaces', data);

// 인터페이스 수정
export const updateInterface = (id: number, data: Partial<InterfaceDef>) =>
  apiClient.put<InterfaceDef>(`/eai/api/interfaces/${id}`, data);

// 인터페이스 활성/비활성 토글
export const toggleInterface = (id: number, isActive: boolean) =>
  apiClient.patch(`/eai/api/interfaces/${id}/toggle`, { isActive });

// 어댑터 설정 조회
export const getAdapterConfig = (interfaceId: string) =>
  apiClient.get<AdapterConfig>(`/eai/api/adapters/${interfaceId}`);

// 어댑터 설정 저장
export const saveAdapterConfig = (data: AdapterConfig) =>
  apiClient.post<AdapterConfig>('/eai/api/adapters', data);

// 매핑 규칙 조회
export const getMappingRules = (interfaceId: string) =>
  apiClient.get<MappingRule[]>(`/eai/api/mappings/${interfaceId}`);

// 매핑 규칙 저장 (일괄)
export const saveMappingRules = (interfaceId: string, rules: MappingRule[]) =>
  apiClient.post(`/eai/api/mappings/${interfaceId}`, rules);

// 테스트 전송
export const testSend = (interfaceId: string, payload: string) =>
  apiClient.post(`/eai/api/interfaces/${interfaceId}/test`, { payload });
```

---

## 요청 5 — 대시보드 컴포넌트 (Dashboard.tsx)

```typescript
// src/eai/pages/Dashboard.tsx
// 실시간 SSE로 KPI를 갱신하고 Recharts로 시간별 처리량 차트를 표시해 주세요.

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { KpiCard } from '@/components/eai/KpiCard';
import type { DashboardSnapshot } from '@/eai/types//eai.types';

export const EaiDashboard: React.FC = () => {
  const [snap, setSnap] = useState<DashboardSnapshot | null>(null);

  // SSE 실시간 구독 (5초 간격 서버 푸시)
  useEffect(() => {
    const es = new EventSource('/eai/api/monitoring/stream');
    es.onmessage = (e) => setSnap(JSON.parse(e.data));
    return () => es.close();
  }, []);

  if (!snap) return <div>로딩 중...</div>;

  return (
    <div className="eai-dashboard">
      {/* KPI 카드 4개 */}
      <div className="kpi-grid">
        <KpiCard label="오늘 처리 건수" value={snap.todayCount.toLocaleString()} />
        <KpiCard label="성공률" value={`${snap.successRate.toFixed(1)}%`} />
        <KpiCard label="평균 응답시간" value={`${snap.avgResponseMs}ms`} />
        <KpiCard label="활성 인터페이스" value={String(snap.activeInterfaceCount)} />
      </div>

      {/* 시간별 처리량 차트 */}
      <div className="chart-section">
        <h3>시간별 처리량</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={snap.hourlyTrend}>
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#1C7293" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Kafka Lag / DLQ 경고 */}
      {snap.kafkaConsumerLag > 1000 && (
        <div className="alert alert-warning">
          Kafka Consumer Lag: {snap.kafkaConsumerLag.toLocaleString()}건 — 처리 지연 발생
        </div>
      )}
      {snap.dlqCount > 100 && (
        <div className="alert alert-danger">
          DLQ 잔여 {snap.dlqCount}건 — 수동 재처리 필요
        </div>
      )}
    </div>
  );
};
```

---

## 요청 6 — 인터페이스 등록 위저드 (InterfaceForm.tsx)

```typescript
// src/eai/pages/InterfaceForm.tsx
// 4단계 위저드(기본정보 → 어댑터 설정 → 매핑 설정 → 검토·테스트)로 구현해 주세요.
// React Hook Form + Zod로 각 단계 유효성 검사를 수행합니다.

// Step 1: 기본 정보
// - 인터페이스명, 송신시스템, 수신시스템, 설명, 어댑터 타입 선택(REST/SOAP/DB/FILE)

// Step 2: 어댑터 설정 (AdapterConfigForm 컴포넌트 사용)
// - 선택된 어댑터 타입에 따라 동적으로 폼 필드 변경
// - REST: URL, HTTP Method, 타임아웃, 인증방식, 토큰
// - DB: DataSource ID, Statement ID, 작업유형
// - FILE: SFTP Host/Port/계정, 원격경로, 파일패턴

// Step 3: 메시지 변환 매핑 (MappingRuleEditor 컴포넌트 사용)
// - 소스 필드 경로 → 타깃 필드 경로 매핑 테이블
// - 변환 유형: COPY / FORMAT / CODE_MAP / EXPRESSION
// - 행 추가/삭제/순서변경 기능

// Step 4: 검토 및 테스트
// - 설정 요약 표시
// - 테스트 메시지 JSON 입력 후 테스트 전송 버튼
// - 응답 결과 표시 (성공/실패)
// - 저장 버튼
```

---

## 요청 7 — 메시지 이력 조회 (MessageHistory.tsx)

```typescript
// src/eai/pages/MessageHistory.tsx
// 검색 필터 + 테이블 + 상세 모달로 구성해 주세요.

// 검색 필터:
// - 인터페이스ID (선택), 상태(SUCCESS/FAIL/DLQ), 날짜 범위, 키워드

// 테이블 컬럼:
// - 메시지ID, 인터페이스ID, 송신, 수신, 상태(StatusBadge), 처리시간(ms), 수신일시

// 행 클릭 → 상세 모달:
// - 요청 메시지 원문 (MessageViewer - JSON/XML 토글)
// - 응답 메시지 원문
// - 처리 타임라인 (수신→변환→전송→완료 각 소요시간)
// - 오류 메시지 (실패 시)
// - [재처리] 버튼 (status가 FAIL/DLQ인 경우만 표시)
//   → 클릭 시 확인 다이얼로그 후 POST /eai/api/messages/{id}/retry
```

---

## 요청 8 — 의존성 패키지 설치

```bash
# 아래 패키지를 package.json에 추가하고 설치해 주세요.

npm install reactflow recharts @tanstack/react-query react-hook-form zod @hookform/resolvers

# reactflow   : 워크플로우 흐름도 편집기
# recharts    : 처리량/SLA 차트
# react-query : 서버 상태 관리 + 실시간 폴링
# react-hook-form + zod : 인터페이스 등록 폼 유효성 검사
```

---

## 요청 9 — 사이드바 메뉴 추가

```typescript
// 기존 사이드바 메뉴 설정 파일(예: menuConfig.ts 또는 SidebarMenu.tsx)에
// 아래 EAI 메뉴 그룹을 추가해 주세요.
// 기존 메뉴 구조와 동일한 형식을 사용합니다.

{
  groupLabel: 'EAI 관리',
  icon: 'NetworkIcon',    // 기존 프로젝트 아이콘 라이브러리 사용
  children: [
    { label: '대시보드',         path: '/eai',              icon: 'DashboardIcon' },
    { label: '인터페이스 관리',   path: '/eai/interfaces',   icon: 'LinkIcon' },
    { label: '메시지 이력',       path: '/eai/history',      icon: 'HistoryIcon' },
    { label: '워크플로우 설계',   path: '/eai/flow-designer',icon: 'FlowIcon' },
    { label: '모니터링',          path: '/eai/monitoring',   icon: 'MonitorIcon' },
    { label: '스케줄 관리',       path: '/eai/schedules',    icon: 'ScheduleIcon' },
  ]
}
```

---

## 요청 10 — 환경변수 추가

```bash
# .env.development 및 .env.production 파일에 아래 변수를 추가해 주세요.

VITE_EAI_API_BASE=/api/eai
VITE_EAI_SSE_URL=/eai/api/monitoring/stream
VITE_EAI_KAFKA_LAG_THRESHOLD=1000
VITE_EAI_DLQ_THRESHOLD=100
```


eai_db_adapter_def table을 삭제했어
- src/eai/pages/DbAdapter.jsx을 삭제하고 새로 생성한 아래의 Table 정보를 보고 
  4개의 메뉴별 화면을 생성해줘 

eai_db_adapter_def table을 삭제했고, 4개의 table을 추가했어 
1. eai_datasource;
2. eai_db_adapter_config;
3. table eai_rest_config;
4. table eai_soap_config;

- table정보 : C:\00.Saffron\saffron-api\src\main\resources\sql\eai_adapter_table.sql
- backend endpoint                                                                                         
  eai_datasource

  ┌────────┬───────────────────────┬──────────────────┐                                                                                                                                                                                                                          
  │ Method │          URL          │      Query       │                                                                                                                                                                                                                          
  ├────────┼───────────────────────┼──────────────────┤                                                                                                                                                                                                                          
  │ GET    │ /eai/datasources      │ dbType, isActive │                                                                                                                                                                                                                          
  ├────────┼───────────────────────┼──────────────────┤
  │ GET    │ /eai/datasources/{id} │                  │
  ├────────┼───────────────────────┼──────────────────┤
  │ POST   │ /eai/datasources      │                  │
  ├────────┼───────────────────────┼──────────────────┤
  │ PUT    │ /eai/datasources/{id} │                  │
  ├────────┼───────────────────────┼──────────────────┤
  │ DELETE │ /eai/datasources/{id} │                  │
  └────────┴───────────────────────┴──────────────────┘

  eai_db_adapter_config

  ┌────────┬──────────────────────────────┬───────────────────────────┐
  │ Method │             URL              │           Query           │
  ├────────┼──────────────────────────────┼───────────────────────────┤
  │ GET    │ /eai/db-adapter-configs      │ interfaceId, datasourceId │
  ├────────┼──────────────────────────────┼───────────────────────────┤
  │ GET    │ /eai/db-adapter-configs/{id} │                           │
  ├────────┼──────────────────────────────┼───────────────────────────┤
  │ POST   │ /eai/db-adapter-configs      │                           │
  ├────────┼──────────────────────────────┼───────────────────────────┤
  │ PUT    │ /eai/db-adapter-configs/{id} │                           │
  ├────────┼──────────────────────────────┼───────────────────────────┤
  │ DELETE │ /eai/db-adapter-configs/{id} │                           │
  └────────┴──────────────────────────────┴───────────────────────────┘

  eai_rest_config

  ┌────────┬────────────────────────┬─────────────┐
  │ Method │          URL           │    Query    │
  ├────────┼────────────────────────┼─────────────┤
  │ GET    │ /eai/rest-configs      │ interfaceId │
  ├────────┼────────────────────────┼─────────────┤
  │ GET    │ /eai/rest-configs/{id} │             │
  ├────────┼────────────────────────┼─────────────┤
  │ POST   │ /eai/rest-configs      │             │
  ├────────┼────────────────────────┼─────────────┤
  │ PUT    │ /eai/rest-configs/{id} │             │
  ├────────┼────────────────────────┼─────────────┤
  │ DELETE │ /eai/rest-configs/{id} │             │
  └────────┴────────────────────────┴─────────────┘

  eai_soap_config

  ┌────────┬────────────────────────┬─────────────┐
  │ Method │          URL           │    Query    │
  ├────────┼────────────────────────┼─────────────┤
  │ GET    │ /eai/soap-configs      │ interfaceId │
  ├────────┼────────────────────────┼─────────────┤
  │ GET    │ /eai/soap-configs/{id} │             │
  ├────────┼────────────────────────┼─────────────┤
  │ POST   │ /eai/soap-configs      │             │
  ├────────┼────────────────────────┼─────────────┤
  │ PUT    │ /eai/soap-configs/{id} │             │
  ├────────┼────────────────────────┼─────────────┤
  │ DELETE │ /eai/soap-configs/{id} │             │
  └────────┴────────────────────────┴─────────────┘

-------------------------------------------------------------
EAI 모듈 구조 - 2026-05-04
-------------------------------------------------------------
1. 전체 구조

src/eai/
├── eaiMain.jsx              랜딩 페이지(웰컴)
├── eai.css                  모듈 전용 스타일(155줄)
├── api/eaiApi.js            REST 호출 래퍼 (8개 도메인)
├── components/              재사용 UI 5종
│   ├── KpiCard.jsx          숫자 카드
│   ├── StatusBadge.jsx      상태 색상 배지
│   ├── MessageViewer.jsx    JSON/RAW 토글 뷰어
│   ├── AdapterConfigForm.jsx REST/SOAP/DB/FILE 동적 폼
│   └── MappingRuleEditor.jsx 행 단위 매핑 규칙 편집기
└── pages/
    ├── Dashboard.jsx        KPI + 차트(10초 폴링)
    ├── Monitoring.jsx       실시간 지표(5초 폴링, 30개 슬라이딩 윈도우)
    ├── InterfaceList.jsx    인터페이스 목록·필터·토글
    ├── InterfaceForm.jsx    4단계 위저드(등록/수정 공용)
    ├── InterfaceDetail.jsx  3탭 상세
    ├── MessageHistory.jsx   메시지 이력 + 모달 상세 + 재처리
    ├── ScheduleList.jsx     스케줄 목록·즉시실행·토글
    └── adapter/             어댑터 4종 CRUD
        ├── Datasource.jsx
        ├── DbAdapterConfig.jsx
        ├── RestConfig.jsx
        └── SoapConfig.jsx
2. 라우팅
PortalMain.jsx:131-142 에 13개 EAI 라우트가 등록되어 있고, 별도의 /eai 부모 레이아웃 없이 평면적으로 매핑됨. EAI 진입점은 /eai(=Dashboard).

3. API 계층 — eaiApi.js
도메인별로 그룹핑된 REST 클라이언트.

interface (목록/상세/생성/수정/토글/테스트)
adapter, mapping
message (목록/재처리)
monitoring.snapshot()
schedule (목록/즉시실행/토글)
datasource, dbAdapterConfig, restConfig, soapConfig — 표준 CRUD 5종 세트
엔드포인트 prefix가 두 종류로 나뉨에 주의:

/eai/api/... — 비즈니스 로직 (interface, adapter, mapping, message, monitoring, schedule)
/eai/... — 설정 마스터 (datasource, *-configs)
4. 핵심 화면 분석
Dashboard Dashboard.jsx — monitoring.snapshot() 으로 KPI 4종(처리건수/성공률/응답시간/활성수) + 시간별 LineChart + 오류 BarChart. Lag>1000, DLQ>100 시 경고 배너.

Monitoring Monitoring.jsx — 같은 snapshot API를 5초 주기로 호출, 클라이언트에서 30개 시점을 슬라이딩 윈도우로 보관해 실시간 추이 차트 생성. 임계치 따라 카드 배경색이 바뀜(warn/danger props).

InterfaceForm InterfaceForm.jsx — 4단계 위저드(기본정보 → 어댑터 → 매핑 → 검토/테스트). 저장 시 인터페이스/어댑터/매핑 3개 API를 순차 호출. 4단계에서 interface.test() 로 페이로드 시험전송.

MessageHistory MessageHistory.jsx — 행 클릭 시 모달로 요청/응답 본문 표시, FAIL/DLQ 상태에서만 재처리 버튼 노출.

Adapter CRUD 4종 — Datasource/DbAdapterConfig/RestConfig/SoapConfig 전부 동일 패턴(목록 + 필터 + 모달 폼 + ActionMenu 드롭다운). 코드 중복이 큼.

5. 잘된 점
폴링 cleanup이 정확. Dashboard·Monitoring 모두 setInterval 을 useEffect cleanup에서 해제 → 페이지 이탈 시 리소스 누수 없음.
Array.isArray 가드. 응답이 배열/페이징 양쪽 모두 가능하다는 전제로 data.content ?? [] 폴백 처리(목록 화면 전반).
상태별 색상이 CSS 클래스로 분리. .eai-status-badge.SUCCESS/FAIL/RETRY/DLQ/... 처럼 데이터 값과 클래스명을 동일하게 매칭 → JSX 단순화.
위저드 UI 일관성. wizard-steps 클래스를 InterfaceForm/InterfaceDetail/AdapterConfigForm 에서 재사용.
6. 개선 여지
사이드바 메뉴 미연결 — PortalLeft.jsx 에 /eai 경로가 한 건도 없음. 라우트는 다 있는데 메뉴 진입 동선이 없어서 직접 URL 입력해야 접근됨.
Adapter CRUD 4페이지 중복 — ActionMenu, SearchIcon, 모달/저장 로직이 거의 동일. 공용 <CrudGrid> 또는 hook(useCrudResource) 추출 시 ~600줄 절감 가능.
에러 처리 빈약 — .catch(() => {}) / .catch(() => setList([])) 패턴 다수. 사용자가 실패 사실을 모름. 토스트/배너 도입 필요.
InterfaceForm 저장 트랜잭션성 부재 — interface.update → adapter.save → mapping.save 직렬 호출에서 중간 실패 시 부분 저장 상태 발생. 백엔드 단일 엔드포인트로 묶거나 롤백 로직 필요.
alert/window.confirm 사용 — 모달이 이미 있는 프로젝트에서 네이티브 다이얼로그를 쓰고 있어 UX 톤이 깨짐.
스케줄 등록 화면 부재 — ScheduleList는 토글/즉시실행만 있고 등록·수정 폼이 없음(인터페이스 등록 시 자동 생성을 가정한 듯).
Dashboard의 successRate.toFixed(1) — successRate 가 null 이면 nullish 병합으로 0 처리되지만, 백엔드가 문자열이라도 보내면 런타임 에러. 타입 가드 한 줄 추가 권장.
번들 크기 — recharts 도입으로 main 청크가 601kB. Dashboard/Monitoring만 lazy import 하면 큰 효과.
7. 백엔드 의존 구조 추정
eaiApi.js 와 화면이 기대하는 응답 필드를 종합하면 백엔드는 다음 도메인을 노출해야 함:

Interface(id, interfaceId, name, sourceSystem, targetSystem, adapterType, status, isActive, todayCount, lastRunAt)
Adapter (interfaceId 기준 1:1 — REST/SOAP/DB/FILE 필드 다형)
MappingRule (sourcePath, targetPath, transformType, transformExpr, sortOrder)
Message (interfaceId, status, direction, processingMs, requestBody, responseBody, errorMessage)
MonitoringSnapshot (todayCount, successRate, avgResponseMs, activeInterfaceCount, kafkaConsumerLag, currentTps, dlqCount, hourlyTrend[], errorBreakdown[])
Schedule (cronExpression, lastRunAt, nextRunAt, lastStatus, isActive)


├── RestConfig.jsx
        └── SoapConfig.jsx 이 4개 페이지의 UI/UX에 대해 수정작업을 진행할거야
Show more
수정 방향을 듣기 전에 4개 파일을 모두 정확히 읽어두겠습니다.

Read c:\00.Saffron\saffron-frontend\src\eai\pages\adapter\DbAdapterConfig.jsx (from line 81)
Read c:\00.Saffron\saffron-frontend\src\eai\pages\adapter\RestConfig.jsx
Read c:\00.Saffron\saffron-frontend\src\eai\pages\adapter\SoapConfig.jsx
4개 파일 모두 다 읽었습니다. 현재 구조를 요약하면:

파일	폼 필드 수	모달 폭	좌/우 섹션 구성
Datasource	14개	880px	(기본정보) / (풀설정 + 추가설정)
DbAdapterConfig	8개	800px	(기본정보) / (추가설정)
RestConfig	25개	960px	(기본정보 + 인증) / (요청응답 + SSL/프록시 + 상태)
SoapConfig	20개	960px	(WSDL + 프로토콜) / (WS-Sec + 요청응답)
공통 패턴 (그래서 4파일 모두 동일):

ActionMenu 컴포넌트, SearchIcon 함수 — 4번 복붙
그리드 + 툴바 + 모달 레이아웃
eai-form-section h4 박스를 좌/우 두 컬럼으로 배치
활성화/SSL/롤백 같은 boolean 을 select(true/false)로 처리
alert / window.confirm 사용

-------------------------------------------------------
개선방향

시각 톤 정돈 — 모달 폼이 한쪽이 비어 보이는 페이지(특히 DbAdapterConfig)가 있고, 섹션 그루핑/간격이 들쭉날쭉합니다. CSS 주로 정렬·여백·폰트 통일.
인터랙션 개선 — alert/window.confirm 제거, boolean을 토글 스위치로, 비밀번호 필드에 표시/숨기기 토글, 폼 검증 메시지 등.
공통화 리팩토링 — ActionMenu/SearchIcon을 src/eai/components/ 로 추출. 4파일 중복 200줄 가량 감축.
전체 레이아웃 변경 — 예: 모달 대신 우측 슬라이드 패널, 또는 별도 라우트 페이지로 이동, 또는 그리드 우측에 인라인 상세 패널.

-------------------------------------------------------------

    └── adapter/             어댑터 4종 CRUD
        ├── Datasource.jsx
        ├── DbAdapterConfig.jsx
        ├── RestConfig.jsx
        └── SoapConfig.jsx

-- 필수체크 항목 및 UI/UX 수정사항       
1. Datasource.jsx
    - 기본정보, 풀설정 내용은 필수 체크
    - 기본정보 Box 아래에 [Connection Test] 버튼생성 
      ( 기본 스키마 )로 Query전송하여 연결여부 확인할것임
    - 풀설정 Box 연결 대기 타임아웃 , 쿼리 타임아웃(초) -> Label과 input box 사이 간격조절 , 현재 label 오른쪽글자가 잘려서 보임
     
2. DbAdapterConfig.jsx
    - 기본정보 필수 체크

3. RestConfig.jsx
    - 기본정보 , 인증설정 Box 필수 체크

4. SoapConfig.jsx
  -  WSDL / 서비스 연결  , SOAP 프로토콜 , WS-Security 인증 필수 체크
  
필수체크 label에 '*'로 필수항목임을 시각적으로 표현

위사항에 맞춰 UI 
