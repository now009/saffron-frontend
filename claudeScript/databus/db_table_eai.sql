-- ============================================================
-- EAI DB 테이블 생성 및 테스트 데이터 (MariaDB 10.5+)
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. EAI 인터페이스 기본 정의 테이블
-- ============================================================
CREATE TABLE eai_interface_def (
    id                  BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    interface_id        VARCHAR(20)     NOT NULL UNIQUE          COMMENT '인터페이스 고유 ID (IF-XXXX)',
    name                VARCHAR(200)    NOT NULL,
    source_system       VARCHAR(100)    NOT NULL,
    target_system       VARCHAR(100)    NOT NULL,
    adapter_type        VARCHAR(20)     NOT NULL                 COMMENT '어댑터 유형: REST/SOAP/DB/FILE',
    direction           VARCHAR(20)     NOT NULL DEFAULT 'SEND',
    is_parallel         BOOLEAN         NOT NULL DEFAULT FALSE   COMMENT '병렬 전송 여부',
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    description         TEXT,
    tags                VARCHAR(500),
    created_by          VARCHAR(100),
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_eai_interface_def_adapter_type CHECK (adapter_type IN ('REST','SOAP','DB','FILE')),
    CONSTRAINT chk_eai_interface_def_direction    CHECK (direction    IN ('SEND','RECEIVE','BOTH'))
) COMMENT='EAI 인터페이스 기본 정의';

CREATE INDEX idx_eai_interface_def_active  ON eai_interface_def (is_active);
CREATE INDEX idx_eai_interface_def_adapter ON eai_interface_def (adapter_type);
CREATE INDEX idx_eai_interface_def_source  ON eai_interface_def (source_system);

-- ============================================================
-- 2. EAI 어댑터 설정 테이블
-- ============================================================
CREATE TABLE eai_adapter_config (
    id                  BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    interface_id        VARCHAR(20)     NOT NULL,
    adapter_type        VARCHAR(20)     NOT NULL,

    url                 VARCHAR(500),
    http_method         VARCHAR(10)                             COMMENT 'GET, POST, PUT, DELETE',
    timeout_ms          INT             DEFAULT 5000,

    auth_type           VARCHAR(20)     DEFAULT 'NONE'          COMMENT 'NONE, BEARER, API_KEY, BASIC',
    auth_value          VARCHAR(1000)                           COMMENT 'AES-256 암호화 저장',

    request_headers     TEXT                                    COMMENT '[{"key":"X-Custom","value":"v1"}]',

    datasource_id       VARCHAR(50),
    statement_id        VARCHAR(200),
    operation_type      VARCHAR(20)                             COMMENT 'QUERY, INSERT, UPDATE, PROCEDURE',

    remote_host         VARCHAR(200),
    remote_port         INT             DEFAULT 22,
    remote_user         VARCHAR(100),
    remote_password     VARCHAR(500)                            COMMENT '암호화 저장',
    remote_path         VARCHAR(500),
    done_path           VARCHAR(500),
    file_pattern        VARCHAR(200)                            COMMENT '{yyyyMMdd}.csv',
    file_encoding       VARCHAR(20)     DEFAULT 'UTF-8',

    extra_config        TEXT                                    COMMENT '추가 설정 JSON',
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_eai_adapter_config_interface FOREIGN KEY (interface_id) REFERENCES eai_interface_def(interface_id)
) COMMENT='EAI 어댑터 엔드포인트 설정';

CREATE INDEX idx_eai_adapter_config_if ON eai_adapter_config (interface_id);

-- ============================================================
-- 3. EAI 메시지 변환 매핑 규칙 테이블
-- ============================================================
CREATE TABLE eai_mapping_rule (
    id                  BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    interface_id        VARCHAR(20)     NOT NULL,
    source_path         VARCHAR(300)    NOT NULL                COMMENT '$.order.orderId',
    target_path         VARCHAR(300)    NOT NULL                COMMENT '/Order/OrderNo',
    transform_type      VARCHAR(30)     NOT NULL DEFAULT 'COPY' COMMENT 'COPY/FORMAT/CODE_MAP/EXPRESSION',
    transform_expr      VARCHAR(500)                            COMMENT 'EXPRESSION: SpEL, FORMAT: 날짜패턴, CODE_MAP: 그룹ID 참조',
    default_value       VARCHAR(200),
    is_required         BOOLEAN         DEFAULT FALSE,
    sort_order          INT             NOT NULL DEFAULT 0,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_eai_mapping_rule_transform CHECK (transform_type IN ('COPY','FORMAT','CODE_MAP','EXPRESSION')),
    CONSTRAINT fk_eai_mapping_rule_interface  FOREIGN KEY (interface_id) REFERENCES eai_interface_def(interface_id)
) COMMENT='EAI 메시지 필드 변환 매핑 규칙';

