# Backend EAI 개발 요청 스크립트 (IntelliJ)
> 기존 포탈(사용자/메뉴 관리) Spring Boot 프로젝트에 EAI 모듈을 추가 개발하는 요청입니다.

---

## 전제 조건 (IntelliJ에 전달할 컨텍스트)

```
현재 프로젝트는 Spring Boot 3.x 기반 멀티모듈 또는 단일모듈 구조입니다.
사용자 인증(JWT), 메뉴 관리, 공통 응답 구조(ApiResponse), 예외 처리(GlobalExceptionHandler),
JPA/MyBatis 설정, Kafka 설정이 이미 구성되어 있습니다.
기존 패키지 구조와 네이밍 컨벤션을 따르며, EAI 관련 클래스를 추가해 주세요.
```

---

## 요청 1 — 패키지 구조 추가

```
기존 com.example.portal 패키지 아래에 eai 하위 패키지를 추가해 주세요.

com.saffron.eai/
├── controller/
│   ├── EaiInterfaceController.java    # 인터페이스 CRUD REST API
│   ├── EaiMessageController.java      # 메시지 이력 조회/재처리 API
│   ├── EaiMonitoringController.java   # SSE 모니터링 스트림 API
│   ├── EaiScheduleController.java     # 스케줄 조회/즉시실행 API
│   └── EaiAdapterController.java      # 어댑터 설정 CRUD API
├── service/
│   ├── WorkflowEngine.java            # 핵심 워크플로우 처리 엔진
│   ├── EaiInterfaceService.java       # 인터페이스 관리 서비스
│   ├── EaiMessageService.java         # 메시지 이력 저장/조회 서비스
│   ├── EaiMonitoringService.java      # 모니터링 지표 수집 서비스
│   ├── EaiSchedulerService.java       # 스케줄 등록/관리 서비스
│   └── MessageTransformer.java        # 메시지 변환(JSON↔XML, 필드매핑) 서비스
├── adapter/
│   ├── EaiAdapter.java                # 어댑터 인터페이스
│   ├── AbstractEaiAdapter.java        # 공통 기능 추상 클래스
│   ├── RestAdapter.java               # HTTP REST 어댑터
│   ├── SoapAdapter.java               # SOAP/WSDL 어댑터
│   ├── DbAdapter.java                 # JDBC/MyBatis DB 어댑터
│   ├── FileAdapter.java               # FTP/SFTP 파일 어댑터
│   └── AdapterFactory.java            # 타입별 어댑터 선택 팩토리
├── kafka/
│   ├── EaiMessageConsumer.java        # Kafka 메시지 수신 컨슈머
│   └── EaiMessageProducer.java        # Kafka 메시지 발행 프로듀서
├── scheduler/
│   └── EaiBatchScheduler.java         # Cron 기반 Pull 배치 스케줄러
├── domain/
│   ├── EaiInterfaceDef.java           # 인터페이스 정의 엔티티
│   ├── EaiAdapterConfig.java          # 어댑터 설정 엔티티
│   ├── EaiMappingRule.java            # 변환 매핑 규칙 엔티티
│   ├── EaiRoutingRule.java            # 라우팅 규칙 엔티티
│   ├── EaiMessageHistory.java         # 메시지 이력 엔티티
│   └── EaiSchedule.java               # 스케줄 엔티티
├── repository/
│   ├── EaiInterfaceRepository.java
│   ├── EaiAdapterConfigRepository.java
│   ├── EaiMessageHistoryRepository.java
│   └── EaiScheduleRepository.java
├── dto/
│   ├── request/
│   │   ├── InterfaceCreateRequest.java
│   │   ├── AdapterConfigRequest.java
│   │   └── MappingRuleRequest.java
│   └── response/
│       ├── InterfaceResponse.java
│       ├── MessageHistoryResponse.java
│       └── DashboardSnapshotResponse.java
└── common/
    ├── EaiMessage.java                # 내부 메시지 전달 객체
    ├── EaiResponse.java               # 어댑터 응답 객체
    └── EaiAdapterException.java       # 어댑터 예외 클래스
```

