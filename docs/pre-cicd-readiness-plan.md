# Javanc Pre-CI/CD Readiness Plan

## 1. Mục tiêu

Tài liệu này liệt kê các việc cần chỉnh trước khi bắt đầu triển khai Dockerfile, GitLab CI, Helm chart và Kubernetes deployment cho Javanc.

Phase này không triển khai CI/CD thật. Mục tiêu là làm repo đủ sạch, build được, không rò secret, và có cấu hình production rõ ràng để bước CI/CD sau không bị vỡ vì nền tảng chưa ổn định.

Các nhóm blocker cần xử lý trước:

1. Java 21 và build baseline.
2. Git hygiene và secret hygiene.
3. Stabilize thay đổi Redis/Kafka/local infra hiện tại.
4. Production config hardening.
5. Database migration readiness.

## 2. Hiện trạng audit

### 2.1 Stack hiện tại

- Backend là Maven multi-module trong `quarkus/`.
- Quarkus platform version: `3.33.1`.
- Java compiler release trong parent POM: `21`.
- Frontend là `client-react`, dùng React/Vite.
- Local infra hiện có trong `quarkus/docker-compose.yml`:
  - MySQL
  - MongoDB
  - Redis
  - Kafka
  - Kafka UI
  - Mailpit

### 2.2 Service inventory

| Service | Port | Runtime dependency chính |
|---|---:|---|
| `gateway-service` | 8080 | Internal service URLs |
| `user-service` | 8088 | MySQL, Redis, Kafka, Google OAuth config |
| `profile-service` | 8085 | MongoDB |
| `project-service` | 8086 | MySQL, Kafka |
| `manager-service` | 8091 | MongoDB, Kafka |
| `notification-service` | 8084 | MySQL, Kafka |
| `email-service` | 8087 | MySQL, Kafka, SMTP |
| `image-service` | 8083 | MySQL, Cloudinary/local uploads |

### 2.3 Audit kết quả gần nhất

Frontend đã pass:

```bash
npm run lint
npm run test:run
npm run build
```

Backend chưa pass trên máy hiện tại vì Maven đang chạy bằng JDK 17 trong khi project yêu cầu Java 21:

```text
error: release version 21 not supported
```

Nguyên nhân:

```text
JAVA_HOME=C:\Program Files\Java\jdk-17
Maven Java version=17
Project maven.compiler.release=21
```

## 3. Java 21 và build baseline

### 3.1 Vấn đề

Project yêu cầu Java 21 nhưng Maven local đang chạy bằng Java 17. Nếu không khóa điều kiện này, CI/CD có thể fail muộn ở bước compile với lỗi khó đọc hơn.

### 3.2 Thay đổi cần có

Parent POM `quarkus/pom.xml` phải có Maven Enforcer:

- Require Java version `[21,)`.
- Require Maven version `[3.9,)`.
- Message lỗi phải nói rõ cần set `JAVA_HOME` sang JDK 21.

### 3.3 Hướng dẫn local Windows

Kiểm tra JDK đang dùng:

```powershell
java -version
mvn -version
echo $env:JAVA_HOME
```

Set tạm trong terminal hiện tại:

```powershell
$env:JAVA_HOME="C:\Program Files\Java\jdk-21"
$env:Path="$env:JAVA_HOME\bin;$env:Path"
mvn -version
```

Set lâu dài:

```powershell
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-21", "User")
```

Mở terminal mới rồi kiểm tra lại:

```powershell
mvn -version
```

Maven phải hiển thị Java 21.

### 3.4 Build baseline bắt buộc

Sau khi Java đúng:

```powershell
mvn -f quarkus/pom.xml test
```

Nếu cần chạy từng module:

```powershell
mvn -f quarkus/pom.xml -pl user-service -am test
mvn -f quarkus/pom.xml -pl gateway-service -am test
```

Acceptance:

- Maven fail sớm bằng Enforcer nếu Java dưới 21.
- Maven test pass khi Java 21.
- Không phụ thuộc `.env` thật cho test profile.

## 4. Git hygiene và secret hygiene

### 4.1 Nguyên tắc

Không commit:

- `.env` thật.
- `quarkus/local/infra.env`.
- kubeconfig.
- file secret override.
- private key.
- access token.
- database password thật.
- mail app password.
- Cloudinary secret.
- JWT/OTP secret.

Chỉ commit:

- `.env.example`.
- tài liệu biến môi trường.
- Helm values không chứa secret.

### 4.2 Ignore rules cần có

`.gitignore` phải ignore rõ:

```gitignore
.env
**/.env
quarkus/local/infra.env
*.secret
*.secrets
*.kubeconfig
kubeconfig
.kube/
```

### 4.3 Lệnh audit trước khi commit

