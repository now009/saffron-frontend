# Kafka EAI 구성 가이드
> EAI 시스템을 위한 Kafka 클러스터 설치, 토픽 설계, 운영 설정

---

## 1. Kafka 설치 (Docker Compose 기준)

```yaml
# docker-compose-kafka.yml
# 로컬 개발환경 및 단일 서버 테스트용

version: '3.8'
services:

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: eai-zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"
    volumes:
      - zookeeper-data:/var/lib/zookeeper/data
      - zookeeper-log:/var/lib/zookeeper/log

  kafka-1:
    image: confluentinc/cp-kafka:7.5.0
    container_name: eai-kafka-1
    depends_on: [zookeeper]
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka-1:9092,PLAINTEXT_HOST://localhost:19092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 3
      KAFKA_DEFAULT_REPLICATION_FACTOR: 3
      KAFKA_MIN_INSYNC_REPLICAS: 2
      KAFKA_UNCLEAN_LEADER_ELECTION_ENABLE: "false"
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "false"   # 토픽 자동생성 비활성
      KAFKA_LOG_RETENTION_HOURS: 168             # 7일
      KAFKA_MESSAGE_MAX_BYTES: 10485760          # 10MB
    ports:
      - "19092:19092"
    volumes:
      - kafka-1-data:/var/lib/kafka/data

  kafka-2:
    image: confluentinc/cp-kafka:7.5.0
    container_name: eai-kafka-2
    depends_on: [zookeeper]
    environment:
      KAFKA_BROKER_ID: 2
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka-2:9092,PLAINTEXT_HOST://localhost:29092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 3
      KAFKA_DEFAULT_REPLICATION_FACTOR: 3
      KAFKA_MIN_INSYNC_REPLICAS: 2
      KAFKA_UNCLEAN_LEADER_ELECTION_ENABLE: "false"
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "false"
    ports:
      - "29092:29092"
    volumes:
      - kafka-2-data:/var/lib/kafka/data

  kafka-3:
    image: confluentinc/cp-kafka:7.5.0
    container_name: eai-kafka-3
    depends_on: [zookeeper]
    environment:
      KAFKA_BROKER_ID: 3
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka-3:9092,PLAINTEXT_HOST://localhost:39092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 3
      KAFKA_DEFAULT_REPLICATION_FACTOR: 3
      KAFKA_MIN_INSYNC_REPLICAS: 2
      KAFKA_UNCLEAN_LEADER_ELECTION_ENABLE: "false"
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "false"
    ports:
      - "39092:39092"
    volumes:
      - kafka-3-data:/var/lib/kafka/data

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    container_name: eai-kafka-ui
    depends_on: [kafka-1, kafka-2, kafka-3]
    ports:
      - "8989:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: eai-cluster
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka-1:9092,kafka-2:9092,kafka-3:9092

volumes:
  zookeeper-data:
  zookeeper-log:
  kafka-1-data:
  kafka-2-data:
  kafka-3-data:
```

### 실행

```bash
docker-compose -f docker-compose-kafka.yml up -d
docker-compose -f docker-compose-kafka.yml ps
```

---

## 2. 토픽 생성 스크립트