---

## 요청 2 — EaiAdapter 인터페이스

```java
// com.saffron.eai.adapter.EaiAdapter.java
// 모든 어댑터가 구현해야 하는 인터페이스입니다.

package com.saffron.eai.adapter;

import com.saffron.eai.common.EaiMessage;
import com.saffron.eai.common.EaiResponse;

public interface EaiAdapter {

    /** 메시지 전송 (Push/Pull 모두 사용) */
    EaiResponse send(EaiMessage message) throws EaiAdapterException;

    /** 메시지 수신 - Pull 방식에서 Source에서 데이터 가져오기 */
    java.util.List<EaiMessage> receive(String interfaceId) throws EaiAdapterException;

    /** 연결 상태 확인 */
    HealthStatus checkHealth();

    /** 어댑터 타입 반환 */
    AdapterType getType();

    enum AdapterType { REST, SOAP, DB, FILE }

    enum HealthStatus { UP, DOWN, UNKNOWN }
}
```

---

## 요청 3 — AbstractEaiAdapter (공통 기능)

```java
// com.saffron.eai.adapter.AbstractEaiAdapter.java

package com.saffron.eai.adapter;

import com.saffron.eai.common.EaiMessage;
import com.saffron.eai.domain.EaiMessageHistory;
import com.saffron.eai.repository.EaiMessageHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;

@Slf4j
public abstract class AbstractEaiAdapter implements EaiAdapter {

    @Autowired
    private EaiMessageHistoryRepository historyRepository;

    @Autowired
    private AesEncryptor aesEncryptor;

    // ── 공통: 표준 헤더 생성 ──
    protected EaiMessage.Header buildHeader(EaiMessage msg) {
        return EaiMessage.Header.builder()
            .messageId(java.util.UUID.randomUUID().toString())
            .interfaceId(msg.getInterfaceId())
            .sendSystem(msg.getSourceSystem())
            .sendTimestamp(java.time.LocalDateTime.now())
            .build();
    }

    // ── 공통: AES-256 암호화 ──
    protected String encrypt(String data) {
        return aesEncryptor.encrypt(data);
    }

    protected String decrypt(String data) {
        return aesEncryptor.decrypt(data);
    }

    // ── 공통: 처리 이력 저장 ──
    protected void saveHistory(EaiMessage message, EaiResponse response, String status) {
        EaiMessageHistory history = EaiMessageHistory.builder()
            .interfaceId(message.getInterfaceId())
            .direction(message.getDirection())
            .sourceSystem(message.getSourceSystem())
            .targetSystem(message.getTargetSystem())
            .messageBody(message.getPayload())
            .responseBody(response != null ? response.getBody() : null)
            .status(status)
            .processingMs(response != null ? response.getProcessingMs() : 0)
            .createdAt(java.time.LocalDateTime.now())
            .build();
        historyRepository.save(history);
    }

    // ── 공통: 로깅 ──
    protected void logTransaction(EaiMessage msg, EaiResponse resp) {
        log.info("[EAI] interfaceId={} direction={} status={} processingMs={}",
            msg.getInterfaceId(), msg.getDirection(),
            resp.getStatus(), resp.getProcessingMs());
    }
}
```

---

## 요청 4 — RestAdapter 구현

