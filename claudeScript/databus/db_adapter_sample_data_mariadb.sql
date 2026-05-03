-- ============================================================
-- EAI 어댑터 테이블 샘플 데이터 (각 12건) - MariaDB 호환 버전
-- 수정 이력:
--   - eai_soap_config ws_security_type 'BASIC' → 'USERNAME_TOKEN' 변경
--     (CHECK 제약: NONE / USERNAME_TOKEN / X509 / SAML 만 허용)
--   - MariaDB 비호환 문법 수정 (STRING_AGG → GROUP_CONCAT)
-- ============================================================

-- 실행 전 확인
-- SHOW CREATE TABLE eai_soap_config\G

-- ============================================================
-- 0. 선행 조건: eai_interface_def 샘플 (어댑터 FK 참조용)
-- ============================================================
INSERT INTO eai_interface_def
  (interface_id, name, source_system, target_system, adapter_type, direction, is_active, description)
VALUES
  ('IF-1001','주문 ERP 전송',       'OMS',     'ERP-SAP',    'REST', 'SEND',    TRUE,  '주문 생성 시 ERP로 실시간 전송'),
  ('IF-1002','재고 WMS 동기화',     'ERP-SAP', 'WMS',        'DB',   'SEND',    TRUE,  'ERP 재고 → WMS 배치 동기화'),
  ('IF-1003','고객 정보 연동',      'CRM',     'ERP-Oracle', 'SOAP', 'SEND',    TRUE,  'CRM 고객 변경 → ERP 동기화'),
  ('IF-1004','일일 매출 적재',      'POS',     'DW',         'FILE', 'SEND',    TRUE,  'POS 매출 파일 DW 적재'),
  ('IF-1005','회원 가입 알림',      'PORTAL',  '그룹웨어',   'REST', 'SEND',    TRUE,  '신규 회원 가입 시 그룹웨어 알림'),
  ('IF-1006','물류 배송 수신',      '물류WMS', 'OMS',        'REST', 'RECEIVE', TRUE,  '물류사 배송 상태 Push 수신'),
  ('IF-1007','구매발주 전송',       'SCM',     'ERP-SAP',    'SOAP', 'SEND',    TRUE,  '발주 생성 시 ERP로 SOAP 전송'),
  ('IF-1008','HR 인사 발령',        'HRM',     '그룹웨어',   'REST', 'SEND',    FALSE, '인사 발령 알림 (비활성)'),
  ('IF-1009','생산계획 DB 연동',    'MES',     'ERP-SAP',    'DB',   'SEND',    TRUE,  'MES 생산계획 → ERP DB 직접 연동'),
  ('IF-1010','협력사 발주 파일',    'ERP-SAP', '협력사FTP',  'FILE', 'SEND',    TRUE,  'ERP 발주 파일 협력사 SFTP 전송'),
  ('IF-1011','계약 시스템 연동',    'CRM',     '계약관리',   'SOAP', 'SEND',    TRUE,  'CRM 계약 체결 → 계약관리 시스템'),
  ('IF-1012','품질검사 결과 수신',  'QMS',     'MES',        'FILE', 'RECEIVE', TRUE,  'QMS 검사 결과 파일 MES 수신'),
  ('IF-1013','급여 이체 요청',      'HRM',     '은행시스템', 'REST', 'SEND',    TRUE,  '급여일 은행 API 이체 요청'),
  ('IF-1014','설비 IoT 데이터',     'IoT-GW',  'MES',        'REST', 'RECEIVE', TRUE,  '설비 센서 데이터 MES 적재'),
  ('IF-1015','세금계산서 발행',     'ERP-SAP', '국세청',     'REST', 'SEND',    TRUE,  '전자세금계산서 국세청 API'),
  ('IF-1016','고객 포인트 동기화',  'OMS',     'CRM',        'DB',   'SEND',    TRUE,  '주문 완료 시 포인트 CRM 동기화'),
  ('IF-1017','AS 접수 연동',        '콜센터',  'ERP-Oracle', 'SOAP', 'SEND',    TRUE,  'AS 접수 → ERP 서비스오더'),
  ('IF-1018','물류비용 정산 파일',  '물류WMS', 'ERP-SAP',    'FILE', 'RECEIVE', TRUE,  '월말 물류비 정산 파일 수신'),
  ('IF-1019','주간 판매 리포트',    'ERP-SAP', 'BI-Server',  'FILE', 'SEND',    TRUE,  '주간 판매 데이터 BI 전송'),
  ('IF-1020','앱 푸시 발송',        'PORTAL',  '푸시서버',   'REST', 'SEND',    TRUE,  '이벤트 발생 시 모바일 푸시');


-- ============================================================
-- 1. eai_datasource (12건) - 변경 없음
-- ============================================================
INSERT INTO eai_datasource
  (datasource_id, datasource_name, db_type, jdbc_url,
   db_username, db_password, driver_class,
   pool_min_size, pool_max_size, query_timeout_sec, default_schema, description)
