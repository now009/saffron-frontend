# EAI 개발 환경 애플리케이션 설치 가이드
> Windows 개발 PC 기준 EAI 개발에 필요한 전체 애플리케이션 설치 순서

---

## 설치 순서 요약

```
1. Java 21 (LTS)
2. Node.js 20 LTS
3. IntelliJ IDEA (Backend)
4. VS Code (Frontend)
5. Docker Desktop
6. PostgreSQL 15
7. Redis 7
8. Kafka (Docker로 실행)
9. 프로젝트 의존성 설치
```

---

## 1. Java 21 설치

```bash
# Winget으로 설치 (PowerShell 관리자 권한)
winget install Microsoft.OpenJDK.21

# 또는 직접 다운로드
# https://adoptium.net/temurin/releases/?version=21

# 설치 확인
java -version
# openjdk version "21.x.x" ...

# JAVA_HOME 환경변수 설정 (시스템 속성 → 환경변수)
# JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-21.x.x.x-hotspot
# PATH에 %JAVA_HOME%\bin 추가
```

---

## 2. Node.js 20 LTS 설치

```bash
# 직접 다운로드: https://nodejs.org/en/download (LTS 선택)
# 또는 winget
winget install OpenJS.NodeJS.LTS

# 설치 확인
node -v    # v20.x.x
npm -v     # 10.x.x

# npm 글로벌 캐시 경로 설정 (선택사항)
npm config set prefix "C:\npm-global"
```

---

## 3. IntelliJ IDEA 설치 (Backend - Java/Spring)

```bash
# Community Edition (무료) 또는 Ultimate Edition
# https://www.jetbrains.com/idea/download/

# 또는 winget
winget install JetBrains.IntelliJIDEA.Community

# 필수 플러그인 설치 (IntelliJ 실행 후 Plugins 메뉴)
- Lombok          : @Getter/@Setter 등 코드 자동 생성
- Spring Boot     : Spring 지원 (Ultimate에 내장)
- Kotlin          : 선택사항
- SonarLint       : 코드 품질 분석
- GitToolBox      : Git 상태 표시
- Kafka           : Kafka 토픽 모니터링 (선택사항)

# Lombok annotation processing 활성화 필수
# Settings → Build → Compiler → Annotation Processors
# → Enable annotation processing 체크

# Gradle JVM 설정
# Settings → Build → Build Tools → Gradle
# → Gradle JVM: Java 21 선택
```

---

## 4. VS Code 설치 (Frontend - React/TypeScript)

```bash
# 다운로드: https://code.visualstudio.com/
# 또는 winget
winget install Microsoft.VisualStudioCode

# 필수 확장 설치 (Extensions 탭 또는 아래 명령)
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension dsznajder.es7-react-js-snippets
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension pkief.material-icon-theme
code --install-extension eamodio.gitlens
code --install-extension ms-azuretools.vscode-docker

# .vscode/settings.json (프로젝트 루트에 생성)
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "typescript.tsdk": "node_modules/typescript/lib",
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"]
}
```

---

## 5. Docker Desktop 설치

```bash
# https://www.docker.com/products/docker-desktop/

# 설치 확인
docker --version      # Docker Desktop x.x.x
docker-compose --version

# WSL2 백엔드 활성화 (권장)
# Docker Desktop → Settings → General
# → Use the WSL 2 based engine 체크

# 리소스 설정 (Settings → Resources)
# CPU: 4 이상, Memory: 8GB 이상 권장 (Kafka 클러스터 3대 운영)
```

---

## 6. PostgreSQL 15 설치

```bash
# 방법 A: Docker로 실행 (권장 - 버전 관리 용이)
docker run -d \
  --name eai-postgres \
  -e POSTGRES_USER=eai_user \
  -e POSTGRES_PASSWORD=eai_pass1234 \
  -e POSTGRES_DB=eai_db \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  postgres:15-alpine

# 방법 B: 직접 설치
# https://www.postgresql.org/download/windows/
winget install PostgreSQL.PostgreSQL.15

# DB 초기화
docker exec -it eai-postgres psql -U eai_user -d eai_db

# psql 접속 후 스키마 생성
CREATE SCHEMA IF NOT EXISTS eai;
SET search_path TO eai, public;

# DB 클라이언트 도구 설치 (선택)
# DBeaver: https://dbeaver.io/
winget install dbeaver.dbeaver
```

---

## 7. Redis 7 설치

```bash
# Docker로 실행 (권장)
docker run -d \
  --name eai-redis \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:7-alpine \
  redis-server --appendonly yes --requirepass eai_redis_pass

# 연결 확인
docker exec -it eai-redis redis-cli -a eai_redis_pass ping
# PONG

# Redis 관리 도구 설치 (선택)
# RedisInsight: https://redis.com/redis-enterprise/redis-insight/
```

---

## 8. Kafka 클러스터 (Docker Compose)

```bash
# kafka_eai.md 파일의 docker-compose-kafka.yml 사용
# 파일 위치: C:\00.Saffron\saffron-frontend\claudeScript\databus\

# 실행
docker-compose -f docker-compose-kafka.yml up -d

# 상태 확인
docker-compose -f docker-compose-kafka.yml ps

# Kafka UI 접속: http://localhost:8989

# 토픽 생성 (create-eai-topics.sh 참고)
# Git Bash 또는 WSL에서 실행
bash create-eai-topics.sh

# 또는 Kafka UI에서 수동 생성:
# http://localhost:8989 → Topics → Add a Topic
```