```java
// com.saffron.eai.adapter.RestAdapter.java
// WebClient 기반 비동기 HTTP 어댑터입니다.

package com.saffron.eai.adapter;

import com.saffron.eai.common.EaiMessage;
import com.saffron.eai.common.EaiResponse;
import com.saffron.eai.domain.EaiAdapterConfig;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;

@Component("restAdapter")
public class RestAdapter extends AbstractEaiAdapter {

    private final WebClient webClient;
    private final TokenProvider tokenProvider;

    public RestAdapter(WebClient.Builder builder, TokenProvider tokenProvider) {
        this.webClient = builder.build();
        this.tokenProvider = tokenProvider;
    }

    @Override
    public EaiResponse send(EaiMessage message) throws EaiAdapterException {
        EaiAdapterConfig config = message.getEndpointConfig();
        long startMs = System.currentTimeMillis();

        try {
            String responseBody = webClient
                .method(HttpMethod.valueOf(config.getHttpMethod()))
                .uri(config.getUrl())
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + tokenProvider.getToken(config))
                .bodyValue(message.getPayload())
                .retrieve()
                .onStatus(status -> status.isError(), resp ->
                    resp.bodyToMono(String.class)
                        .flatMap(body -> reactor.core.publisher.Mono.error(
                            new EaiAdapterException("HTTP 오류: " + resp.statusCode() + " - " + body)))
                )
                .bodyToMono(String.class)
                .timeout(Duration.ofMillis(config.getTimeoutMs() != null ? config.getTimeoutMs() : 5000))
                .block();

            EaiResponse response = EaiResponse.success(responseBody, System.currentTimeMillis() - startMs);
            saveHistory(message, response, "SUCCESS");
            return response;

        } catch (Exception e) {
            EaiResponse errResp = EaiResponse.fail(e.getMessage(), System.currentTimeMillis() - startMs);
            saveHistory(message, errResp, "FAIL");
            throw new EaiAdapterException("REST 전송 실패: " + e.getMessage(), e);
        }
    }

    @Override
    public List<EaiMessage> receive(String interfaceId) throws EaiAdapterException {
        // Pull 방식: GET 요청으로 Source에서 데이터 수신
        // 구현 시 lastRunAt 이후 변경된 데이터만 조회하도록 파라미터 추가
        throw new UnsupportedOperationException("REST Pull은 스케줄러에서 직접 처리");
    }

    @Override
    public HealthStatus checkHealth() {
        try {
            webClient.get().uri("/health").retrieve().toBodilessEntity()
                .timeout(Duration.ofSeconds(3)).block();
            return HealthStatus.UP;
        } catch (Exception e) {
            return HealthStatus.DOWN;
        }
    }

    @Override
    public AdapterType getType() { return AdapterType.REST; }
}
```

---

## 요청 5 — DbAdapter 구현

```java
// com.saffron.eai.adapter.DbAdapter.java
// MyBatis SqlSession 기반 DB 직접 연동 어댑터입니다.

@Component("dbAdapter")
public class DbAdapter extends AbstractEaiAdapter {

    // 여러 DataSource를 키(datasourceId)로 관리
    private final Map<String, SqlSessionFactory> sessionFactories;

    public DbAdapter(Map<String, SqlSessionFactory> sessionFactories) {
        this.sessionFactories = sessionFactories;
    }

    @Override
    public EaiResponse send(EaiMessage message) throws EaiAdapterException {
        EaiAdapterConfig config = message.getEndpointConfig();
        SqlSessionFactory factory = sessionFactories.get(config.getDatasourceId());
        if (factory == null) throw new EaiAdapterException("DataSource 미등록: " + config.getDatasourceId());

        long startMs = System.currentTimeMillis();
        try (SqlSession session = factory.openSession()) {
            Map<String, Object> params = objectMapper.readValue(message.getPayload(), Map.class);
            Object result;

            switch (config.getOperationType()) {
                case "QUERY"     -> result = session.selectList(config.getStatementId(), params);
                case "INSERT"    -> { result = session.insert(config.getStatementId(), params); session.commit(); }
                case "UPDATE"    -> { result = session.update(config.getStatementId(), params); session.commit(); }
                case "PROCEDURE" -> result = callProcedure(session, config, params);
                default -> throw new EaiAdapterException("미지원 작업: " + config.getOperationType());
            }

            String resultJson = objectMapper.writeValueAsString(result);
            EaiResponse response = EaiResponse.success(resultJson, System.currentTimeMillis() - startMs);
            saveHistory(message, response, "SUCCESS");
            return response;

        } catch (EaiAdapterException e) {
            throw e;
        } catch (Exception e) {
            throw new EaiAdapterException("DB 처리 실패: " + e.getMessage(), e);
        }
    }

    @Override
    public List<EaiMessage> receive(String interfaceId) throws EaiAdapterException {
        // Pull 방식: SELECT로 미처리 레코드 조회 후 EaiMessage 변환
        // 조회 후 처리완료 플래그 업데이트 처리 포함
        return List.of(); // 실제 구현 시 인터페이스별 쿼리 수행
    }

    @Override
    public AdapterType getType() { return AdapterType.DB; }
}
```

