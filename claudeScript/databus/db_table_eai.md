# EAI DB 테이블 생성 및 테스트 데이터 (PostgreSQL)
> eai_* 테이블 DDL, 인덱스, 테스트 INSERT SQL

---

## 1. 테이블 생성 DDL

```sql
-- ============================================================
-- EAI 인터페이스 기본 정의 테이블
-- ============================================================
CREATE TABLE eai_interface_def (
    id                  BIGSERIAL       PRIMARY KEY,
    interface_id        VARCHAR(20)     NOT NULL UNIQUE,   -- IF-XXXX
    name                VARCHAR(200)    NOT NULL,
    source_system       VARCHAR(100)    NOT NULL,
    target_system       VARCHAR(100)    NOT NULL,
    adapter_type        VARCHAR(20)     NOT NULL           -- REST, SOAP, DB, FILE
                        CHECK (adapter_type IN ('REST','SOAP','DB','FILE')),
    direction           VARCHAR(20)     NOT NULL DEFAULT 'SEND'
                        CHECK (direction IN ('SEND','RECEIVE','BOTH')),
    is_parallel         BOOLEAN         NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    description         TEXT,
    tags                VARCHAR(500),
    created_by          VARCHAR(100),
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  eai_interface_def                 IS 'EAI 인터페이스 기본 정의';
COMMENT ON COLUMN eai_interface_def.interface_id    IS '인터페이스 고유 ID (IF-XXXX)';
COMMENT ON COLUMN eai_interface_def.adapter_type    IS '어댑터 유형: REST/SOAP/DB/FILE';
COMMENT ON COLUMN eai_interface_def.is_parallel     IS '병렬 전송 여부';

CREATE INDEX idx_eai_interface_def_active     ON eai_interface_def (is_active);
CREATE INDEX idx_eai_interface_def_adapter    ON eai_interface_def (adapter_type);
CREATE INDEX idx_eai_interface_def_source     ON eai_interface_def (source_system);

-- ============================================================
-- EAI 어댑터 설정 테이블
-- ============================================================
CREATE TABLE eai_adapter_config (
    id                  BIGSERIAL       PRIMARY KEY,
    interface_id        VARCHAR(20)     NOT NULL REFERENCES eai_interface_def(interface_id),
    adapter_type        VARCHAR(20)     NOT NULL,

    -- REST 전용
    url                 VARCHAR(500),
    http_method         VARCHAR(10),                        -- GET, POST, PUT, DELETE
    timeout_ms          INT             DEFAULT 5000,

    -- 인증 공통
    auth_type           VARCHAR(20)     DEFAULT 'NONE',    -- NONE, BEARER, API_KEY, BASIC
    auth_value          VARCHAR(1000),                     -- AES-256 암호화 저장

    -- REST 헤더 (JSON 배열)
    request_headers     TEXT,                              -- [{"key":"X-Custom","value":"v1"}]

    -- DB 전용
    datasource_id       VARCHAR(50),
    statement_id        VARCHAR(200),
    operation_type      VARCHAR(20),                       -- QUERY, INSERT, UPDATE, PROCEDURE

    -- FILE 전용
    remote_host         VARCHAR(200),
    remote_port         INT             DEFAULT 22,
    remote_user         VARCHAR(100),
    remote_password     VARCHAR(500),                      -- 암호화 저장
    remote_path         VARCHAR(500),
    done_path           VARCHAR(500),
    file_pattern        VARCHAR(200),                      -- {yyyyMMdd}.csv
    file_encoding       VARCHAR(20)     DEFAULT 'UTF-8',

    -- 공통
    extra_config        TEXT,                              -- 추가 설정 JSON
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE eai_adapter_config IS 'EAI 어댑터 엔드포인트 설정';
CREATE INDEX idx_eai_adapter_config_if ON eai_adapter_config (interface_id);

-- ============================================================
-- EAI 메시지 변환 매핑 규칙 테이블
-- ============================================================
CREATE TABLE eai_mapping_rule (
    id                  BIGSERIAL       PRIMARY KEY,
    interface_id        VARCHAR(20)     NOT NULL REFERENCES eai_interface_def(interface_id),
    source_path         VARCHAR(300)    NOT NULL,           -- $.order.orderId
    target_path         VARCHAR(300)    NOT NULL,           -- /Order/OrderNo
    transform_type      VARCHAR(30)     NOT NULL DEFAULT 'COPY'
                        CHECK (transform_type IN ('COPY','FORMAT','CODE_MAP','EXPRESSION')),
    transform_expr      VARCHAR(500),                      -- SpEL 표현식 또는 포맷 패턴
    default_value       VARCHAR(200),
    is_required         BOOLEAN         DEFAULT FALSE,
    sort_order          INT             NOT NULL DEFAULT 0,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE eai_mapping_rule IS 'EAI 메시지 필드 변환 매핑 규칙';
COMMENT ON COLUMN eai_mapping_rule.transform_expr IS 'EXPRESSION: SpEL, FORMAT: 날짜패턴, CODE_MAP: 그룹ID 참조';

CREATE INDEX idx_eai_mapping_rule_if ON eai_mapping_rule (interface_id, sort_order);

-- ============================================================
-- EAI 라우팅 규칙 테이블
-- ============================================================
CREATE TABLE eai_routing_rule (
    id                  BIGSERIAL       PRIMARY KEY,
    interface_id        VARCHAR(20)     NOT NULL REFERENCES eai_interface_def(interface_id),
    condition_expr      VARCHAR(500),                      -- SpEL: payload.status == 'NEW'
    target_adapter_id   BIGINT          REFERENCES eai_adapter_config(id),
    target_system       VARCHAR(100),
    is_parallel         BOOLEAN         DEFAULT FALSE,
    sort_order          INT             NOT NULL DEFAULT 0,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE eai_routing_rule IS 'EAI 조건 기반 라우팅 규칙';
CREATE INDEX idx_eai_routing_rule_if ON eai_routing_rule (interface_id);

-- ============================================================
-- EAI 메시지 처리 이력 테이블 (월별 파티셔닝 권장)
-- ============================================================
CREATE TABLE eai_message_history (
    id                  BIGSERIAL       PRIMARY KEY,
    message_id          VARCHAR(50)     NOT NULL UNIQUE,   -- UUID
    interface_id        VARCHAR(20)     NOT NULL,
    direction           VARCHAR(10)     NOT NULL,          -- SEND, RECEIVE
    source_system       VARCHAR(100),
    target_system       VARCHAR(100),
    status              VARCHAR(20)     NOT NULL           -- SUCCESS, FAIL, RETRY, DLQ
                        CHECK (status IN ('SUCCESS','FAIL','RETRY','DLQ')),
    request_body        TEXT,                              -- 암호화 저장 (민감데이터 포함 시)
    response_body       TEXT,
    error_message       TEXT,
    retry_count         INT             NOT NULL DEFAULT 0,
    processing_ms       BIGINT,
    kafka_partition     INT,
    kafka_offset        BIGINT,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    processed_at        TIMESTAMP
);

COMMENT ON TABLE eai_message_history IS 'EAI 메시지 송수신 처리 이력 (전체 원문 보관)';
COMMENT ON COLUMN eai_message_history.request_body  IS '송신 메시지 원문 (민감데이터 암호화)';
COMMENT ON COLUMN eai_message_history.response_body IS '수신 응답 원문';

CREATE INDEX idx_eai_msg_hist_if_created  ON eai_message_history (interface_id, created_at DESC);
CREATE INDEX idx_eai_msg_hist_status      ON eai_message_history (status, created_at DESC);
CREATE INDEX idx_eai_msg_hist_created     ON eai_message_history (created_at DESC);

-- ============================================================
-- EAI 배치 스케줄 테이블
-- ============================================================
CREATE TABLE eai_schedule (
    id                  BIGSERIAL       PRIMARY KEY,
    interface_id        VARCHAR(20)     NOT NULL REFERENCES eai_interface_def(interface_id),
    schedule_name       VARCHAR(200)    NOT NULL,
    cron_expr           VARCHAR(100)    NOT NULL,          -- 0 0/5 * * * ? (5분마다)
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    last_run_at         TIMESTAMP,
    last_run_status     VARCHAR(20),
    next_run_at         TIMESTAMP,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE eai_schedule IS 'EAI Pull 배치 스케줄 설정';
CREATE INDEX idx_eai_schedule_active ON eai_schedule (is_active, next_run_at);

-- ============================================================
-- EAI 코드 변환 그룹 테이블
-- ============================================================
CREATE TABLE eai_code_group (
    id                  BIGSERIAL       PRIMARY KEY,
    group_id            VARCHAR(50)     NOT NULL UNIQUE,
    group_name          VARCHAR(200)    NOT NULL,
    description         TEXT,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EAI 코드 변환 매핑 테이블
-- ============================================================
CREATE TABLE eai_code_map (
    id                  BIGSERIAL       PRIMARY KEY,
    group_id            VARCHAR(50)     NOT NULL REFERENCES eai_code_group(group_id),
    source_code         VARCHAR(100)    NOT NULL,
    target_code         VARCHAR(100)    NOT NULL,
    description         VARCHAR(200),
    sort_order          INT             DEFAULT 0,
    UNIQUE (group_id, source_code)
);

COMMENT ON TABLE eai_code_map IS 'EAI 코드 변환 매핑 (소스코드 ↔ 타깃코드)';

-- ============================================================
-- EAI 설정 변경 감사 로그 테이블
-- ============================================================
CREATE TABLE eai_audit_log (
    id                  BIGSERIAL       PRIMARY KEY,
    entity_type         VARCHAR(50)     NOT NULL,           -- INTERFACE, ADAPTER, MAPPING
    entity_id           VARCHAR(50)     NOT NULL,
    action              VARCHAR(20)     NOT NULL,           -- CREATE, UPDATE, DELETE, TOGGLE
    before_value        TEXT,
    after_value         TEXT,
    changed_by          VARCHAR(100),
    changed_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    ip_address          VARCHAR(50),
    user_agent          VARCHAR(500)
);

COMMENT ON TABLE eai_audit_log IS 'EAI 설정 변경 감사 로그';
CREATE INDEX idx_eai_audit_entity ON eai_audit_log (entity_type, entity_id, changed_at DESC);
CREATE INDEX idx_eai_audit_changed ON eai_audit_log (changed_at DESC);
```