VALUES
('DS_ERP_SAP','SAP ERP Oracle DB','ORACLE',
 'jdbc:oracle:thin:@erp-db.internal:1521:ERPDB',
 'eai_erp_user','ENCRYPTED:U2FsdGVkX1+erp001xyzABCDEFGHIJKLMN==',
 'oracle.jdbc.OracleDriver',5,20,30,'SAPSR3','SAP ERP 메인 Oracle DB'),

('DS_ERP_ORA','Oracle ERP DB','ORACLE',
 'jdbc:oracle:thin:@erp-ora.internal:1521:ORAERP',
 'eai_ora_user','ENCRYPTED:U2FsdGVkX1+ora002xyzABCDEFGHIJKLMN==',
 'oracle.jdbc.OracleDriver',3,15,30,'ERPADMIN','Oracle ERP 2차 인스턴스'),

('DS_WMS','WMS PostgreSQL','POSTGRESQL',
 'jdbc:postgresql://wms-db.internal:5432/wmsdb',
 'eai_wms_user','ENCRYPTED:U2FsdGVkX1+wms003xyzABCDEFGHIJKLMN==',
 'org.postgresql.Driver',5,20,20,'wms','WMS 창고관리 시스템 DB'),

('DS_CRM','CRM SQL Server','MSSQL',
 'jdbc:sqlserver://crm-db.internal:1433;databaseName=CRMDB',
 'eai_crm_user','ENCRYPTED:U2FsdGVkX1+crm004xyzABCDEFGHIJKLMN==',
 'com.microsoft.sqlserver.jdbc.SQLServerDriver',3,10,15,'dbo','CRM 고객관리 DB'),

('DS_MES','MES MySQL','MYSQL',
 'jdbc:mysql://mes-db.internal:3306/mesdb?useSSL=true&serverTimezone=Asia/Seoul',
 'eai_mes_user','ENCRYPTED:U2FsdGVkX1+mes005xyzABCDEFGHIJKLMN==',
 'com.mysql.cj.jdbc.Driver',5,15,20,'mesdb','MES 생산실행 시스템 DB'),

('DS_DW','DW PostgreSQL','POSTGRESQL',
 'jdbc:postgresql://dw-db.internal:5432/dwdb',
 'eai_dw_user','ENCRYPTED:U2FsdGVkX1+dw006xyzABCDEFGHIJKLMN==',
 'org.postgresql.Driver',3,10,60,'dw','Data Warehouse (분석용 DB)'),

('DS_HRM','HRM MariaDB','MARIADB',
 'jdbc:mariadb://hrm-db.internal:3306/hrmdb',
 'eai_hrm_user','ENCRYPTED:U2FsdGVkX1+hrm007xyzABCDEFGHIJKLMN==',
 'org.mariadb.jdbc.Driver',2,10,15,'hrmdb','HRM 인사관리 DB'),

('DS_SCM','SCM PostgreSQL','POSTGRESQL',
 'jdbc:postgresql://scm-db.internal:5432/scmdb',
 'eai_scm_user','ENCRYPTED:U2FsdGVkX1+scm008xyzABCDEFGHIJKLMN==',
 'org.postgresql.Driver',3,15,30,'scm','SCM 공급망 관리 DB'),

('DS_QMS','QMS MySQL','MYSQL',
 'jdbc:mysql://qms-db.internal:3306/qmsdb?useSSL=false&serverTimezone=Asia/Seoul',
 'eai_qms_user','ENCRYPTED:U2FsdGVkX1+qms009xyzABCDEFGHIJKLMN==',
 'com.mysql.cj.jdbc.Driver',2,8,20,'qmsdb','QMS 품질관리 DB'),

('DS_PORTAL','포탈 PostgreSQL','POSTGRESQL',
 'jdbc:postgresql://portal-db.internal:5432/portaldb',
 'eai_portal_user','ENCRYPTED:U2FsdGVkX1+portal010xyzABCDEFGHIJKLMN==',
 'org.postgresql.Driver',5,20,10,'portal','사내 포탈 메인 DB'),

('DS_ERP_RO','ERP 리포팅 Oracle (읽기전용)','ORACLE',
 'jdbc:oracle:thin:@erp-ro.internal:1521:ERPDB',
 'eai_readonly','ENCRYPTED:U2FsdGVkX1+ro011xyzABCDEFGHIJKLMN==',
 'oracle.jdbc.OracleDriver',5,30,60,'SAPSR3','ERP 리포팅 전용 읽기전용'),

('DS_LOCAL_TEST','로컬 테스트 H2','H2',
 'jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=Oracle',
 'sa','','org.h2.Driver',1,5,10,NULL,'개발/테스트 전용 인메모리 DB');

-- ============================================================
-- 2. eai_db_adapter_config (12건) - 변경 없음
-- ============================================================
INSERT INTO eai_db_adapter_config
  (interface_id, datasource_id, statement_id, operation_type,
   result_type, rollback_on_error, param_mapping)