---

## 요청 6 — WorkflowEngine (핵심 처리 엔진)

```java
// com.saffron.eai.service.WorkflowEngine.java
// 메시지 수신 → 검증 → 변환 → 라우팅 → 어댑터 전송 → 이력 저장

@Service
@Slf4j
@RequiredArgsConstructor
public class WorkflowEngine {

    private final AdapterFactory adapterFactory;
    private final MessageTransformer transformer;
    private final MessageValidator validator;
    private final EaiInterfaceService interfaceService;
    private final EaiMessageHistoryRepository historyRepo;
    private final KafkaTemplate<String, EaiMessage> kafkaTemplate;
    private final AlertService alertService;

    @Retryable(
        value = { TransientException.class },
        maxAttempts = 3,
        backoff = @Backoff(delay = 1000, multiplier = 2, maxDelay = 8000)
    )
    public void execute(EaiMessage message) {
        log.info("[Workflow] START interfaceId={}", message.getInterfaceId());

        // 1. 인터페이스 설정 로드 (Redis 캐시 우선)
        EaiInterfaceDef def = interfaceService.loadWithCache(message.getInterfaceId());
        if (!def.isActive()) {
            log.warn("[Workflow] 비활성 인터페이스 수신 무시: {}", message.getInterfaceId());
            return;
        }

        // 2. 유효성 검사
        ValidationResult validation = validator.validate(message, def.getValidationRules());
        if (!validation.isValid()) {
            kafkaTemplate.send("eai.interface.dlq", message);
            alertService.sendValidationAlert(message, validation.getErrors());
            return;
        }

        // 3. 메시지 변환
        EaiMessage transformed = transformer.transform(message, def.getMappingRules());

        // 4. 라우팅 → 어댑터 전송 (순차 또는 병렬)
        List<EaiAdapterConfig> targets = def.getRoutingRules().stream()
            .filter(r -> evaluateCondition(r.getConditionExpr(), transformed))
            .map(r -> interfaceService.getAdapterConfig(r.getTargetAdapterId()))
            .collect(Collectors.toList());

        if (def.isParallel()) {
            sendParallel(transformed, targets);
        } else {
            sendSequential(transformed, targets);
        }

        log.info("[Workflow] END interfaceId={}", message.getInterfaceId());
    }

    @Recover
    public void onMaxRetryExceeded(Exception e, EaiMessage message) {
        log.error("[Workflow] 최대 재시도 초과 → DLQ 발행: {}", message.getInterfaceId(), e);
        kafkaTemplate.send("eai.interface.dlq", message);
        alertService.sendRetryExhaustedAlert(message, e);
    }

    private void sendSequential(EaiMessage message, List<EaiAdapterConfig> targets) {
        for (EaiAdapterConfig target : targets) {
            EaiAdapter adapter = adapterFactory.getAdapter(target.getAdapterType());
            message.setEndpointConfig(target);
            adapter.send(message);
        }
    }

    private void sendParallel(EaiMessage message, List<EaiAdapterConfig> targets) {
        targets.parallelStream().forEach(target -> {
            EaiAdapter adapter = adapterFactory.getAdapter(target.getAdapterType());
            EaiMessage copy = message.copy();
            copy.setEndpointConfig(target);
            adapter.send(copy);
        });
    }

    private boolean evaluateCondition(String spEL, EaiMessage message) {
        if (spEL == null || spEL.isBlank()) return true;
        StandardEvaluationContext ctx = new StandardEvaluationContext(message);
        return Boolean.TRUE.equals(new SpelExpressionParser().parseExpression(spEL).getValue(ctx, Boolean.class));
    }
}
```

---

## 요청 7 — Kafka Consumer / Producer