---

## 2. 테스트 데이터 INSERT

```sql
-- ============================================================
-- 테스트 인터페이스 등록
-- ============================================================
INSERT INTO eai_interface_def (interface_id, name, source_system, target_system, adapter_type, direction, is_active, description)
VALUES
  ('IF-0041', '주문 ERP 연동',       'OMS',   'ERP-SAP',   'REST', 'SEND', TRUE,  'OMS 주문 생성 시 ERP로 실시간 전송'),
  ('IF-0038', '재고 현황 동기화',    'ERP',   'WMS',       'DB',   'SEND', TRUE,  '야간 배치로 ERP 재고 → WMS 동기화'),
  ('IF-0027', '고객 정보 연동',      'CRM',   'ERP-Oracle','SOAP', 'SEND', TRUE,  'CRM 고객 정보 변경 시 ERP 동기화'),
  ('IF-0019', '일일 매출 집계',      'POS',   'DW',        'FILE', 'SEND', TRUE,  '오전 3시 POS 매출 파일 DW 적재'),
  ('IF-0015', '인사 발령 알림',      'HRM',   '그룹웨어',  'REST', 'SEND', FALSE, '인사 발령 시 그룹웨어 알림 (현재 비활성)'),
  ('IF-0010', '물류 배송 상태 수신', '물류WMS','OMS',      'REST', 'RECEIVE', TRUE, '물류사에서 배송 상태 Push 수신');

-- ============================================================
-- 어댑터 설정 등록
-- ============================================================
INSERT INTO eai_adapter_config (interface_id, adapter_type, url, http_method, timeout_ms, auth_type, auth_value)
VALUES
  ('IF-0041', 'REST', 'https://erp-dev.example.com/api/v1/orders', 'POST', 5000, 'BEARER', 'ENCRYPTED:eyJhbGc...'),
  ('IF-0015', 'REST', 'https://groupware.example.com/api/notify', 'POST', 3000, 'API_KEY', 'ENCRYPTED:xxxxxxxxxxx');

INSERT INTO eai_adapter_config (interface_id, adapter_type, datasource_id, statement_id, operation_type)
VALUES
  ('IF-0038', 'DB', 'DS_ERP', 'eai.erp.selectStockList', 'QUERY'),
  ('IF-0027', 'SOAP', NULL, NULL, NULL);

INSERT INTO eai_adapter_config (interface_id, adapter_type, remote_host, remote_port, remote_user, remote_path, file_pattern)
VALUES
  ('IF-0019', 'FILE', 'ftp.pos-system.example.com', 22, 'eai_user', '/upload/sales', 'sales_{yyyyMMdd}.csv');

-- ============================================================
-- 매핑 규칙 등록
-- ============================================================
INSERT INTO eai_mapping_rule (interface_id, source_path, target_path, transform_type, sort_order)
VALUES
  ('IF-0041', '$.orderId',           '/Order/OrderNo',       'COPY',       1),
  ('IF-0041', '$.orderDate',         '/Order/OrderDate',     'FORMAT',     2),
  ('IF-0041', '$.customerId',        '/Order/CustomerCode',  'COPY',       3),
  ('IF-0041', '$.totalAmount',       '/Order/TotalAmt',      'EXPRESSION', 4),
  ('IF-0041', '$.status',            '/Order/StatusCode',    'CODE_MAP',   5),
  ('IF-0038', '$.stockCode',         '/Stock/ItemCode',      'COPY',       1),
  ('IF-0038', '$.warehouseId',       '/Stock/WarehouseId',   'COPY',       2),
  ('IF-0038', '$.quantity',          '/Stock/Qty',           'COPY',       3);

-- ============================================================
-- 스케줄 등록
-- ============================================================
INSERT INTO eai_schedule (interface_id, schedule_name, cron_expr, is_active)
VALUES
  ('IF-0038', '재고 동기화 5분 배치',   '0 0/5 * * * ?', TRUE),
  ('IF-0019', '일일 매출 오전 3시 배치', '0 0 3 * * ?',   TRUE);

-- ============================================================
-- 코드 변환 그룹/매핑 등록
-- ============================================================
INSERT INTO eai_code_group (group_id, group_name) VALUES
  ('ORDER_STATUS', '주문 상태 코드'),
  ('PAYMENT_TYPE', '결제 수단 코드');

INSERT INTO eai_code_map (group_id, source_code, target_code, description, sort_order) VALUES
  ('ORDER_STATUS', 'NEW',       '10', '신규 주문',     1),
  ('ORDER_STATUS', 'CONFIRM',   '20', '주문 확정',     2),
  ('ORDER_STATUS', 'SHIP',      '30', '배송 중',       3),
  ('ORDER_STATUS', 'DELIVER',   '40', '배송 완료',     4),
  ('ORDER_STATUS', 'CANCEL',    '90', '취소',          5),
  ('PAYMENT_TYPE', 'CARD',      'C',  '신용카드',      1),
  ('PAYMENT_TYPE', 'CASH',      'K',  '현금',          2),
  ('PAYMENT_TYPE', 'TRANSFER',  'T',  '계좌이체',      3);

-- ============================================================
-- 테스트 메시지 이력 INSERT
-- ============================================================
INSERT INTO eai_message_history (
  message_id, interface_id, direction, source_system, target_system,
  status, request_body, response_body, processing_ms, created_at, processed_at
) VALUES
  (
    gen_random_uuid()::text, 'IF-0041', 'SEND', 'OMS', 'ERP-SAP',
    'SUCCESS',
    '{"orderId":"ORD-20240101-001","customerId":"CUST-001","totalAmount":150000,"status":"NEW"}',
    '{"result":"OK","erpOrderId":"ERP-2024-0001"}',
    234,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours' + INTERVAL '234 milliseconds'
  ),
  (
    gen_random_uuid()::text, 'IF-0041', 'SEND', 'OMS', 'ERP-SAP',
    'FAIL',
    '{"orderId":"ORD-20240101-002","customerId":"CUST-002","totalAmount":80000,"status":"NEW"}',
    NULL,
    5001,
    NOW() - INTERVAL '1 hour',
    NULL
  ),
  (
    gen_random_uuid()::text, 'IF-0038', 'SEND', 'ERP', 'WMS',
    'SUCCESS',
    '{"stockCode":"ITEM-001","warehouseId":"WH-01","quantity":100}',
    '{"updated":1}',
    45,
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '30 minutes' + INTERVAL '45 milliseconds'
  ),
  (
    gen_random_uuid()::text, 'IF-0041', 'SEND', 'OMS', 'ERP-SAP',
    'DLQ',
    '{"orderId":"ORD-20240101-003","customerId":"INVALID","totalAmount":-100}',
    NULL,
    12,
    NOW() - INTERVAL '15 minutes',
    NULL
  );
```

