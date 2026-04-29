# Web EAI 상세 설계 가이드

> 워크플로우 엔진 · Admin 화면 · Kafka 구성 · Adapter 구성 상세

---

## 목차

1. [워크플로우 엔진 상세](#1-%EC%9B%8C%ED%81%AC%ED%94%8C%EB%A1%9C%EC%9A%B0-%EC%97%94%EC%A7%84-%EC%83%81%EC%84%B8)
2. [Kafka 구성 상세](#2-kafka-%EA%B5%AC%EC%84%B1-%EC%83%81%EC%84%B8)
3. [Adapter 구성 상세](#3-adapter-%EA%B5%AC%EC%84%B1-%EC%83%81%EC%84%B8)
4. [Admin 화면 설계](#4-admin-%ED%99%94%EB%A9%B4-%EC%84%A4%EA%B3%84)

---

## 1. 워크플로우 엔진 상세

### 1.1 처리 흐름

```
이벤트 수신
    │
    ▼
인터페이스 메타데이터 조회 (DB → 라우팅·변환 규칙 로드)
    │
    ▼
유효성 검사 ──[실패]──▶ 오류 처리 (DLQ / 알람)
    │[통과]
    ▼
메시지 변환 Transform (JSON↔XML, 필드 매핑, 인코딩)
    │
    ▼
라우팅 Router (조건 분기 / 병렬 / 순차 전송)
    │
    ▼
어댑터 전송 ──[실패]──▶ 재시도 (최대 3회 지수 백오프)
    │[성공]                  │
    ▼                       └──▶ 재시도 루프 (3회 초과 시 DLQ)
이력 저장 & 완료
```

### 1.2 워크플로우 노드 타입

노드 타입설명구현**Start**이벤트 수신 트리거Kafka Consumer, HTTP Webhook, Cron**Validate**스키마/비즈니스 규칙 검사JsonSchema, 커스텀 Validator**Transform**메시지 변환·매핑Jackson, XSLT, MapStruct**Router**조건 기반 분기SpEL 표현식**Splitter**1:N 메시지 분할배열 분해 후 병렬 전송**Aggregator**N:1 메시지 집계응답 수집 후 병합**Adapter**외부 시스템 호출AdapterFactory 패턴**End**완료 처리·이력 저장DB Insert

### 1.3 워크플로우 엔진 핵심 코드

```java
// 워크플로우 정의 (메타데이터 기반 동적 구성)
@Service
public class WorkflowEngine {

    private final AdapterFactory adapterFactory;
    private final MessageTransformer transformer;
    private final MessageValidator validator;
    private final HistoryRepository historyRepo;

    public void execute(EaiMessage message) {
        InterfaceDef def = loadInterfaceDef(message.getInterfaceId());

        // 1. 유효성 검사
        ValidationResult result = validator.validate(message, def.getValidationRules());
        if (!result.isValid()) {
            handleError(message, result.getErrors());
            return;
        }

        // 2. 메시지 변환
        EaiMessage transformed = transformer.transform(message, def.getMappingRules());

        // 3. 라우팅 결정
        List<RouteTarget> targets = router.resolve(transformed, def.getRoutingRules());

        // 4. 어댑터 전송 (병렬/순차 선택)
        if (def.isParallel()) {
            sendParallel(transformed, targets);
        } else {
            sendSequential(transformed, targets);
        }

        // 5. 이력 저장
        historyRepo.save(MessageHistory.of(message, STATUS.SUCCESS));
    }

    private void sendWithRetry(EaiMessage msg, RouteTarget target) {
        RetryTemplate retry = RetryTemplate.builder()
            .maxAttempts(3)
            .exponentialBackoff(1000, 2, 8000)   // 1초→2초→4초 지수 백오프
            .retryOn(TransientException.class)
            .build();

        retry.execute(ctx -> {
            EaiAdapter adapter = adapterFactory.getAdapter(target.getAdapterType());
            return adapter.send(msg);
        }, ctx -> {
            // 3회 실패 시 DLQ 발행
            kafkaTemplate.send("eai.interface.dlq", msg);
            alertService.sendFailAlert(msg, ctx.getLastThrowable());
            return null;
        });
    }
}
```

### 1.4 메시지 변환 규칙 (DB 기반 동적 매핑)

```sql
-- 변환 매핑 규칙 테이블
CREATE TABLE eai_mapping_rule (
    id              BIGSERIAL PRIMARY KEY,
    interface_id    VARCHAR(50) NOT NULL,
    source_path     VARCHAR(200),   -- 예: $.order.orderId
    target_path     VARCHAR(200),   -- 예: /Order/OrderNo
    transform_type  VARCHAR(50),    -- COPY, CONCAT, FORMAT, CODE_MAP
    transform_expr  VARCHAR(500),   -- 변환 표현식 (SpEL)
    sort_order      INT DEFAULT 0
);

-- 라우팅 규칙 테이블
CREATE TABLE eai_routing_rule (
    id              BIGSERIAL PRIMARY KEY,
    interface_id    VARCHAR(50) NOT NULL,
    condition_expr  VARCHAR(500),   -- SpEL: payload.status == 'NEW'
    target_adapter  VARCHAR(50),    -- REST, SOAP, DB, FILE
    target_endpoint VARCHAR(500),   -- 실제 엔드포인트 URL/DSN
    is_parallel     BOOLEAN DEFAULT FALSE,
    sort_order      INT DEFAULT 0
);
```

### 1.5 오류 처리 전략

오류 유형처리 방식재시도DLQ네트워크 타임아웃지수 백오프 재시도최대 3회3회 초과 시HTTP 5xx 오류즉시 재시도최대 3회3회 초과 시HTTP 4xx 오류재시도 없음없음즉시변환 오류재시도 없음없음즉시DB 연결 오류Circuit Breaker5회5회 초과 시

---

## 2. Kafka 구성 상세

### 2.1 토픽 설계

토픽명파티션복제본보존 기간용도`eai.interface.request`337일신규 인터페이스 요청`eai.interface.response`337일처리 결과 응답`eai.interface.dlq`3330일실패 메시지 보관`eai.interface.audit`1390일감사 로그`eai.alert.notify`121일실시간 알람

### 2.2 파티셔닝 전략

```
파티션 키: interfaceId (인터페이스 ID)
→ 동일 인터페이스의 메시지는 항상 같은 파티션으로 → 순서 보장

예시:
  IF-0041 (주문 ERP) → partition 0
  IF-0038 (재고 동기화) → partition 1
  IF-0027 (고객 연동) → partition 2
```

### 2.3 Kafka 클러스터 설정 (application.yml)

```yaml
spring:
  kafka:
    bootstrap-servers: kafka-1:9092,kafka-2:9092,kafka-3:9092

    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      acks: all                     # 모든 복제본 확인 후 승인 (데이터 유실 방지)
      retries: 3
      properties:
        enable.idempotence: true    # 중복 메시지 방지
        max.in.flight.requests.per.connection: 1

    consumer:
      group-id: eai-workflow-engine
      auto-offset-reset: earliest
      enable-auto-commit: false     # 수동 커밋 (처리 완료 후 커밋)
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        spring.json.trusted.packages: "com.eai.*"
        max.poll.records: 100       # 한 번에 최대 100건 처리

    listener:
      ack-mode: MANUAL_IMMEDIATE    # 수동 커밋
      concurrency: 3                # Consumer 스레드 수 = 파티션 수

# 토픽 자동 생성 설정
eai:
  kafka:
    topics:
      request:
        name: eai.interface.request
        partitions: 3
        replicas: 3
        retention-ms: 604800000     # 7일
      dlq:
        name: eai.interface.dlq
        partitions: 3
        replicas: 3
        retention-ms: 2592000000    # 30일
```

### 2.4 Consumer 구현

```java
@Component
public class EaiMessageConsumer {

    @KafkaListener(
        topics = "eai.interface.request",
        groupId = "eai-workflow-engine",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(
            @Payload EaiMessage message,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset,
            Acknowledgment ack) {

        try {
            log.info("Consuming message: interfaceId={}, partition={}, offset={}",
                message.getInterfaceId(), partition, offset);

            workflowEngine.execute(message);
            ack.acknowledge();  // 처리 성공 후 수동 커밋

        } catch (NonRetryableException e) {
            // 재시도 불필요한 오류 → 즉시 DLQ
            kafkaTemplate.send("eai.interface.dlq", message);
            ack.acknowledge();
        } catch (Exception e) {
            // 재시도 가능한 오류 → 커밋하지 않음 (자동 재시도)
            log.error("Processing failed, will retry: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "eai.interface.dlq", groupId = "eai-dlq-processor")
    public void consumeDlq(@Payload EaiMessage message, Acknowledgment ack) {
        // DLQ 메시지는 수동 재처리 대기 또는 알람 발송
        alertService.sendDlqAlert(message);
        historyRepo.markAsDlq(message.getMessageId());
        ack.acknowledge();
    }
}
```

### 2.5 Kafka 운영 체크리스트

```
클러스터 구성
  ✓ Broker 3대 이상 (홀수 권장)
  ✓ replication-factor: 3
  ✓ min.insync.replicas: 2
  ✓ unclean.leader.election.enable: false (데이터 일관성 우선)

모니터링 지표
  ✓ Consumer Lag (지연 메시지 수) → 임계치 초과 시 알람
  ✓ Broker JVM Heap 사용률
  ✓ 토픽별 처리량 (msg/sec)
  ✓ 파티션 리더 분포 (균등 분배 확인)

Schema Registry (선택)
  ✓ Confluent Schema Registry로 Avro 스키마 버전 관리
  ✓ 하위 호환성 보장 (BACKWARD 호환 정책)
```

---

## 3. Adapter 구성 상세

### 3.1 어댑터 인터페이스 계층 구조

```
EaiAdapter (interface)
  └── AbstractEaiAdapter (abstract) ← 공통: retry, logging, encrypt, header
        ├── RestAdapter       HTTP/HTTPS, OpenAPI 3.0
        ├── SoapAdapter       WSDL, WS-Security, MTOM
        ├── DbAdapter         JDBC, MyBatis, StoredProcedure
        └── FileAdapter       FTP, SFTP, CSV, Excel
```

### 3.2 EaiAdapter 인터페이스 정의

```java
public interface EaiAdapter {
    /** 메시지 전송 */
    EaiResponse send(EaiMessage message) throws EaiAdapterException;

    /** 메시지 수신 (폴링) */
    List<EaiMessage> receive(String interfaceId) throws EaiAdapterException;

    /** 연결 상태 확인 */
    HealthStatus checkHealth();

    /** 어댑터 타입 반환 */
    AdapterType getType();
}
```

### 3.3 AbstractEaiAdapter — 공통 기능

```java
public abstract class AbstractEaiAdapter implements EaiAdapter {

    // 공통: 암호화
    protected String encrypt(String data) {
        return aesEncryptor.encrypt(data);
    }

    // 공통: 표준 헤더 생성
    protected EaiHeader buildHeader(EaiMessage msg) {
        return EaiHeader.builder()
            .messageId(UUID.randomUUID().toString())
            .interfaceId(msg.getInterfaceId())
            .sendSystem(msg.getSourceSystem())
            .sendTimestamp(LocalDateTime.now())
            .build();
    }

    // 공통: 전송 이력 로깅
    protected void logTransaction(EaiMessage msg, EaiResponse resp) {
        transactionLogger.log(msg, resp);
    }
}
```

### 3.4 RestAdapter 구현

```java
@Component("restAdapter")
public class RestAdapter extends AbstractEaiAdapter {

    private final WebClient webClient;

    @Override
    public EaiResponse send(EaiMessage message) {
        RestEndpoint endpoint = (RestEndpoint) message.getEndpointConfig();

        return webClient.method(HttpMethod.valueOf(endpoint.getHttpMethod()))
            .uri(endpoint.getUrl())
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + tokenProvider.getToken(endpoint))
            .bodyValue(message.getPayload())
            .retrieve()
            .onStatus(HttpStatusCode::isError, resp ->
                resp.bodyToMono(String.class)
                    .flatMap(body -> Mono.error(new EaiAdapterException(resp.statusCode(), body)))
            )
            .bodyToMono(String.class)
            .map(body -> EaiResponse.success(body))
            .timeout(Duration.ofMillis(endpoint.getTimeoutMs()))
            .block();
    }
}
```

### 3.5 SoapAdapter 구현

```java
@Component("soapAdapter")
public class SoapAdapter extends AbstractEaiAdapter {

    private final WebServiceTemplate wsTemplate;

    @Override
    public EaiResponse send(EaiMessage message) {
        SoapEndpoint endpoint = (SoapEndpoint) message.getEndpointConfig();

        // WSDL → 자동 생성된 JAXBElement 사용
        JAXBElement<?> request = buildSoapRequest(message, endpoint.getWsdlClass());

        Object response = wsTemplate.marshalSendAndReceive(
            endpoint.getServiceUrl(), request,
            msg -> {
                SoapMessage soapMsg = (SoapMessage) msg;
                soapMsg.getSoapHeader()
                    .addHeaderElement(new QName("Authorization"))
                    .setText("Bearer " + endpoint.getToken());
            }
        );

        return EaiResponse.success(marshaller.marshal(response));
    }
}
```

### 3.6 DbAdapter 구현

```java
@Component("dbAdapter")
public class DbAdapter extends AbstractEaiAdapter {

    private final Map<String, SqlSessionFactory> sessionFactories;

    @Override
    public EaiResponse send(EaiMessage message) {
        DbEndpoint endpoint = (DbEndpoint) message.getEndpointConfig();
        SqlSessionFactory factory = sessionFactories.get(endpoint.getDataSourceId());

        try (SqlSession session = factory.openSession()) {
            Map<String, Object> params = jsonToMap(message.getPayload());

            Object result;
            switch (endpoint.getOperationType()) {
                case QUERY     -> result = session.selectList(endpoint.getStatementId(), params);
                case INSERT    -> result = session.insert(endpoint.getStatementId(), params);
                case UPDATE    -> result = session.update(endpoint.getStatementId(), params);
                case PROCEDURE -> result = callStoredProcedure(session, endpoint, params);
                default        -> throw new EaiAdapterException("지원하지 않는 DB 작업 유형");
            }
            session.commit();
            return EaiResponse.success(objectMapper.writeValueAsString(result));
        }
    }
}
```

### 3.7 FileAdapter 구현

```java
@Component("fileAdapter")
public class FileAdapter extends AbstractEaiAdapter {

    @Override
    public EaiResponse send(EaiMessage message) {
        FileEndpoint endpoint = (FileEndpoint) message.getEndpointConfig();

        try (ChannelSftp sftp = sftpSessionFactory.createSession(endpoint)) {

            // CSV 생성
            String csvContent = csvConverter.convert(message.getPayload());
            String fileName = buildFileName(endpoint.getFilePattern(), LocalDate.now());

            // SFTP 업로드 (임시파일 → 원자적 이동)
            String tempPath = endpoint.getRemotePath() + "/" + fileName + ".tmp";
            String finalPath = endpoint.getRemotePath() + "/" + fileName;

            sftp.put(new ByteArrayInputStream(csvContent.getBytes(StandardCharsets.UTF_8)), tempPath);
            sftp.rename(tempPath, finalPath);   // 원자적 이동 (반쪽 파일 방지)

            return EaiResponse.success("파일 전송 완료: " + finalPath);
        }
    }

    @Override
    public List<EaiMessage> receive(String interfaceId) {
        // SFTP 폴링: 완료 디렉토리 이동 후 처리 (중복 방지)
        return sftpPoller.pollAndMove(interfaceId);
    }
}
```

### 3.8 AdapterFactory — 동적 어댑터 선택

```java
@Component
public class AdapterFactory {

    private final Map<AdapterType, EaiAdapter> adapterMap;

    public AdapterFactory(List<EaiAdapter> adapters) {
        this.adapterMap = adapters.stream()
            .collect(Collectors.toMap(EaiAdapter::getType, a -> a));
    }

    public EaiAdapter getAdapter(AdapterType type) {
        EaiAdapter adapter = adapterMap.get(type);
        if (adapter == null) {
            throw new EaiAdapterException("등록되지 않은 어댑터 타입: " + type);
        }
        return adapter;
    }
}
```

### 3.9 어댑터 설정 DB 테이블

```sql
-- 어댑터 엔드포인트 설정 테이블
CREATE TABLE eai_adapter_config (
    id              BIGSERIAL PRIMARY KEY,
    interface_id    VARCHAR(50)  NOT NULL,
    adapter_type    VARCHAR(20)  NOT NULL,   -- REST, SOAP, DB, FILE
    -- REST 공통
    url             VARCHAR(500),
    http_method     VARCHAR(10),
    timeout_ms      INT DEFAULT 5000,
    -- 인증
    auth_type       VARCHAR(20),             -- BASIC, BEARER, API_KEY
    auth_value      VARCHAR(500),            -- 암호화 저장
    -- DB 전용
    datasource_id   VARCHAR(50),
    statement_id    VARCHAR(200),
    operation_type  VARCHAR(20),             -- QUERY, INSERT, UPDATE, PROCEDURE
    -- FILE 전용
    remote_host     VARCHAR(200),
    remote_path     VARCHAR(500),
    file_pattern    VARCHAR(200),
    -- 공통
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);
```

---