```bash
#!/bin/bash
# create-eai-topics.sh
# Kafka 클러스터에 EAI 필수 토픽을 생성합니다.

BOOTSTRAP=localhost:19092
REPLICATION=3
PARTITIONS=3

echo "=== EAI Kafka 토픽 생성 시작 ==="

# 1. 인터페이스 요청 토픽 (신규 메시지 수신)
docker exec eai-kafka-1 kafka-topics --create \
  --bootstrap-server $BOOTSTRAP \
  --topic eai.interface.request \
  --partitions $PARTITIONS \
  --replication-factor $REPLICATION \
  --config retention.ms=604800000 \
  --config min.insync.replicas=2 \
  --config message.timestamp.type=CreateTime
echo "✓ eai.interface.request 생성"

# 2. 인터페이스 응답 토픽 (처리 결과)
docker exec eai-kafka-1 kafka-topics --create \
  --bootstrap-server $BOOTSTRAP \
  --topic eai.interface.response \
  --partitions $PARTITIONS \
  --replication-factor $REPLICATION \
  --config retention.ms=604800000 \
  --config min.insync.replicas=2
echo "✓ eai.interface.response 생성"

# 3. DLQ 토픽 (실패 메시지 장기 보관)
docker exec eai-kafka-1 kafka-topics --create \
  --bootstrap-server $BOOTSTRAP \
  --topic eai.interface.dlq \
  --partitions $PARTITIONS \
  --replication-factor $REPLICATION \
  --config retention.ms=2592000000 \
  --config min.insync.replicas=2
echo "✓ eai.interface.dlq 생성"

# 4. 감사 로그 토픽 (장기 보관)
docker exec eai-kafka-1 kafka-topics --create \
  --bootstrap-server $BOOTSTRAP \
  --topic eai.interface.audit \
  --partitions 1 \
  --replication-factor $REPLICATION \
  --config retention.ms=7776000000
echo "✓ eai.interface.audit 생성"

# 5. 실시간 알람 토픽 (단기 보관)
docker exec eai-kafka-1 kafka-topics --create \
  --bootstrap-server $BOOTSTRAP \
  --topic eai.alert.notify \
  --partitions 1 \
  --replication-factor 2 \
  --config retention.ms=86400000
echo "✓ eai.alert.notify 생성"

echo ""
echo "=== 생성된 토픽 목록 ==="
docker exec eai-kafka-1 kafka-topics --list --bootstrap-server $BOOTSTRAP | grep eai
```

---

## 3. 토픽 설계

| 토픽명 | 파티션 | 복제본 | 보존 기간 | 파티션 키 | 용도 |
|--------|--------|--------|-----------|-----------|------|
| `eai.interface.request` | 3 | 3 | 7일 | interfaceId | 신규 인터페이스 처리 요청 |
| `eai.interface.response` | 3 | 3 | 7일 | interfaceId | 처리 결과 응답 |
| `eai.interface.dlq` | 3 | 3 | 30일 | interfaceId | 실패 메시지 보관 |
| `eai.interface.audit` | 1 | 3 | 90일 | interfaceId | 감사 로그 |
| `eai.alert.notify` | 1 | 2 | 1일 | - | 실시간 알람 |

**파티셔닝 전략**: `interfaceId`를 파티션 키로 사용 → 동일 인터페이스 메시지는 같은 파티션으로 → 순서 보장

---

## 4. Spring Boot Kafka 설정 (KafkaConfig.java)

```java
// com.example.portal.config.KafkaConfig.java

@Configuration
@EnableKafka
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    // ── Producer 설정 ──
    @Bean
    public ProducerFactory<String, EaiMessage> producerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        config.put(ProducerConfig.ACKS_CONFIG, "all");           // 모든 복제본 확인
        config.put(ProducerConfig.RETRIES_CONFIG, 3);
        config.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true); // 중복 방지
        config.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 1);
        return new DefaultKafkaProducerFactory<>(config);
    }

    @Bean
    public KafkaTemplate<String, EaiMessage> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }

    // ── Consumer 설정 ──
    @Bean
    public ConsumerFactory<String, EaiMessage> consumerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ConsumerConfig.GROUP_ID_CONFIG, "eai-workflow-engine");
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        config.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false); // 수동 커밋
        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        config.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 100);     // 1회 최대 100건
        config.put(JsonDeserializer.TRUSTED_PACKAGES, "com.example.portal.eai.*");
        return new DefaultKafkaConsumerFactory<>(config,
            new StringDeserializer(), new JsonDeserializer<>(EaiMessage.class));
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, EaiMessage> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, EaiMessage> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);
        factory.setConcurrency(3); // 파티션 수와 동일하게 설정
        return factory;
    }

    // ── 토픽 자동 생성 Bean (앱 시작 시 없으면 생성) ──
    @Bean
    public NewTopic requestTopic() {
        return TopicBuilder.name("eai.interface.request")
            .partitions(3).replicas(3)
            .config(TopicConfig.RETENTION_MS_CONFIG, "604800000")
            .config(TopicConfig.MIN_IN_SYNC_REPLICAS_CONFIG, "2")
            .build();
    }

    @Bean
    public NewTopic dlqTopic() {
        return TopicBuilder.name("eai.interface.dlq")
            .partitions(3).replicas(3)
            .config(TopicConfig.RETENTION_MS_CONFIG, "2592000000")
            .build();
    }

    @Bean
    public NewTopic responseTopic() {
        return TopicBuilder.name("eai.interface.response")
            .partitions(3).replicas(3)
            .build();
    }
}
```