VALUES
('IF-1002','DS_ERP_SAP','eai.erp.stock.selectStockList','QUERY','LIST',FALSE,
 '{"lastSyncAt":"$.lastSyncAt","warehouseCode":"$.warehouseCode"}'),

('IF-1002','DS_WMS','eai.wms.stock.upsertStock','PROCEDURE','NONE',TRUE,
 '{"itemCode":"$.stockCode","qty":"$.quantity","warehouseId":"$.warehouseId"}'),

('IF-1009','DS_MES','eai.mes.plan.selectPlanList','QUERY','LIST',FALSE,
 '{"planDate":"$.planDate","lineCode":"$.lineCode"}'),

('IF-1009','DS_ERP_SAP','eai.erp.plan.insertProductionPlan','INSERT','COUNT',TRUE,
 '{"orderId":"$.planId","qty":"$.qty","dueDate":"$.dueDate"}'),

('IF-1016','DS_PORTAL','eai.portal.order.selectOrderPoint','QUERY','SINGLE',FALSE,
 '{"orderId":"$.orderId","customerId":"$.customerId"}'),

('IF-1016','DS_CRM','eai.crm.point.updateCustomerPoint','PROCEDURE','NONE',TRUE,
 '{"custId":"$.customerId","addPoint":"$.pointAmount","reason":"$.orderNo"}'),

('IF-1012','DS_MES','eai.mes.quality.insertInspectionResult','INSERT','COUNT',TRUE,
 '{"lotNo":"$.lotNo","itemCode":"$.itemCode","result":"$.passYn","inspector":"$.userId"}'),

('IF-1007','DS_SCM','eai.scm.po.selectOpenPoList','QUERY','LIST',FALSE,
 '{"vendorCode":"$.vendorCode","fromDate":"$.fromDate","toDate":"$.toDate"}'),

('IF-1013','DS_HRM','eai.hrm.salary.selectSalaryTransfer','QUERY','LIST',FALSE,
 '{"payYm":"$.payYm","deptCode":"$.deptCode"}'),

('IF-1013','DS_HRM','eai.hrm.salary.updateTransferStatus','UPDATE','COUNT',TRUE,
 '{"payYm":"$.payYm","empNo":"$.empNo","txnId":"$.bankTxnId","status":"DONE"}'),

('IF-1019','DS_ERP_RO','eai.erp.report.selectWeeklySales','QUERY','LIST',FALSE,
 '{"weekStart":"$.weekStart","weekEnd":"$.weekEnd","divisionCode":"$.divisionCode"}'),

('IF-1005','DS_PORTAL','eai.portal.member.selectNewMembers','QUERY','LIST',FALSE,
 '{"fromDt":"$.fromDt","toDt":"$.toDt"}');


-- ============================================================
-- 3. eai_rest_config (12건) - 변경 없음
-- ============================================================
INSERT INTO eai_rest_config
  (interface_id, config_name, url, http_method, timeout_ms,
   auth_type, auth_value, token_url, client_id, client_secret,
   content_type, request_headers, ssl_verify, proxy_host, proxy_port,
   success_http_codes, response_path)
VALUES
('IF-1001','ERP SAP REST 주문 전송',
 'https://erp-api.internal/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder',
 'POST',5000,'BEARER','ENCRYPTED:U2FsdGVkX1+rest_erp_token_001==',
 NULL,NULL,NULL,'application/json',
 '[{"key":"sap-client","value":"100"},{"key":"X-Requested-With","value":"XMLHttpRequest"}]',
 TRUE,NULL,NULL,'200,201','$.d.SalesOrder'),

('IF-1005','그룹웨어 회원알림 API',
 'https://groupware.internal/api/v2/notifications/send',
 'POST',3000,'API_KEY','ENCRYPTED:U2FsdGVkX1+gw_apikey_002==',
 NULL,NULL,NULL,'application/json',
 '[{"key":"X-Service-ID","value":"EAI_PORTAL"}]',
 TRUE,NULL,NULL,'200','$.result.messageId'),

('IF-1006','물류 배송상태 수신 Webhook',
 'https://eai.internal/api/eai/interfaces/receive/IF-1006',
 'POST',5000,'API_KEY','ENCRYPTED:U2FsdGVkX1+logistics_key_003==',
 NULL,NULL,NULL,'application/json','[]',
 TRUE,NULL,NULL,'200','$.status'),

('IF-1008','HR 발령 그룹웨어 알림',
 'https://groupware.internal/api/v2/hr/appointment/notify',
 'POST',3000,'BEARER','ENCRYPTED:U2FsdGVkX1+hr_token_004==',
 NULL,NULL,NULL,'application/json',
 '[{"key":"X-HR-System","value":"HRM_V2"}]',
 TRUE,NULL,NULL,'200,202',NULL),