```java
// com.saffron.eai.kafka.EaiMessageConsumer.java

@Component
@Slf4j
@RequiredArgsConstructor
public class EaiMessageConsumer {

    private final WorkflowEngine workflowEngine;
    private final KafkaTemplate<String, EaiMessage> kafkaTemplate;
    private final AlertService alertService;
    private final EaiMessageHistoryRepository historyRepo;

    // 정상 처리 토픽
    @KafkaListener(
        topics = "eai.interface.request",
        groupId = "eai-workflow-engine",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(@Payload EaiMessage message,
                        @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
                        @Header(KafkaHeaders.OFFSET) long offset,
                        Acknowledgment ack) {
        log.info("[Consumer] 수신 interfaceId={} partition={} offset={}", message.getInterfaceId(), partition, offset);
        try {
            workflowEngine.execute(message);
            ack.acknowledge(); // 처리 성공 후 수동 커밋
        } catch (NonRetryableException e) {
            kafkaTemplate.send("eai.interface.dlq", message);
            ack.acknowledge();
        } catch (Exception e) {
            log.error("[Consumer] 처리 실패, 재시도 예정: {}", e.getMessage());
            // 커밋 안 함 → Kafka 자동 재시도
        }
    }

    // DLQ 처리 토픽
    @KafkaListener(topics = "eai.interface.dlq", groupId = "eai-dlq-processor")
    public void consumeDlq(@Payload EaiMessage message, Acknowledgment ack) {
        log.warn("[DLQ] 수신 interfaceId={}", message.getInterfaceId());
        alertService.sendDlqAlert(message);
        historyRepo.markAsDlq(message.getMessageId());
        ack.acknowledge();
    }
}

// com.saffron.eai.kafka.EaiMessageProducer.java
@Component
@RequiredArgsConstructor
public class EaiMessageProducer {

    private final KafkaTemplate<String, EaiMessage> kafkaTemplate;

    // Push 방식: Source가 REST로 전송 시 즉시 Kafka 발행
    public void publishRequest(EaiMessage message) {
        // 파티션 키: interfaceId (동일 인터페이스는 같은 파티션 → 순서 보장)
        kafkaTemplate.send("eai.interface.request", message.getInterfaceId(), message);
    }

    public void publishResponse(EaiMessage message) {
        kafkaTemplate.send("eai.interface.response", message.getInterfaceId(), message);
    }
}
```

---

## 요청 8 — REST Controller (인터페이스 관리)

```java
// com.saffron.eai.controller.EaiInterfaceController.java

@RestController
@RequestMapping("/api/eai/interfaces")
@RequiredArgsConstructor
public class EaiInterfaceController {

    private final EaiInterfaceService interfaceService;
    private final EaiMessageProducer producer;

    // 목록 조회 (페이징 + 필터)
    @GetMapping
    public ApiResponse<Page<InterfaceResponse>> list(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String adapterType,
        @RequestParam(required = false) String keyword,
        Pageable pageable) {
        return ApiResponse.ok(interfaceService.findAll(status, adapterType, keyword, pageable));
    }

    // 단건 조회
    @GetMapping("/{id}")
    public ApiResponse<InterfaceResponse> get(@PathVariable Long id) {
        return ApiResponse.ok(interfaceService.findById(id));
    }

    // 등록
    @PostMapping
    public ApiResponse<InterfaceResponse> create(@RequestBody @Valid InterfaceCreateRequest req) {
        return ApiResponse.ok(interfaceService.create(req));
    }

    // 수정
    @PutMapping("/{id}")
    public ApiResponse<InterfaceResponse> update(@PathVariable Long id,
                                                   @RequestBody @Valid InterfaceCreateRequest req) {
        return ApiResponse.ok(interfaceService.update(id, req));
    }

    // 활성/비활성 토글
    @PatchMapping("/{id}/toggle")
    public ApiResponse<Void> toggle(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        interfaceService.toggle(id, body.get("isActive"));
        return ApiResponse.ok(null);
    }

    // Push 방식: Source가 직접 EAI에 데이터 전송
    @PostMapping("/receive/{interfaceId}")
    public ApiResponse<Void> receive(@PathVariable String interfaceId,
                                      @RequestBody String payload) {
        EaiMessage message = EaiMessage.builder()
            .interfaceId(interfaceId)
            .payload(payload)
            .direction("RECEIVE")
            .build();
        producer.publishRequest(message); // Kafka 비동기 발행 → 즉시 200 반환
        return ApiResponse.ok(null);
    }

    // 테스트 전송
    @PostMapping("/{interfaceId}/test")
    public ApiResponse<EaiResponse> test(@PathVariable String interfaceId,
                                          @RequestBody Map<String, String> body) {
        return ApiResponse.ok(interfaceService.testSend(interfaceId, body.get("payload")));
    }
}
```