CREATE INDEX idx_eai_mapping_rule_if ON eai_mapping_rule (interface_id, sort_order);

-- ============================================================
-- 4. EAI 라우팅 규칙 테이블
-- ============================================================
CREATE TABLE eai_routing_rule (
    id                  BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    interface_id        VARCHAR(20)     NOT NULL,
    condition_expr      VARCHAR(500)                            COMMENT 'SpEL: payload.status == ''NEW''',
    target_adapter_id   BIGINT,
    target_system       VARCHAR(100),
    is_parallel         BOOLEAN         DEFAULT FALSE,
    sort_order          INT             NOT NULL DEFAULT 0,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_eai_routing_rule_interface FOREIGN KEY (interface_id)      REFERENCES eai_interface_def(interface_id),
    CONSTRAINT fk_eai_routing_rule_adapter   FOREIGN KEY (target_adapter_id) REFERENCES eai_adapter_config(id)
) COMMENT='EAI 조건 기반 라우팅 규칙';

CREATE INDEX idx_eai_routing_rule_if ON eai_routing_rule (interface_id);

-- ============================================================
-- 5. EAI 메시지 처리 이력 테이블
-- ============================================================
CREATE TABLE eai_message_history (
    id                  BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    message_id          VARCHAR(50)     NOT NULL UNIQUE         COMMENT 'UUID',
    interface_id        VARCHAR(20)     NOT NULL,
    direction           VARCHAR(10)     NOT NULL                COMMENT 'SEND, RECEIVE',
    source_system       VARCHAR(100),
    target_system       VARCHAR(100),
    status              VARCHAR(20)     NOT NULL                COMMENT 'SUCCESS, FAIL, RETRY, DLQ',
    request_body        TEXT                                    COMMENT '송신 메시지 원문 (민감데이터 암호화)',
    response_body       TEXT                                    COMMENT '수신 응답 원문',
    error_message       TEXT,
    retry_count         INT             NOT NULL DEFAULT 0,
    processing_ms       BIGINT,
    kafka_partition     INT,
    kafka_offset        BIGINT,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at        TIMESTAMP       NULL,

    CONSTRAINT chk_eai_message_history_status CHECK (status IN ('SUCCESS','FAIL','RETRY','DLQ'))
) COMMENT='EAI 메시지 송수신 처리 이력 (전체 원문 보관)';

CREATE INDEX idx_eai_msg_hist_if_created ON eai_message_history (interface_id, created_at DESC);
CREATE INDEX idx_eai_msg_hist_status     ON eai_message_history (status, created_at DESC);
CREATE INDEX idx_eai_msg_hist_created    ON eai_message_history (created_at DESC);

-- ============================================================
-- 6. EAI 배치 스케줄 테이블
-- ============================================================
CREATE TABLE eai_schedule (
    id                  BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    interface_id        VARCHAR(20)     NOT NULL,
    schedule_name       VARCHAR(200)    NOT NULL,
    cron_expr           VARCHAR(100)    NOT NULL                COMMENT '0 0/5 * * * ? (5분마다)',
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    last_run_at         TIMESTAMP       NULL,
    last_run_status     VARCHAR(20),
    next_run_at         TIMESTAMP       NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_eai_schedule_interface FOREIGN KEY (interface_id) REFERENCES eai_interface_def(interface_id)
) COMMENT='EAI Pull 배치 스케줄 설정';

CREATE INDEX idx_eai_schedule_active ON eai_schedule (is_active, next_run_at);