('IF-1013','은행 급여이체 API',
 'https://bank-api.external/v1/transfer/batch',
 'POST',10000,'OAUTH2',NULL,
 'https://bank-api.external/oauth/token',
 'EAI_CLIENT_ID_BANK','ENCRYPTED:U2FsdGVkX1+bank_secret_005==',
 'application/json',
 '[{"key":"X-Bank-Channel","value":"CORP"},{"key":"X-Idempotency-Key","value":"{messageId}"}]',
 TRUE,'proxy.internal',8080,'200,202','$.transferResult.txnId'),

('IF-1014','IoT 게이트웨이 데이터 수신',
 'https://eai.internal/api/eai/interfaces/receive/IF-1014',
 'POST',2000,'API_KEY','ENCRYPTED:U2FsdGVkX1+iot_apikey_006==',
 NULL,NULL,NULL,'application/json',
 '[{"key":"X-Device-Type","value":"SENSOR"}]',
 TRUE,NULL,NULL,'200',NULL),

('IF-1015','국세청 전자세금계산서 API',
 'https://api.nts.go.kr/v1/taxinvoice',
 'POST',15000,'OAUTH2',NULL,
 'https://api.nts.go.kr/oauth/token',
 'NTS_CLIENT_EAI','ENCRYPTED:U2FsdGVkX1+nts_secret_007==',
 'application/json',
 '[{"key":"X-System-ID","value":"COMPANY_ERP"}]',
 TRUE,'proxy.internal',8080,'200','$.issueNo'),

('IF-1020','FCM 모바일 푸시 발송',
 'https://fcm.googleapis.com/fcm/send',
 'POST',5000,'BEARER','ENCRYPTED:U2FsdGVkX1+fcm_server_key_008==',
 NULL,NULL,NULL,'application/json',
 '[{"key":"X-EAI-Source","value":"PORTAL"}]',
 TRUE,NULL,NULL,'200','$.results[0].message_id'),

('IF-1007','ERP SAP 자재마스터 조회 REST',
 'https://erp-api.internal/sap/opu/odata/sap/API_MATERIAL_SRV/A_Product',
 'GET',5000,'BASIC','ENCRYPTED:U2FsdGVkX1+erp_basic_009==',
 NULL,NULL,NULL,'application/json',
 '[{"key":"sap-client","value":"100"},{"key":"Accept","value":"application/json"}]',
 TRUE,NULL,NULL,'200','$.d.results'),

('IF-1003','CRM 고객 조회 REST',
 'https://crm-api.internal/api/v1/customers/{customerId}',
 'GET',5000,'BEARER','ENCRYPTED:U2FsdGVkX1+crm_token_010==',
 NULL,NULL,NULL,'application/json',
 '[{"key":"X-CRM-Version","value":"2.1"}]',
 TRUE,NULL,NULL,'200','$.customer'),

('IF-1011','계약관리 상태변경 API',
 'https://contract-api.internal/api/v1/contracts/status',
 'PUT',5000,'API_KEY','ENCRYPTED:U2FsdGVkX1+contract_key_011==',
 NULL,NULL,NULL,'application/json',
 '[{"key":"X-Request-From","value":"CRM_EAI"}]',
 TRUE,NULL,NULL,'200','$.contractId'),

('IF-1006','OMS 배송상태 업데이트 API',
 'https://oms-api.internal/api/v2/orders/delivery-status',
 'PATCH',3000,'BEARER','ENCRYPTED:U2FsdGVkX1+oms_token_012==',
 NULL,NULL,NULL,'application/json',
 '[{"key":"X-OMS-Channel","value":"LOGISTICS"}]',
 TRUE,NULL,NULL,'200,204','$.orderId');


-- ============================================================
-- 4. eai_soap_config (12건)
-- ★ 핵심 수정: ws_security_type CHECK 허용값
--    NONE / USERNAME_TOKEN / X509 / SAML
--    → 이전 'BASIC' 값을 'USERNAME_TOKEN' 으로 변경 (7번 항목)
-- ============================================================
INSERT INTO eai_soap_config
  (interface_id, config_name,
   wsdl_url, service_url, namespace, operation_name, port_name,
   soap_version, ws_security_type, ws_username, ws_password, ws_password_type,
   soap_action, mtom_enabled, timeout_ms)
VALUES

-- 1) CRM 고객 정보 레거시 ERP 전송 (USERNAME_TOKEN / PasswordText)
('IF-1003','CRM → 레거시 ERP 고객정보 SOAP',
 'http://legacy-erp.internal/services/CustomerService?wsdl',
 'http://legacy-erp.internal/services/CustomerService',
 'http://legacy-erp.internal/customer/v1',
 'updateCustomerInfo','CustomerServicePort',
 '1.1','USERNAME_TOKEN',
 'svc_eai_crm','ENCRYPTED:U2FsdGVkX1+soap_crm_001==','PasswordText',
 'http://legacy-erp.internal/customer/updateCustomerInfo',
 FALSE,10000),