---

## 9. 전체 개발 환경 Docker Compose (통합)

```yaml
# docker-compose-dev.yml
# 개발환경 전체 인프라를 한 번에 실행

version: '3.8'
services:

  postgres:
    image: postgres:15-alpine
    container_name: eai-postgres
    environment:
      POSTGRES_USER: eai_user
      POSTGRES_PASSWORD: eai_pass1234
      POSTGRES_DB: eai_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./db_table_eai_init.sql:/docker-entrypoint-initdb.d/01_schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U eai_user -d eai_db"]
      interval: 10s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: eai-redis
    command: redis-server --requirepass eai_redis_pass --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: eai-zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: eai-kafka
    depends_on: [zookeeper]
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092,PLAINTEXT_HOST://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"   # 개발환경은 자동생성 허용
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1 # 단일 브로커용
    ports:
      - "9092:9092"

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    container_name: eai-kafka-ui
    depends_on: [kafka]
    ports:
      - "8989:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: eai-dev
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092

volumes:
  pgdata:
  redis-data:
```

```bash
# 개발환경 전체 실행
docker-compose -f docker-compose-dev.yml up -d

# 개발환경 전체 중지
docker-compose -f docker-compose-dev.yml down

# 로그 확인
docker-compose -f docker-compose-dev.yml logs -f kafka
```

---

## 10. Backend 프로젝트 설정 (IntelliJ)

```bash
# 1. 프로젝트 열기
#    File → Open → 기존 포탈 프로젝트 루트 선택

# 2. Gradle Refresh
#    Gradle 탭 → 새로고침 아이콘 클릭
#    (backend_eai.md 의 의존성이 build.gradle에 추가된 상태)

# 3. application-local.yml 생성 (gitignore에 포함)
# src/main/resources/application-local.yml

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/eai_db
    username: eai_user
    password: eai_pass1234
  data:
    redis:
      host: localhost
      port: 6379
      password: eai_redis_pass
  kafka:
    bootstrap-servers: localhost:9092

# 4. Run Configuration 설정
#    Run → Edit Configurations → Application
#    Active profiles: local
#    VM Options: -Xmx512m -DEAI_AES_KEY=dev_aes_key_32chars_1234567890

# 5. DB 마이그레이션 실행
#    db_table_eai.md의 DDL을 DBeaver 또는 psql에서 실행
```

---

## 11. Frontend 프로젝트 설정 (VS Code)

```bash
# 1. 프로젝트 폴더 열기
code C:\00.Saffron\saffron-frontend

# 2. 의존성 설치 (front_eai.md 요청 8번 참조)
npm install

# 3. .env.local 파일 생성 (gitignore에 포함)
# .env.local
VITE_API_BASE_URL=http://localhost:8080
VITE_EAI_API_BASE=/api/eai
VITE_EAI_SSE_URL=/api/eai/monitoring/stream

# 4. 개발 서버 실행
npm run dev
# → http://localhost:5173

# 5. 타입 체크
npx tsc --noEmit

# 6. 린트 검사
npx eslint src/
```

---

## 12. 환경변수 정리

| 변수명 | 값 (개발) | 설명 |
|--------|-----------|------|
| `SPRING_PROFILES_ACTIVE` | `local` | Spring 프로파일 |
| `DB_URL` | `jdbc:postgresql://localhost:5432/eai_db` | DB 접속 URL |
| `DB_USER` | `eai_user` | DB 사용자 |
| `DB_PASS` | `eai_pass1234` | DB 비밀번호 |
| `REDIS_HOST` | `localhost` | Redis 호스트 |
| `REDIS_PASS` | `eai_redis_pass` | Redis 비밀번호 |
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Kafka 브로커 |
| `EAI_AES_KEY` | `dev_aes_key_32chars_1234567890` | AES-256 암호화 키 (32자) |

---

## 13. 개발 환경 접속 정보 요약

| 서비스 | URL | 계정 |
|--------|-----|------|
| Backend API | http://localhost:8080 | JWT 토큰 |
| Frontend | http://localhost:5173 | 포탈 계정 |
| Kafka UI | http://localhost:8989 | - |
| PostgreSQL | localhost:5432/eai_db | eai_user / eai_pass1234 |
| Redis | localhost:6379 | eai_redis_pass |

---

## 14. 빠른 시작 스크립트

```batch
@echo off
REM start-dev.bat - EAI 개발환경 한번에 시작
REM 위치: C:\00.Saffron\

echo [1/3] Docker 인프라 시작...
docker-compose -f saffron-frontend\claudeScript\databus\docker-compose-dev.yml up -d

echo [2/3] 잠시 대기 (Kafka/DB 초기화)...
timeout /t 15

echo [3/3] 상태 확인...
docker-compose -f saffron-frontend\claudeScript\databus\docker-compose-dev.yml ps

echo.
echo ✓ 개발환경 준비 완료
echo   - Kafka UI   : http://localhost:8989
echo   - Backend    : IntelliJ에서 실행 (profile=local)
echo   - Frontend   : cd saffron-frontend ^&^& npm run dev
```