-- ============================================================
-- 7. EAI 코드 변환 그룹 테이블
-- ============================================================
CREATE TABLE eai_code_group (
    id                  BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    group_id            VARCHAR(50)     NOT NULL UNIQUE,
    group_name          VARCHAR(200)    NOT NULL,
    description         TEXT,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 8. EAI 코드 변환 매핑 테이블
-- ============================================================
CREATE TABLE eai_code_map (
    id                  BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    group_id            VARCHAR(50)     NOT NULL,
    source_code         VARCHAR(100)    NOT NULL,
    target_code         VARCHAR(100)    NOT NULL,
    description         VARCHAR(200),
    sort_order          INT             DEFAULT 0,

    UNIQUE KEY uq_eai_code_map (group_id, source_code),
    CONSTRAINT fk_eai_code_map_group FOREIGN KEY (group_id) REFERENCES eai_code_group(group_id)
) COMMENT='EAI 코드 변환 매핑 (소스코드 ↔ 타깃코드)';

-- ============================================================
-- 9. EAI 설정 변경 감사 로그 테이블
-- ============================================================
CREATE TABLE eai_audit_log (
    id                  BIGINT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    entity_type         VARCHAR(50)     NOT NULL                COMMENT 'INTERFACE, ADAPTER, MAPPING',
    entity_id           VARCHAR(50)     NOT NULL,
    action              VARCHAR(20)     NOT NULL                COMMENT 'CREATE, UPDATE, DELETE, TOGGLE',
    before_value        TEXT,
    after_value         TEXT,
    changed_by          VARCHAR(100),
    changed_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address          VARCHAR(50),
    user_agent          VARCHAR(500)
) COMMENT='EAI 설정 변경 감사 로그';

CREATE INDEX idx_eai_audit_entity  ON eai_audit_log (entity_type, entity_id, changed_at DESC);
CREATE INDEX idx_eai_audit_changed ON eai_audit_log (changed_at DESC);

SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
-- 2. 테스트 데이터 INSERT
-- ============================================================

-- 인터페이스 등록
INSERT INTO eai_interface_def (interface_id, name, source_system, target_system, adapter_type, direction, is_active, description) VALUES
  ('IF-0041', '주문 ERP 연동',       'OMS',    'ERP-SAP',    'REST', 'SEND',    TRUE,  'OMS 주문 생성 시 ERP로 실시간 전송'),
  ('IF-0038', '재고 현황 동기화',    'ERP',    'WMS',        'DB',   'SEND',    TRUE,  '야간 배치로 ERP 재고 → WMS 동기화'),
  ('IF-0027', '고객 정보 연동',      'CRM',    'ERP-Oracle', 'SOAP', 'SEND',    TRUE,  'CRM 고객 정보 변경 시 ERP 동기화'),
  ('IF-0019', '일일 매출 집계',      'POS',    'DW',         'FILE', 'SEND',    TRUE,  '오전 3시 POS 매출 파일 DW 적재'),
  ('IF-0015', '인사 발령 알림',      'HRM',    '그룹웨어',   'REST', 'SEND',    FALSE, '인사 발령 시 그룹웨어 알림 (현재 비활성)'),
  ('IF-0010', '물류 배송 상태 수신', '물류WMS','OMS',        'REST', 'RECEIVE', TRUE,  '물류사에서 배송 상태 Push 수신');

-- 어댑터 설정 등록
INSERT INTO eai_adapter_config (interface_id, adapter_type, url, http_method, timeout_ms, auth_type, auth_value, datasource_id, statement_id, operation_type, remote_host, remote_port, remote_user, remote_path, file_pattern) VALUES
  ('IF-0041', 'REST', 'https://erp-dev.example.com/api/v1/orders', 'POST', 5000, 'BEARER',  'ENCRYPTED:eyJhbGc...', NULL,     NULL,                      NULL,    NULL,                          22, NULL,       NULL,            NULL),
  ('IF-0015', 'REST', 'https://groupware.example.com/api/notify',  'POST', 3000, 'API_KEY', 'ENCRYPTED:xxxxxxxxxxx',NULL,     NULL,                      NULL,    NULL,                          22, NULL,       NULL,            NULL),
  ('IF-0038', 'DB',   NULL,                                        NULL,   NULL, 'NONE',    NULL,                   'DS_ERP', 'eai.erp.selectStockList', 'QUERY', NULL,                          22, NULL,       NULL,            NULL),
  ('IF-0027', 'SOAP', NULL,                                        NULL,   NULL, 'NONE',    NULL,                   NULL,     NULL,                      NULL,    NULL,                          22, NULL,       NULL,            NULL),
  ('IF-0019', 'FILE', NULL,                                        NULL,   NULL, 'NONE',    NULL,                   NULL,     NULL,                      NULL,    'ftp.pos-system.example.com',  22, 'eai_user', '/upload/sales', 'sales_{yyyyMMdd}.csv');

-- 매핑 규칙 등록
INSERT INTO eai_mapping_rule (interface_id, source_path, target_path, transform_type, sort_order) VALUES
  ('IF-0041', '$.orderId',     '/Order/OrderNo',      'COPY',       1),
  ('IF-0041', '$.orderDate',   '/Order/OrderDate',    'FORMAT',     2),
  ('IF-0041', '$.customerId',  '/Order/CustomerCode', 'COPY',       3),
  ('IF-0041', '$.totalAmount', '/Order/TotalAmt',     'EXPRESSION', 4),
  ('IF-0041', '$.status',      '/Order/StatusCode',   'CODE_MAP',   5),
  ('IF-0038', '$.stockCode',   '/Stock/ItemCode',     'COPY',       1),
  ('IF-0038', '$.warehouseId', '/Stock/WarehouseId',  'COPY',       2),
  ('IF-0038', '$.quantity',    '/Stock/Qty',          'COPY',       3);

-- 스케줄 등록
INSERT INTO eai_schedule (interface_id, schedule_name, cron_expr, is_active) VALUES
  ('IF-0038', '재고 동기화 5분 배치',    '0 0/5 * * * ?', TRUE),
  ('IF-0019', '일일 매출 오전 3시 배치', '0 0 3 * * ?',   TRUE);

-- 코드 변환 그룹 등록
INSERT INTO eai_code_group (group_id, group_name) VALUES
  ('ORDER_STATUS', '주문 상태 코드'),
  ('PAYMENT_TYPE', '결제 수단 코드');

-- 코드 변환 매핑 등록
INSERT INTO eai_code_map (group_id, source_code, target_code, description, sort_order) VALUES
  ('ORDER_STATUS', 'NEW',      '10', '신규 주문', 1),
  ('ORDER_STATUS', 'CONFIRM',  '20', '주문 확정', 2),
  ('ORDER_STATUS', 'SHIP',     '30', '배송 중',   3),
  ('ORDER_STATUS', 'DELIVER',  '40', '배송 완료', 4),
  ('ORDER_STATUS', 'CANCEL',   '90', '취소',      5),
  ('PAYMENT_TYPE', 'CARD',     'C',  '신용카드',  1),
  ('PAYMENT_TYPE', 'CASH',     'K',  '현금',      2),
  ('PAYMENT_TYPE', 'TRANSFER', 'T',  '계좌이체',  3);

-- 테스트 메시지 이력 등록
INSERT INTO eai_message_history (message_id, interface_id, direction, source_system, target_system, status, request_body, response_body, processing_ms, created_at, processed_at) VALUES
  (UUID(), 'IF-0041', 'SEND', 'OMS', 'ERP-SAP',
   'SUCCESS',
   '{"orderId":"ORD-20240101-001","customerId":"CUST-001","totalAmount":150000,"status":"NEW"}',
   '{"result":"OK","erpOrderId":"ERP-2024-0001"}',
   234,
   NOW() - INTERVAL 2 HOUR,
   DATE_ADD(NOW() - INTERVAL 2 HOUR, INTERVAL 234000 MICROSECOND)),
  (UUID(), 'IF-0041', 'SEND', 'OMS', 'ERP-SAP',
   'FAIL',
   '{"orderId":"ORD-20240101-002","customerId":"CUST-002","totalAmount":80000,"status":"NEW"}',
   NULL,
   5001,
   NOW() - INTERVAL 1 HOUR,
   NULL),
  (UUID(), 'IF-0038', 'SEND', 'ERP', 'WMS',
   'SUCCESS',
   '{"stockCode":"ITEM-001","warehouseId":"WH-01","quantity":100}',
   '{"updated":1}',
   45,
   NOW() - INTERVAL 30 MINUTE,
   DATE_ADD(NOW() - INTERVAL 30 MINUTE, INTERVAL 45000 MICROSECOND)),
  (UUID(), 'IF-0041', 'SEND', 'OMS', 'ERP-SAP',
   'DLQ',
   '{"orderId":"ORD-20240101-003","customerId":"INVALID","totalAmount":-100}',
   NULL,
   12,
   NOW() - INTERVAL 15 MINUTE,
   NULL);


-- ============================================================
-- 3. 조회 검증 SQL
-- ============================================================

-- 인터페이스별 오늘 처리 건수 집계
SELECT
    d.interface_id,
    d.name,
    d.source_system,
    d.target_system,
    d.adapter_type,
    d.is_active,
    COUNT(h.id)                                                            AS today_total,
    SUM(CASE WHEN h.status = 'SUCCESS' THEN 1 ELSE 0 END)                 AS success_count,
    SUM(CASE WHEN h.status = 'FAIL'    THEN 1 ELSE 0 END)                 AS fail_count,
    SUM(CASE WHEN h.status = 'DLQ'    THEN 1 ELSE 0 END)                  AS dlq_count,
    ROUND(
        SUM(CASE WHEN h.status = 'SUCCESS' THEN 1 ELSE 0 END)
        / NULLIF(COUNT(h.id), 0) * 100, 1
    )                                                                      AS success_rate_pct,
    ROUND(AVG(h.processing_ms), 0)                                        AS avg_processing_ms,
    MAX(h.created_at)                                                      AS last_run_at
FROM eai_interface_def d
LEFT JOIN eai_message_history h
    ON h.interface_id = d.interface_id
    AND h.created_at >= CURDATE()
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
    DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00')        AS hour,
    COUNT(*)                                             AS total_count,
    SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) AS success_count,
    SUM(CASE WHEN status = 'FAIL'    THEN 1 ELSE 0 END) AS fail_count,
    ROUND(AVG(processing_ms), 0)                         AS avg_ms