---

## 5. 토픽 관리 CLI 명령어

```bash
# 토픽 목록 확인
docker exec eai-kafka-1 kafka-topics --list \
  --bootstrap-server localhost:9092

# 토픽 상세 정보 확인
docker exec eai-kafka-1 kafka-topics --describe \
  --topic eai.interface.request \
  --bootstrap-server localhost:9092

# Consumer Group Lag 확인 (지연 메시지 수)
docker exec eai-kafka-1 kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --group eai-workflow-engine \
  --describe

# Consumer Group 전체 목록
docker exec eai-kafka-1 kafka-consumer-groups \
  --bootstrap-server localhost:9092 --list

# 메시지 직접 발행 (테스트용)
docker exec eai-kafka-1 kafka-console-producer \
  --broker-list localhost:9092 \
  --topic eai.interface.request \
  --property "key.separator=:" \
  --property "parse.key=true"
# 입력 예: IF-0041:{"interfaceId":"IF-0041","payload":"{\"orderId\":1}"}

# 메시지 소비 확인 (처음부터)
docker exec eai-kafka-1 kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic eai.interface.request \
  --from-beginning \
  --max-messages 10

# DLQ 메시지 확인
docker exec eai-kafka-1 kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic eai.interface.dlq \
  --from-beginning

# 토픽 보존 기간 변경 (운영 중 변경 가능)
docker exec eai-kafka-1 kafka-configs --alter \
  --bootstrap-server localhost:9092 \
  --entity-type topics \
  --entity-name eai.interface.dlq \
  --add-config retention.ms=5184000000  # 60일로 변경
```

---

## 6. 운영 체크리스트

```
클러스터 설정 확인
  ✓ replication-factor: 3 (브로커 3대 이상)
  ✓ min.insync.replicas: 2
  ✓ unclean.leader.election.enable: false
  ✓ auto.create.topics.enable: false

Producer 설정 확인
  ✓ acks: all
  ✓ enable.idempotence: true (중복 메시지 방지)
  ✓ max.in.flight.requests.per.connection: 1

Consumer 설정 확인
  ✓ enable.auto.commit: false (수동 커밋)
  ✓ ack-mode: MANUAL_IMMEDIATE
  ✓ concurrency = 파티션 수 (3)

모니터링 알람 임계치
  ✓ Consumer Lag > 1,000건 → 경고
  ✓ DLQ 메시지 > 100건 → 경고
  ✓ Broker JVM Heap > 80% → 경고
```

---

## 7. KRaft 모드 (Zookeeper 없이 - Kafka 3.x 권장)

```yaml
# docker-compose-kafka-kraft.yml
# Kafka 3.x KRaft 모드 (Zookeeper 불필요)
version: '3.8'
services:
  kafka-1:
    image: confluentinc/cp-kafka:7.5.0
    container_name: eai-kafka-kraft-1
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://kafka-1:9092,CONTROLLER://kafka-1:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka-1:9092
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,CONTROLLER:PLAINTEXT
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka-1:9093,2@kafka-2:9093,3@kafka-3:9093
      CLUSTER_ID: MkU3OEVBNTcwNTJENDM2Qg  # base64 UUID (고정값)
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 3
      KAFKA_MIN_INSYNC_REPLICAS: 2
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "false"
    ports:
      - "19092:9092"
    volumes:
      - kafka-kraft-1:/var/lib/kafka/data
```
