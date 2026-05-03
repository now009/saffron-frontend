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