-- 2) SCM → SAP 구매발주 SOAP BAPIs (USERNAME_TOKEN / PasswordDigest)
('IF-1007','SCM → SAP 발주전송 SOAP',
 'http://erp-sap.internal:8000/sap/wsdl/srvc?sap-client=100&service=MM_PO_CREATE',
 'http://erp-sap.internal:8000/sap/bc/srt/rfc/sap/mm_po_create/100/binding',
 'urn:sap-com:document:sap:soap:functions:mc-style',
 'MmPoCreate','MmPoCreate_Binding',
 '1.1','USERNAME_TOKEN',
 'RFC_EAI','ENCRYPTED:U2FsdGVkX1+soap_sap_002==','PasswordDigest',
 'urn:sap-com:document:sap:soap:functions:mc-style:MmPoCreate',
 FALSE,15000),

-- 3) 콜센터 AS 접수 → ERP 서비스오더 (SOAP 1.2 / PasswordText)
('IF-1017','콜센터 AS접수 → ERP 서비스오더',
 'http://erp-ora.internal/services/ServiceOrderWS?wsdl',
 'http://erp-ora.internal/services/ServiceOrderWS',
 'http://erp-oracle.internal/serviceorder/v2',
 'createServiceOrder','ServiceOrderPort',
 '1.2','USERNAME_TOKEN',
 'svc_eai_cs','ENCRYPTED:U2FsdGVkX1+soap_cs_003==','PasswordText',
 NULL,FALSE,10000),

-- 4) CRM → 계약관리 계약체결 SOAP (USERNAME_TOKEN)
('IF-1011','CRM → 계약관리 계약체결 SOAP',
 'http://contract.internal/ws/ContractService?wsdl',
 'http://contract.internal/ws/ContractService',
 'http://contract.internal/schema/v1',
 'createContract','ContractPort',
 '1.1','USERNAME_TOKEN',
 'svc_eai_contract','ENCRYPTED:U2FsdGVkX1+soap_contract_004==','PasswordText',
 'http://contract.internal/schema/v1/createContract',
 FALSE,8000),

-- 5) 물류 레거시 배송예약 SOAP (인증 없음 - 내부망)
('IF-1006','물류 레거시 배송예약 SOAP',
 'http://legacy-logistics.internal/DeliveryService?wsdl',
 'http://legacy-logistics.internal/DeliveryService',
 'http://legacy-logistics.internal/delivery',
 'reserveDelivery','DeliveryServiceSoapPort',
 '1.1','NONE',
 NULL,NULL,NULL,
 'http://legacy-logistics.internal/delivery/reserveDelivery',
 FALSE,12000),

-- 6) 세금계산서 레거시 ERP SOAP (USERNAME_TOKEN)
('IF-1015','세금계산서 레거시 ERP 전송',
 'http://erp-legacy.internal/TaxInvoiceService?wsdl',
 'http://erp-legacy.internal/TaxInvoiceService',
 'http://erp-legacy.internal/taxinvoice/v1',
 'issueTaxInvoice','TaxInvoicePort',
 '1.1','USERNAME_TOKEN',
 'svc_eai_tax','ENCRYPTED:U2FsdGVkX1+soap_tax_006==','PasswordText',
 NULL,FALSE,20000),

-- 7) HRM → 그룹웨어 발령 SOAP
--    ★ 수정: 'BASIC' → 'USERNAME_TOKEN'
--      (BASIC 인증은 HTTP 헤더 방식이므로 WS-Security 규격상 USERNAME_TOKEN 사용)
('IF-1008','HRM → 그룹웨어 발령 SOAP',
 'http://groupware-legacy.internal/HRService?wsdl',
 'http://groupware-legacy.internal/HRService',
 'http://groupware-legacy.internal/hr',
 'notifyAppointment','HRServiceSoapPort',
 '1.1','USERNAME_TOKEN',     -- ← 'BASIC' 에서 변경
 'svc_eai_hr','ENCRYPTED:U2FsdGVkX1+soap_hr_007==','PasswordText',
 'http://groupware-legacy.internal/hr/notifyAppointment',
 FALSE,5000),

-- 8) SCM → ERP 납품확정 SOAP BAPIs (USERNAME_TOKEN / PasswordDigest)
('IF-1007','SCM 납품확정 → ERP SOAP',
 'http://erp-sap.internal:8000/sap/wsdl/srvc?service=GR_CONFIRM',
 'http://erp-sap.internal:8000/sap/bc/srt/rfc/sap/gr_confirm/binding',
 'urn:sap-com:document:sap:soap:functions:mc-style',
 'GrConfirm','GrConfirm_Binding',
 '1.1','USERNAME_TOKEN',
 'RFC_EAI','ENCRYPTED:U2FsdGVkX1+soap_gr_008==','PasswordDigest',
 'urn:sap-com:document:sap:soap:functions:mc-style:GrConfirm',
 FALSE,15000),