Kiểm tra file nhạy cảm đã bị track chưa:

```powershell
git ls-files | rg "\.env$|infra\.env$|secret|kubeconfig|\.pem$"
```

Kiểm tra pattern secret trong tracked configs:

```powershell
rg -n "PASSWORD=|SECRET=|TOKEN=|API_SECRET=|MONGODB_CONNECTION_STRING=|REDIS_URL=|JWT_SECRET=|OTP_HASH_SECRET=|MAIL_PASSWORD=|CLOUDINARY_API_SECRET=" . -g "*.md" -g "*.yml" -g "*.yaml" -g "*.properties" -g ".env.example"
```

Lưu ý: `.env.example` được phép có placeholder như `change-me`, không được có secret thật.

Nếu phát hiện secret thật từng bị commit:

1. Rotate secret ở provider.
2. Xóa khỏi Git history nếu cần bằng quy trình riêng.
3. Không chỉ xóa file ở commit mới rồi coi là an toàn.

## 5. Stabilize thay đổi Redis/Kafka/local infra hiện tại

### 5.1 Các thay đổi cần hoàn tất trước CI/CD

Trước khi bắt đầu Dockerfile/GitLab CI/Helm, cần ổn định các thay đổi infra đang pending:

- Kafka dùng `apache/kafka:3.7.0`.
- `init-topics.sh` dùng Kafka CLI path đúng với Apache image.
- Local infra bật auth cho MySQL/MongoDB/Redis.
- `user-service` có Redis foundation.
- Docs deployment plan đã tạo.

### 5.2 Validation local infra

Start infra:

```powershell
cd C:\Users\Admin\Desktop\javanc\quarkus
docker compose --env-file local\infra.env up -d
```

Kiểm tra container:

```powershell
docker ps
```

Kiểm tra MySQL:

```powershell
docker exec javanc-mysql mysqladmin ping -uroot -pjavanc_local --silent
```

Kiểm tra MongoDB:

```powershell
docker exec javanc-mongo mongosh --quiet -u root -p javanc_local --authenticationDatabase admin --eval "db.adminCommand('ping').ok"
```

Kiểm tra Redis:

```powershell
docker exec javanc-redis redis-cli -a javanc_local ping
```

Kiểm tra Kafka topics:

```powershell
docker exec javanc-kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
```

Expected topics:

```text
javanc.user.events
javanc.project.events
javanc.manager.events
javanc.email.commands
javanc.email.commands.dlq
javanc.notification.commands
javanc.notification.commands.dlq
javanc.domain-events.dlq
```

### 5.3 Commit strategy

Không gom CI/CD vào cùng commit với infra readiness.

Thứ tự commit khuyến nghị:

```text
infra: stabilize local kafka redis mysql mongo config
docs: add deployment cicd kubernetes plan
build: enforce java 21 for quarkus services
docs: add pre cicd readiness plan
```

Nếu muốn ít commit hơn:

```text
chore: prepare project for cicd deployment work
```

Nhưng với dự án microservices, tách commit theo nhóm vẫn dễ review và rollback hơn.

## 6. Production config hardening

### 6.1 JDBC URL

Local/dev có thể dùng:

```text
createDatabaseIfNotExist=true
useSSL=false
allowPublicKeyRetrieval=true
```

Prod không nên dùng các flag này.

Prod nên dùng database đã provision sẵn:

```env
USER_MYSQL_JDBC_URL=jdbc:mysql://mysql-prod-host:3306/user_service?useSSL=true&serverTimezone=UTC
PROJECT_MYSQL_JDBC_URL=jdbc:mysql://mysql-prod-host:3306/project_service?useSSL=true&serverTimezone=UTC
NOTIFICATION_MYSQL_JDBC_URL=jdbc:mysql://mysql-prod-host:3306/notification_service?useSSL=true&serverTimezone=UTC
EMAIL_MYSQL_JDBC_URL=jdbc:mysql://mysql-prod-host:3306/email_service?useSSL=true&serverTimezone=UTC
IMAGE_MYSQL_JDBC_URL=jdbc:mysql://mysql-prod-host:3306/image_service?useSSL=true&serverTimezone=UTC
```

Prod DB user:

- Không dùng root.
- Mỗi service nên có user/database riêng.
- Quyền tối thiểu theo service.

### 6.2 CORS

Gateway prod chỉ allow frontend domain thật:

```env
GATEWAY_CORS_ORIGINS=https://your-domain.com
```

Dev/test:

```env
GATEWAY_CORS_ORIGINS=https://dev.your-domain.com
GATEWAY_CORS_ORIGINS=https://test.your-domain.com
```

Không giữ localhost trong prod.

### 6.3 Public exposure