---

## 요청 9 — SSE 모니터링 컨트롤러

```java
// com.saffron.eai.controller.EaiMonitoringController.java

@RestController
@RequestMapping("/api/eai/monitoring")
@RequiredArgsConstructor
public class EaiMonitoringController {

    private final EaiMonitoringService monitoringService;

    // SSE: 5초마다 대시보드 스냅샷 전송 (Frontend EventSource 구독)
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<DashboardSnapshotResponse> stream() {
        return Flux.interval(java.time.Duration.ofSeconds(5))
            .map(tick -> monitoringService.getSnapshot())
            .share();
    }

    // 현재 스냅샷 단건 조회
    @GetMapping("/snapshot")
    public ApiResponse<DashboardSnapshotResponse> snapshot() {
        return ApiResponse.ok(monitoringService.getSnapshot());
    }

    // 인터페이스별 처리 통계
    @GetMapping("/stats/{interfaceId}")
    public ApiResponse<InterfaceStatsResponse> stats(@PathVariable String interfaceId,
                                                      @RequestParam String period) {
        return ApiResponse.ok(monitoringService.getStats(interfaceId, period));
    }
}
```

---

## 요청 10 — application.yml EAI 설정 추가

```yaml
# 기존 application.yml에 아래 설정을 추가해 주세요.

spring:
  kafka:
    bootstrap-servers: ${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      acks: all
      retries: 3
      properties:
        enable.idempotence: true
    consumer:
      group-id: eai-workflow-engine
      auto-offset-reset: earliest
      enable-auto-commit: false
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        spring.json.trusted.packages: "com.saffron.eai.*"
    listener:
      ack-mode: MANUAL_IMMEDIATE
      concurrency: 3

eai:
  adapter:
    rest:
      default-timeout-ms: 5000
      max-retry: 3
    sftp:
      known-hosts-file: ${user.home}/.ssh/known_hosts
  cache:
    interface-ttl-seconds: 300   # Redis 캐시 TTL 5분
  kafka:
    request-topic: eai.interface.request
    response-topic: eai.interface.response
    dlq-topic: eai.interface.dlq
  encrypt:
    aes-key: ${EAI_AES_KEY}      # 환경변수로 주입
  monitoring:
    lag-threshold: 1000
    dlq-threshold: 100
```

---

## 요청 11 — 의존성 추가 (build.gradle 또는 pom.xml)

```gradle
// build.gradle에 아래 의존성을 추가해 주세요.

dependencies {
    // Kafka
    implementation 'org.springframework.kafka:spring-kafka'

    // WebFlux (WebClient + SSE)
    implementation 'org.springframework.boot:spring-boot-starter-webflux'

    // Retry
    implementation 'org.springframework.retry:spring-retry'
    implementation 'org.springframework:spring-aspects'

    // SFTP (FileAdapter)
    implementation 'com.jcraft:jsch:0.1.55'

    // SOAP (SoapAdapter)
    implementation 'org.springframework.ws:spring-ws-core'

    // Redis (설정 캐싱)
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'

    // SpEL (라우팅 조건 평가)
    // Spring Core에 포함되어 있어 별도 추가 불필요

    // MyBatis (DbAdapter)
    implementation 'org.mybatis.spring.boot:mybatis-spring-boot-starter:3.0.3'
}
```