FROM eai_message_history
WHERE created_at >= NOW() - INTERVAL 24 HOUR
GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00')
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


-- ============================================================
-- 4. 월별 파티셔닝 (운영 환경 권장, MariaDB 10.5+)
-- RANGE COLUMNS 파티셔닝은 TIMESTAMP 미지원 → DATETIME 사용
-- ============================================================
CREATE TABLE eai_message_history_partitioned (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    message_id          VARCHAR(50)     NOT NULL,
    interface_id        VARCHAR(20)     NOT NULL,
    direction           VARCHAR(10)     NOT NULL,
    source_system       VARCHAR(100),
    target_system       VARCHAR(100),
    status              VARCHAR(20)     NOT NULL,
    request_body        TEXT,
    response_body       TEXT,
    error_message       TEXT,
    retry_count         INT             NOT NULL DEFAULT 0,
    processing_ms       BIGINT,
    kafka_partition     INT,
    kafka_offset        BIGINT,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at        DATETIME        NULL,
    PRIMARY KEY (id, created_at),
    UNIQUE KEY uq_message_id (message_id, created_at)
)
PARTITION BY RANGE COLUMNS(created_at) (
    PARTITION p202501 VALUES LESS THAN ('2025-02-01 00:00:00'),
    PARTITION p202502 VALUES LESS THAN ('2025-03-01 00:00:00'),
    PARTITION p_future VALUES LESS THAN (MAXVALUE)
);

-- 월별 파티션 추가 예시 (매월 실행 권장)
-- ALTER TABLE eai_message_history_partitioned
--   REORGANIZE PARTITION p_future INTO (
--     PARTITION p202503 VALUES LESS THAN ('2025-04-01 00:00:00'),
--     PARTITION p_future VALUES LESS THAN (MAXVALUE)
--   );

-- 오래된 파티션 삭제 (30일 이상 보관 정책 시)
-- ALTER TABLE eai_message_history_partitioned DROP PARTITION p202501;

-- 통계 업데이트 (정기 실행 권장)
ANALYZE TABLE eai_message_history;
ANALYZE TABLE eai_interface_def;