-- 9) 포탈 → 레거시 권한관리 SOAP (USERNAME_TOKEN)
('IF-1005','포탈 회원 → 레거시 권한관리 SOAP',
 'http://auth-legacy.internal/AuthService?wsdl',
 'http://auth-legacy.internal/AuthService',
 'http://auth-legacy.internal/authorization',
 'grantDefaultAuth','AuthServicePort',
 '1.1','USERNAME_TOKEN',
 'svc_eai_portal','ENCRYPTED:U2FsdGVkX1+soap_auth_009==','PasswordText',
 NULL,FALSE,5000),

-- 10) MES → SAP PP 생산실적 SOAP (USERNAME_TOKEN / PasswordDigest)
('IF-1009','MES 생산실적 → SAP PP SOAP',
 'http://erp-sap.internal:8000/sap/wsdl/srvc?service=PP_CONF_CREATE',
 'http://erp-sap.internal:8000/sap/bc/srt/rfc/sap/pp_conf_create/binding',
 'urn:sap-com:document:sap:soap:functions:mc-style',
 'PpConfCreate','PpConfCreate_Binding',
 '1.1','USERNAME_TOKEN',
 'RFC_EAI','ENCRYPTED:U2FsdGVkX1+soap_pp_010==','PasswordDigest',
 'urn:sap-com:document:sap:soap:functions:mc-style:PpConfCreate',
 FALSE,10000),

-- 11) QMS → ERP 품질검사결과 SOAP (MTOM 이미지 첨부, USERNAME_TOKEN)
('IF-1012','QMS 검사결과+이미지 → ERP SOAP (MTOM)',
 'http://erp-ora.internal/services/QualityService?wsdl',
 'http://erp-ora.internal/services/QualityService',
 'http://erp-oracle.internal/quality/v1',
 'submitInspectionResult','QualityServicePort',
 '1.1','USERNAME_TOKEN',
 'svc_eai_qms','ENCRYPTED:U2FsdGVkX1+soap_qms_011==','PasswordText',
 NULL,
 TRUE,   -- MTOM 활성화 (검사 이미지 첨부 전송)
 30000),

-- 12) 협력사 포탈 → 발주확인 외부 SOAP (SOAP 1.2 / PasswordDigest)
('IF-1010','협력사 발주확인 외부 SOAP',
 'https://partner-portal.external/ws/PurchaseOrderService?wsdl',
 'https://partner-portal.external/ws/PurchaseOrderService',
 'http://partner-portal.external/po/v2',
 'confirmPurchaseOrder','POServicePort',
 '1.2','USERNAME_TOKEN',
 'eai_partner_user','ENCRYPTED:U2FsdGVkX1+soap_partner_012==','PasswordDigest',
 'http://partner-portal.external/po/v2/confirmPurchaseOrder',
 FALSE,20000);


-- ============================================================
-- 5. eai_file_config (12건) - 변경 없음
-- ============================================================
INSERT INTO eai_file_config
  (interface_id, config_name,
   protocol, remote_host, remote_port, remote_user, remote_password,
   ssh_key_path, ssh_key_passphrase,
   upload_path, download_path, local_temp_path, done_path, error_path,
   file_pattern, file_format, file_encoding, delimiter,
   has_header, skip_lines, polling_sec, batch_size,
   connect_timeout_ms, delete_after_done, description)
VALUES

-- 1) POS 일일 매출 파일 수신 (CSV / EUC-KR)
('IF-1004','POS 매출 SFTP 수신',
 'SFTP','ftp-pos.internal',22,'eai_recv_pos',
 'ENCRYPTED:U2FsdGVkX1+file_pos_001==',NULL,NULL,
 NULL,'/upload/pos/sales','/tmp/eai/pos',
 '/upload/pos/sales/done','/upload/pos/sales/error',
 'SALES_{yyyyMMdd}.CSV','CSV','EUC-KR',',',
 TRUE,0,300,5000,10000,FALSE,
 'POS 일일 매출 집계 파일, 매일 새벽 2시 수신'),

-- 2) ERP → 협력사 발주 파일 송신 (SSH 키 인증)
('IF-1010','ERP 발주 협력사 SFTP 송신',
 'SFTP','ftp-partner.external',22,'eai_send_partner',
 NULL,'/opt/eai/keys/partner_rsa',
 'ENCRYPTED:U2FsdGVkX1+file_partner_key_002==',
 '/incoming/orders',NULL,'/tmp/eai/partner',
 NULL,'/tmp/eai/partner/error',
 'PO_{yyyyMMdd}_{HHmmss}.CSV','CSV','UTF-8',',',
 TRUE,0,NULL,1000,15000,FALSE,
 'SSH 키 인증으로 협력사 SFTP에 발주 파일 업로드'),

-- 3) 물류비 정산 파일 수신 (Excel / 1시간 폴링)
('IF-1018','물류 정산 SFTP 수신 (Excel)',
 'SFTP','ftp-logistics.internal',22,'eai_recv_logistics',
 'ENCRYPTED:U2FsdGVkX1+file_logistics_003==',NULL,NULL,
 NULL,'/upload/logistics/billing','/tmp/eai/logistics',
 '/upload/logistics/billing/done','/upload/logistics/billing/error',
 'LOGISTICS_BILLING_{yyyyMM}.XLSX','EXCEL','UTF-8',NULL,
 TRUE,0,3600,2000,10000,FALSE,
 '월말 물류비 정산 Excel 파일 수신, 1시간 폴링'),