Kubernetes production chỉ public:

- `client-react` qua frontend Ingress.
- `gateway-service` qua API Ingress.

Không public trực tiếp:

- `user-service`
- `profile-service`
- `project-service`
- `manager-service`
- `notification-service`
- `email-service`
- `image-service`

Các service nội bộ dùng `ClusterIP`.

### 6.4 User-service auth policy

`user-service` hiện có:

```properties
quarkus.http.auth.permission.default.policy=permit
```

Điều này chỉ chấp nhận được nếu:

- `user-service` không public internet.
- Gateway là auth guard bắt buộc cho protected API.
- Kubernetes Ingress không route trực tiếp tới `user-service`.

Nếu có khả năng service bị expose nhầm, cần harden trực tiếp `user-service` trước production.

### 6.5 Logging và metrics

Prod:

```env
LOG_JSON_ENABLED=true
METRICS_PROMETHEUS_ENABLED=true
```

Không log:

- JWT.
- refresh token.
- OTP.
- password.
- mail app password.
- Cloudinary secret.
- Redis URL có password.

## 7. Database migration readiness

### 7.1 Hiện trạng

Phù hợp hơn cho prod:

- `user-service`: Flyway + validate.
- `email-service`: Flyway + validate.

Cần cải thiện:

- `image-service`: đang dùng Hibernate `update`.
- `project-service`: đang dùng Hibernate `update`.
- `notification-service`: đang dùng Hibernate `update`.

### 7.2 Readiness tối thiểu

Trước CI/CD có thể chưa migrate toàn bộ, nhưng prod config phải không mặc định update schema tự động.

Tối thiểu:

```env
IMAGE_DB_GENERATION=validate
PROJECT_DB_GENERATION=validate
NOTIFICATION_DB_GENERATION=validate
```

Chỉ dùng `update` ở local/dev khi chấp nhận mất kiểm soát schema.

### 7.3 Production chuẩn

Trước khi production thật:

- Thêm Flyway cho `image-service`, `project-service`, `notification-service`.
- Tạo baseline migration từ schema hiện tại.
- Không sửa migration cũ.
- Mọi thay đổi schema đi qua migration versioned.
- CI chạy migration check hoặc ít nhất build/test với validate.

## 8. Checklist trước khi bắt đầu Dockerfile/GitLab CI/Helm

### 8.1 Build/test

```powershell
mvn -version
mvn -f quarkus/pom.xml test
cd client-react
npm run lint
npm run test:run
npm run build
```

Pass criteria:

- Maven dùng Java 21.
- Backend tests pass.
- Frontend lint/test/build pass.

### 8.2 Secret audit

```powershell
git ls-files | rg "\.env$|infra\.env$|secret|kubeconfig|\.pem$"
```

Pass criteria:

- Không có `.env` thật.
- Không có `infra.env`.
- Không có kubeconfig.
- Không có secret thật.

### 8.3 Infra smoke

```powershell
cd quarkus
docker compose --env-file local\infra.env up -d
docker ps
docker exec javanc-redis redis-cli -a javanc_local ping
docker exec javanc-mysql mysqladmin ping -uroot -pjavanc_local --silent
docker exec javanc-mongo mongosh --quiet -u root -p javanc_local --authenticationDatabase admin --eval "db.adminCommand('ping').ok"
docker exec javanc-kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
```

Pass criteria:

- Redis trả `PONG`.
- MySQL alive.
- Mongo ping `1`.
- Kafka list topics thành công.

### 8.4 Config audit

Pass criteria:

- Prod docs không dùng local JDBC flags.
- Prod CORS không chứa localhost.
- Prod service URLs dùng Kubernetes internal DNS.
- Chỉ gateway/frontend public.
- Schema strategy prod không dùng Hibernate `update`.

## 9. Definition of Done

Phase readiness hoàn thành khi:

- Maven Enforcer fail sớm nếu Java dưới 21.
- Local Maven dùng JDK 21 và backend tests pass.
- Frontend lint/test/build pass.
- `.gitignore` bảo vệ local env, kubeconfig và secret override.
- `git ls-files` không có `.env` thật hoặc kubeconfig.
- Redis/Kafka/local infra changes được validate.
- Production config rules đã được ghi rõ.
- Migration readiness cho các service còn `update` đã được xác định.
- Worktree được gom commit rõ ràng trước khi bắt đầu CI/CD implementation.

## 10. Việc không làm trong phase này

- Không tạo Dockerfile production.
- Không tạo `.gitlab-ci.yml`.
- Không tạo Helm chart.
- Không deploy Kubernetes.
- Không chuyển database production.
- Không đổi business flow auth/register/login/google login.
- Không chạy migration phá vỡ schema.