---

## 3. 조회 검증 SQL

```sql
-- 인터페이스별 오늘 처리 건수 집계
SELECT
    d.interface_id,
    d.name,
    d.source_system,
    d.target_system,
    d.adapter_type,
    d.is_active,
    COUNT(h.id)                                         AS today_total,
    COUNT(h.id) FILTER (WHERE h.status = 'SUCCESS')    AS success_count,
    COUNT(h.id) FILTER (WHERE h.status = 'FAIL')       AS fail_count,
    COUNT(h.id) FILTER (WHERE h.status = 'DLQ')        AS dlq_count,
    ROUND(
      COUNT(h.id) FILTER (WHERE h.status = 'SUCCESS')::numeric
      / NULLIF(COUNT(h.id), 0) * 100, 1
    )                                                   AS success_rate_pct,
    ROUND(AVG(h.processing_ms)::numeric, 0)            AS avg_processing_ms,
    MAX(h.created_at)                                  AS last_run_at
FROM eai_interface_def d
LEFT JOIN eai_message_history h
    ON h.interface_id = d.interface_id
    AND h.created_at >= CURRENT_DATE
GROUP BY d.id, d.interface_id, d.name, d.source_system, d.target_system, d.adapter_type, d.is_active
ORDER BY today_total DESC;

-- 상태별 이력 조회 (최근 100건)
SELECT
    message_id,
    interface_id,
    direction,
    status,
    source_system,
    target_system,
    processing_ms,
    created_at,
    error_message
FROM eai_message_history
ORDER BY created_at DESC
LIMIT 100;

-- DLQ 미처리 목록
SELECT
    h.id,
    h.message_id,
    h.interface_id,
    d.name          AS interface_name,
    h.status,
    h.error_message,
    h.retry_count,
    h.created_at
FROM eai_message_history h
JOIN eai_interface_def d ON d.interface_id = h.interface_id
WHERE h.status IN ('FAIL', 'DLQ')
ORDER BY h.created_at DESC;

-- 시간별 처리량 추이 (최근 24시간)
SELECT
    DATE_TRUNC('hour', created_at) AS hour,
    COUNT(*)                       AS total_count,
    COUNT(*) FILTER (WHERE status = 'SUCCESS') AS success_count,
    COUNT(*) FILTER (WHERE status = 'FAIL')    AS fail_count,
    ROUND(AVG(processing_ms)::numeric, 0)      AS avg_ms
FROM eai_message_history
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY 1
ORDER BY 1;

-- 인터페이스별 어댑터 설정 조회
SELECT
    d.interface_id,
    d.name,
    d.adapter_type,
    a.url,
    a.http_method,
    a.timeout_ms,
    a.auth_type,
    a.datasource_id,
    a.statement_id,
    a.remote_host,
    a.file_pattern
FROM eai_interface_def d
LEFT JOIN eai_adapter_config a ON a.interface_id = d.interface_id
ORDER BY d.interface_id;

-- 스케줄 현황 조회
SELECT
    s.interface_id,
    d.name              AS interface_name,
    s.schedule_name,
    s.cron_expr,
    s.is_active,
    s.last_run_at,
    s.last_run_status,
    s.next_run_at
FROM eai_schedule s
JOIN eai_interface_def d ON d.interface_id = s.interface_id
ORDER BY s.next_run_at;
```

---

## 4. 인덱스 및 파티셔닝 (운영 환경 권장)

```sql
-- 메시지 이력 테이블 월별 파티셔닝 (데이터 적재 후 빠른 삭제·아카이브 지원)
-- PostgreSQL 11 이상의 Range Partition 사용

CREATE TABLE eai_message_history_partitioned (
    LIKE eai_message_history INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- 월별 파티션 생성 예시 (자동화 스크립트로 매월 생성 권장)
CREATE TABLE eai_message_history_2025_01
    PARTITION OF eai_message_history_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE eai_message_history_2025_02
    PARTITION OF eai_message_history_partitioned
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- 오래된 파티션 삭제 (30일 이상 보관 정책 시)
-- DROP TABLE eai_message_history_2024_12;

-- 통계 업데이트 (정기 실행 권장)
ANALYZE eai_message_history;
ANALYZE eai_interface_def;
```