-- 4) ERP → BI 주간 판매 파일 송신 (파이프 구분자)
('IF-1019','ERP 주간판매 BI SFTP 송신',
 'SFTP','bi-server.internal',22,'eai_send_bi',
 'ENCRYPTED:U2FsdGVkX1+file_bi_004==',NULL,NULL,
 '/bi/data/sales/weekly',NULL,'/tmp/eai/bi',
 NULL,'/tmp/eai/bi/error',
 'WEEKLY_SALES_{yyyyww}.CSV','CSV','UTF-8','|',
 TRUE,0,NULL,10000,10000,FALSE,
 'BI 서버로 주간 판매 집계 파이프(|) 구분자 CSV 전송'),

-- 5) QMS 품질검사 결과 FTP 수신 (수신 후 삭제, 헤더 2행 skip)
('IF-1012','QMS 검사결과 FTP 수신',
 'FTP','qms-ftp.internal',21,'eai_recv_qms',
 'ENCRYPTED:U2FsdGVkX1+file_qms_005==',NULL,NULL,
 NULL,'/qms/result/outgoing','/tmp/eai/qms',
 '/qms/result/done','/qms/result/error',
 'QC_RESULT_{yyyyMMdd}*.CSV','CSV','EUC-KR',',',
 TRUE,2,600,3000,10000,TRUE,
 'QMS 품질검사 결과, 10분 폴링, 수신 후 원격 파일 삭제'),

-- 6) SCM → ERP 재고조정 고정길이(Fixed) 파일
('IF-1002','SCM 재고조정 Fixed 파일 수신',
 'SFTP','scm-sftp.internal',22,'eai_recv_scm',
 'ENCRYPTED:U2FsdGVkX1+file_scm_006==',NULL,NULL,
 NULL,'/scm/inventory/adjust','/tmp/eai/scm',
 '/scm/inventory/adjust/done','/scm/inventory/adjust/error',
 'INV_ADJUST_{yyyyMMdd}.DAT','FIXED','EUC-KR',NULL,
 FALSE,0,1800,5000,10000,FALSE,
 '고정길이 포맷 재고조정 파일, 30분 폴링'),

-- 7) HRM → 은행 급여 FTPS 송신 (FTP over SSL, 포트 990)
('IF-1013','HRM 급여 은행 FTPS 송신',
 'FTPS','bank-ftp.external',990,'eai_payroll',
 'ENCRYPTED:U2FsdGVkX1+file_bank_007==',NULL,NULL,
 '/incoming/payroll',NULL,'/tmp/eai/payroll',
 NULL,'/tmp/eai/payroll/error',
 'PAYROLL_{yyyyMM}_{HHmmss}.TXT','FIXED','EUC-KR',NULL,
 FALSE,0,NULL,1000,20000,FALSE,
 'FTPS 은행 급여이체 파일, 매월 급여일 1회 송신'),

-- 8) 로컬 공유 디렉토리 파일 감시 (2분 폴링)
('IF-1004','POS 로컬 파일 처리 (백업경로)',
 'LOCAL',NULL,NULL,NULL,NULL,NULL,NULL,
 NULL,'/data/eai/pos/incoming','/tmp/eai/pos_local',
 '/data/eai/pos/done','/data/eai/pos/error',
 'SALES_BACKUP_{yyyyMMdd}.CSV','CSV','UTF-8',',',
 TRUE,0,120,5000,NULL,FALSE,
 '로컬 공유 드라이브 파일 감시, 2분 폴링'),

-- 9) MES 생산실적 JSON Lines 파일 수신 (시간별)
('IF-1009','MES 생산실적 JSON 파일 수신',
 'SFTP','mes-sftp.internal',22,'eai_recv_mes',
 'ENCRYPTED:U2FsdGVkX1+file_mes_009==',NULL,NULL,
 NULL,'/mes/production/result','/tmp/eai/mes',
 '/mes/production/done','/mes/production/error',
 'PROD_RESULT_{yyyyMMddHH}.JSONL','JSON','UTF-8',NULL,
 FALSE,0,600,2000,10000,FALSE,
 'MES 시간별 생산실적 JSON Lines 포맷 수신'),

-- 10) ERP → 협력사B 발주 파일 (비표준 포트 22022, 탭 구분자)
('IF-1010','ERP 발주 협력사B SSH 키 송신',
 'SFTP','ftp-vendor-b.external',22022,'eai_vendor_b',
 NULL,'/opt/eai/keys/vendor_b_rsa',
 'ENCRYPTED:U2FsdGVkX1+file_vendor_b_key_010==',
 '/receive/po',NULL,'/tmp/eai/vendor_b',
 NULL,'/tmp/eai/vendor_b/error',
 'ORDER_{yyyyMMdd}_B_{seq}.CSV','CSV','UTF-8','\t',
 TRUE,0,NULL,1000,15000,FALSE,
 '협력사B 비표준 포트 22022, 탭 구분자 CSV'),

-- 11) 회계 마감 Excel 수신 (월 1회, 2시간 폴링)
('IF-1019','회계 마감 Excel 수신',
 'SFTP','accounting-sftp.internal',22,'eai_recv_acc',
 'ENCRYPTED:U2FsdGVkX1+file_acc_011==',NULL,NULL,
 NULL,'/accounting/closing','/tmp/eai/accounting',
 '/accounting/closing/done','/accounting/closing/error',
 'CLOSING_{yyyyMM}.XLSX','EXCEL','UTF-8',NULL,
 TRUE,0,7200,3000,10000,FALSE,
 '월말 회계 마감 데이터 Excel, 2시간 폴링'),

-- 12) IoT 센서 배치 JSON 수신 (대용량, 5분 폴링, 처리 후 삭제)
('IF-1014','IoT 센서 배치 JSON 파일 수신',
 'SFTP','iot-sftp.internal',22,'eai_recv_iot',
 'ENCRYPTED:U2FsdGVkX1+file_iot_012==',NULL,NULL,
 NULL,'/iot/batch/upload','/tmp/eai/iot',
 '/iot/batch/done','/iot/batch/error',
 'IOT_BATCH_{yyyyMMddHH}{mm}.JSON','JSON','UTF-8',NULL,
 FALSE,0,300,20000,10000,TRUE,
 'IoT 설비 10분 배치 센서 데이터, 5분 폴링, 처리 후 삭제');


-- ============================================================
-- 6. 등록 결과 확인 조회 (MariaDB 호환)
--    STRING_AGG → GROUP_CONCAT 으로 변경
-- ============================================================

-- 테이블별 건수 확인
SELECT 'eai_datasource'         AS table_name, COUNT(*) AS cnt FROM eai_datasource
UNION ALL
SELECT 'eai_db_adapter_config',  COUNT(*) FROM eai_db_adapter_config
UNION ALL
SELECT 'eai_rest_config',        COUNT(*) FROM eai_rest_config
UNION ALL
SELECT 'eai_soap_config',        COUNT(*) FROM eai_soap_config
UNION ALL
SELECT 'eai_file_config',        COUNT(*) FROM eai_file_config;

-- 인터페이스별 어댑터 설정 현황
SELECT
    d.interface_id,
    d.name                       AS 인터페이스명,
    d.adapter_type               AS 타입,
    COALESCE(db.statement_id,'') AS DB설정,
    COALESCE(r.url,'')           AS REST_URL,
    COALESCE(s.wsdl_url,'')      AS SOAP_WSDL,
    COALESCE(f.file_pattern,'')  AS FILE패턴
FROM eai_interface_def d
LEFT JOIN eai_db_adapter_config db ON db.interface_id = d.interface_id
LEFT JOIN eai_rest_config        r  ON r.interface_id  = d.interface_id
LEFT JOIN eai_soap_config        s  ON s.interface_id  = d.interface_id
LEFT JOIN eai_file_config        f  ON f.interface_id  = d.interface_id
WHERE d.interface_id IN (
    'IF-1001','IF-1002','IF-1003','IF-1004','IF-1005','IF-1006',
    'IF-1007','IF-1008','IF-1009','IF-1010','IF-1011','IF-1012',
    'IF-1013','IF-1014','IF-1015','IF-1018','IF-1019','IF-1020'
)
ORDER BY d.interface_id;

-- DataSource 연결 현황
SELECT
    datasource_id,
    datasource_name,
    db_type,
    db_username,
    CONCAT(pool_min_size,'/',pool_max_size) AS pool_range,
    query_timeout_sec                       AS timeout_sec,
    is_active
FROM eai_datasource
ORDER BY datasource_id;

-- SOAP WS-Security 유형별 현황 (MariaDB: GROUP_CONCAT)
SELECT
    ws_security_type,
    COUNT(*)                                  AS 건수,
    GROUP_CONCAT(interface_id ORDER BY interface_id SEPARATOR ', ') AS 인터페이스목록
FROM eai_soap_config
GROUP BY ws_security_type;

-- FILE 어댑터 프로토콜 / 포맷 현황 (MariaDB: GROUP_CONCAT)
SELECT
    protocol,
    file_format,
    COUNT(*)                                  AS 건수,
    GROUP_CONCAT(interface_id ORDER BY interface_id SEPARATOR ', ') AS 인터페이스목록
FROM eai_file_config
GROUP BY protocol, file_format
ORDER BY protocol, file_format;

-- REST 인증 방식별 현황
SELECT
    auth_type,
    COUNT(*)                                  AS 건수,
    GROUP_CONCAT(interface_id ORDER BY interface_id SEPARATOR ', ') AS 인터페이스목록
FROM eai_rest_config
GROUP BY auth_type
ORDER BY auth_type;
