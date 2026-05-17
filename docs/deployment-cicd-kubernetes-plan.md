# Javanc CI/CD & Kubernetes Deployment Plan

## 1. Mục tiêu

Triển khai Javanc lên môi trường thực tế với kiến trúc production-ready:

- Frontend React/Vite chạy public qua HTTPS.
- Backend Quarkus microservices chạy trong Kubernetes.
- Gateway là public API entrypoint duy nhất.
- Các service nội bộ không expose trực tiếp ra internet.
- CI/CD dùng GitLab CI.
- Container image lưu ở GitLab Container Registry.
- Dev, test, prod tách biệt bằng namespace, domain, secrets và external managed services riêng.

Quyết định mặc định:

| Hạng mục | Quyết định |
|---|---|
| CI/CD | GitLab CI |
| Container registry | GitLab Container Registry |
| Runtime | Kubernetes |
| TLS | Ingress + cert-manager + Let's Encrypt |
| Data layer | Managed MySQL, MongoDB, Redis, Kafka |
| Backend image | JVM image trước, chưa native image |
| Frontend runtime | Nginx serve static Vite build |
| Local compose | Chỉ dùng local infra, không dùng production |
| Secrets | GitLab protected variables + Kubernetes Secrets, không commit `.env` |

## 2. Hiện trạng repo

Trạng thái được cập nhật theo repo ngày `2026-05-17`.

### 2.1 Nền tảng đã có

- Frontend: `client-react`, React/Vite.
- Backend: Maven multi-module Quarkus `3.33.1` trong `quarkus/`.
- Services:
  - `gateway-service`: public API gateway, port `8080`.
  - `user-service`: auth/user/JWT/Google login/Redis foundation, port `8088`.
  - `profile-service`: profile, MongoDB, port `8085`.
  - `project-service`: project, MySQL, Kafka producer, port `8086`.
  - `manager-service`: company/job/application, MongoDB, Kafka producer, port `8091`.
  - `notification-service`: notification, MySQL, Kafka consumer/DLQ, port `8084`.
  - `email-service`: mail/OTP command consumer, MySQL, port `8087`.
  - `image-service`: image upload/Cloudinary/local metadata, MySQL, port `8083`.
- `quarkus/docker-compose.yml` đã có cho local infra: MySQL, MongoDB, Redis, Kafka, Kafka UI, Mailpit.
- Java 21 đã được khóa ở parent POM bằng `maven.compiler.release=21` và Maven Enforcer.
- Mỗi backend service đã tách config theo profile:
  - `application.properties`
  - `application-dev.properties`
  - `application-test.properties`
  - `application-prod.properties`
- Repo đã có hợp đồng env production tập trung ở `quarkus/env/services-prod.env.example`.
- Repo đã có tài liệu env/local runtime:
  - `quarkus/env/README.md`
  - `quarkus/local/README.md`
  - `docs/pre-cicd-readiness-plan.md`
  - `docs/quarkus-config-profile-layout.md`
- Tất cả 8 backend service đã có health endpoint `/q/health`, `/q/health/live`, `/q/health/ready`, Prometheus metrics config và `RequestCorrelationFilter`.
- `.gitignore` đã chặn `.env`, `infra.env`, kubeconfig và secret override; file template đã có cho toàn bộ service và frontend.

### 2.2 Những phần đã có một phần

| Hạng mục | Trạng thái hiện tại | Phần còn thiếu |
|---|---|---|
| Docker backend | Đã có `quarkus/Dockerfile.jvm` dùng chung cho toàn bộ backend; mỗi service có `.dockerignore` để chỉ đưa `target/quarkus-app` vào context | Cần build image thực tế trong CI và thống nhất lệnh build theo từng service |
| Env production | Đã có `quarkus/env/services-prod.env.example` và frontend `client-react/.env.production.example` | Chưa nối các biến này vào GitLab CI/Kubernetes Secret/ConfigMap thật |
| Migration | `user-service` và `email-service` đã có Flyway migration | `image-service`, `project-service`, `notification-service` chưa có Flyway baseline/versioned migration |
| Observability | Health, metrics, request correlation đã có ở code/config | Chưa có Prometheus Operator, Grafana dashboard, Alertmanager và alert production |

### 2.3 Những phần còn thiếu cho delivery thật

- Đã có `quarkus/Dockerfile.jvm` để build image JVM chung cho backend.
- Đã có `client-react/Dockerfile` để build static frontend image bằng Nginx.
- Chưa có `.gitlab-ci.yml`.
- Chưa có thư mục `deploy/helm/javanc` hoặc Kubernetes manifests.
- Chưa có pipeline build/push image, scan, deploy và smoke test.
- Chưa có phần repo thể hiện namespaces, ingress controller, cert-manager, ClusterIssuer, DNS hoặc registry pull secret.
- Chưa có cấu hình deploy thực tế cho `dev`, `test`, `prod`.
- Chưa có bằng chứng trong repo về managed MySQL/MongoDB/Redis/Kafka production, backup, ACL hay provisioning bằng IaC.

## 3. Mô hình môi trường

Tạo 3 môi trường độc lập:

| Environment | Git source | Namespace | Frontend domain | API domain |
|---|---|---|---|---|
| `dev` | `develop` | `javanc-dev` | `dev.your-domain.com` | `api-dev.your-domain.com` |
| `test` | `test` hoặc `release/*` | `javanc-test` | `test.your-domain.com` | `api-test.your-domain.com` |
| `prod` | `main` hoặc tag `v*` | `javanc-prod` | `your-domain.com` | `api.your-domain.com` |

Quy tắc:

- `dev` dùng để tích hợp nhanh, auto deploy từ `develop`.
- `test` dùng để QA/staging, auto deploy từ `test` hoặc `release/*`.
- `prod` deploy từ `main` hoặc tag `v*`, bắt buộc manual approval.
- Mỗi environment có database, Redis, Kafka, secrets, Google OAuth client/domain riêng.
- Không dùng chung database giữa `dev`, `test`, `prod`.

## 4. Chiến lược branch và promotion

Branch model:

```text
feature/* -> Merge Request -> develop -> dev
develop -> test hoặc release/* -> test
main hoặc v* tag -> prod
```

Pipeline behavior:

- Merge Request:
  - chạy lint/test/build/scan.
  - không deploy.
- `develop`:
  - chạy full CI.
  - build/push image.
  - deploy `dev`.
  - chạy smoke test dev.
- `test` hoặc `release/*`:
  - chạy full CI.
  - build/push image.
  - deploy `test`.
  - chạy smoke test test.
- `main` hoặc `v*`:
  - chạy full CI.
  - build/push immutable image.
  - deploy `prod` bằng manual job.
  - chạy smoke test prod.

Image tagging:

```text
$CI_REGISTRY_IMAGE/gateway-service:$CI_COMMIT_SHA
$CI_REGISTRY_IMAGE/user-service:$CI_COMMIT_SHA
$CI_REGISTRY_IMAGE/profile-service:$CI_COMMIT_SHA
$CI_REGISTRY_IMAGE/project-service:$CI_COMMIT_SHA
$CI_REGISTRY_IMAGE/manager-service:$CI_COMMIT_SHA
$CI_REGISTRY_IMAGE/notification-service:$CI_COMMIT_SHA
$CI_REGISTRY_IMAGE/email-service:$CI_COMMIT_SHA
$CI_REGISTRY_IMAGE/image-service:$CI_COMMIT_SHA
$CI_REGISTRY_IMAGE/client-react:$CI_COMMIT_SHA
```

Convenience tags:

- `dev-latest`: chỉ dùng cho dev.
- `test-latest`: chỉ dùng cho test.
- `vX.Y.Z`: dùng cho prod release.
- Prod deployment vẫn nên pin bằng immutable tag hoặc commit SHA.

## 5. Container hóa backend/frontend

### 5.1 Backend Quarkus

Trạng thái hiện tại:

- Đã có `quarkus/Dockerfile.jvm` dùng chung cho toàn bộ backend.
- Dockerfile nhận `SERVICE_PORT`, chỉ copy `target/quarkus-app` sau khi Maven package xong.
- Mỗi service có `.dockerignore` riêng để context chỉ chứa artifact fast-jar cần thiết.

Khuyến nghị v1:

- Dùng một Dockerfile generic: `quarkus/Dockerfile.jvm`.
- Build service bằng Maven trong CI trước, Dockerfile chỉ copy output.
- Không build native image trong phase đầu.

Build flow:

```powershell
mvn -f quarkus/pom.xml -pl user-service -am package -DskipTests
docker build -f quarkus/Dockerfile.jvm --build-arg SERVICE_PORT=8088 -t user-service:local quarkus/user-service
```

Runtime requirements:

- Java 21.
- Container chạy non-root user.
- Expose service port đúng theo env:
  - gateway `8080`
  - image `8083`
  - notification `8084`
  - profile `8085`
  - project `8086`
  - email `8087`
  - user `8088`
  - manager `8091`
- Health:
  - readiness: `/q/health/ready`
  - liveness: `/q/health/live`

Không copy vào image:

- `.env`
- `target` cũ ngoài artifact cần thiết
- `.git`
- IDE files
- local uploads

### 5.2 Frontend React/Vite

Trạng thái hiện tại:

- Đã có `.env.example` và `.env.production.example`.
- Đã có `client-react/Dockerfile`, `client-react/.dockerignore` và `client-react/nginx/default.conf`.

Dockerfile frontend `client-react/Dockerfile`:

- Stage 1: Node build.
- Stage 2: Nginx serve static files.
- Cấu hình SPA fallback:
  - mọi route không match file tĩnh trả về `/index.html`.
- Expose port `80`.

Biến Vite là build-time:

```env
VITE_API_BASE_URL=https://api.your-domain.com
VITE_GOOGLE_CLIENT_ID=prod-google-client-id.apps.googleusercontent.com
```

Vì Vite inject env lúc build, mỗi environment cần build image frontend riêng hoặc dùng runtime config file. Phase đầu chọn build riêng theo environment để đơn giản.

## 6. GitLab CI/CD pipeline design

Tạo `.gitlab-ci.yml` với stages:

```yaml
stages:
  - validate
  - test
  - build
  - scan
  - publish
  - deploy
  - smoke
```

### 6.1 Validate

Backend:

```bash
mvn -f quarkus/pom.xml -q -DskipTests validate
```

Frontend:

```bash
cd client-react
npm ci
npm run lint
```

### 6.2 Test

Backend:

```bash
mvn -f quarkus/pom.xml test
```

Frontend:

```bash
cd client-react
npm ci
npm run test:run
npm run build
```

E2E:

- Chạy trong MR hoặc nightly nếu thời gian lâu.
- Với deploy smoke test thì chạy subset nhỏ sau deploy.

### 6.3 Build image

Build từng backend service:

```bash
mvn -f quarkus/pom.xml -pl gateway-service -am package -DskipTests
mvn -f quarkus/pom.xml -pl user-service -am package -DskipTests
mvn -f quarkus/pom.xml -pl profile-service -am package -DskipTests
mvn -f quarkus/pom.xml -pl project-service -am package -DskipTests
mvn -f quarkus/pom.xml -pl manager-service -am package -DskipTests
mvn -f quarkus/pom.xml -pl notification-service -am package -DskipTests
mvn -f quarkus/pom.xml -pl email-service -am package -DskipTests
mvn -f quarkus/pom.xml -pl image-service -am package -DskipTests
```

Build frontend theo environment:

```bash
cd client-react
npm ci
npm run build
```

### 6.4 Publish

Login registry:

```bash
docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"
```

Push images:

```bash
docker push "$CI_REGISTRY_IMAGE/user-service:$CI_COMMIT_SHA"
docker push "$CI_REGISTRY_IMAGE/client-react:$CI_COMMIT_SHA"
```

Lặp lại cho toàn bộ service.

### 6.5 Scan

Bật các job:

- GitLab Secret Detection.
- Dependency Scanning.
- Container Scanning.
- SAST nếu GitLab tier hỗ trợ.

Policy:

- Critical vulnerability: fail pipeline.
- High vulnerability: fail pipeline ở prod, warning hoặc manual approval ở dev/test.
- Secret detection: fail mọi environment.

### 6.6 Deploy

Deploy bằng Helm:

```bash
helm upgrade --install javanc deploy/helm/javanc \
  --namespace "$KUBE_NAMESPACE" \
  --create-namespace \
  -f deploy/helm/javanc/values.yaml \
  -f deploy/helm/javanc/values-$ENVIRONMENT.yaml \
  --set image.tag="$CI_COMMIT_SHA"
```

Prod job:

- `when: manual`
- chỉ chạy trên protected branch/tag.
- cần protected variable `KUBE_CONFIG_PROD`.

### 6.7 Smoke

Sau deploy:

```bash
curl -f "https://$API_DOMAIN/q/health/ready"
curl -f "https://$FRONTEND_DOMAIN"
```

Thêm smoke test nghiệp vụ tối thiểu:

- gọi gateway route public `/auth/*` hoặc health endpoint.
- login test account ở dev/test.
- kiểm tra frontend asset load thành công.

## 7. Kubernetes deployment design

Tạo Helm chart:

```text
deploy/
  helm/
    javanc/
      Chart.yaml
      values.yaml
      values-dev.yaml
      values-test.yaml
      values-prod.yaml
      templates/
        deployment.yaml
        service.yaml
        ingress.yaml
        configmap.yaml
        secret.yaml
        serviceaccount.yaml
        hpa.yaml
```

### 7.1 Workloads

Mỗi app có:

- Deployment.
- ClusterIP Service.
- ConfigMap.
- Secret reference.
- readiness/liveness probes.
- resource requests/limits.

Khuyến nghị replicas:

| Service | Dev | Test | Prod |
|---|---:|---:|---:|
| frontend | 1 | 1 | 2 |
| gateway-service | 1 | 1 | 2 |
| user-service | 1 | 1 | 2 |
| profile-service | 1 | 1 | 2 |
| project-service | 1 | 1 | 2 |
| manager-service | 1 | 1 | 2 |
| notification-service | 1 | 1 | 2 |
| email-service | 1 | 1 | 2 |
| image-service | 1 | 1 | 2 |

Prod có thể tăng replica theo traffic.

### 7.2 Internal service URLs

Trong Kubernetes, các service gọi nhau bằng DNS nội bộ:

```env
USER_SERVICE_URL=http://user-service:8088
PROFILE_SERVICE_URL=http://profile-service:8085
PROJECT_SERVICE_URL=http://project-service:8086
NOTIFICATION_SERVICE_URL=http://notification-service:8084
MANAGER_SERVICE_URL=http://manager-service:8091
IMAGE_SERVICE_URL=http://image-service:8083
EMAIL_SERVICE_URL=http://email-service:8087
```

Gateway route target dùng các URL trên.

### 7.3 Ingress

Ingress public:

- Frontend:
  - `/` -> `client-react:80`
- API:
  - `api-*.your-domain.com/*` -> `gateway-service:8080`

Không expose trực tiếp:

- `user-service`
- `profile-service`
- `project-service`
- `manager-service`
- `notification-service`
- `email-service`
- `image-service`

Nếu cần debug nội bộ dùng:

```bash
kubectl port-forward svc/user-service 8088:8088 -n javanc-dev
```

### 7.4 Probes

Backend:

```yaml
readinessProbe:
  httpGet:
    path: /q/health/ready
    port: http
livenessProbe:
  httpGet:
    path: /q/health/live
    port: http
```

Frontend:

```yaml
readinessProbe:
  httpGet:
    path: /
    port: http
livenessProbe:
  httpGet:
    path: /
    port: http
```

## 8. Config và secrets strategy

### 8.1 Không commit `.env`

Repo chỉ giữ:

- `.env.example`
- `client-react/.env.production.example`
- `quarkus/env/services-prod.env.example`
- Helm values không chứa secret.
- Tài liệu biến môi trường.

Không commit:

- `.env`
- private key
- kubeconfig
- DB password
- JWT secret
- OAuth secret/token
- mail password
- Cloudinary secret

### 8.2 GitLab variables

Tạo GitLab CI/CD Variables theo environment scope.

Common:

```text
KUBE_CONFIG_DEV
KUBE_CONFIG_TEST
KUBE_CONFIG_PROD
CI_REGISTRY_USER
CI_REGISTRY_PASSWORD
```

Backend secrets:

```text
MYSQL_USERNAME
MYSQL_PASSWORD
MONGODB_CONNECTION_STRING
REDIS_URL
REDIS_PASSWORD
KAFKA_BOOTSTRAP_SERVERS
JWT_SECRET
OTP_HASH_SECRET
GOOGLE_CLIENT_ID
MAIL_USERNAME
MAIL_PASSWORD
MAIL_FROM
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

Frontend build vars:

```text
VITE_API_BASE_URL
VITE_GOOGLE_CLIENT_ID
```

Prod variables:

- Mark `Protected`.
- Mark `Masked` nếu GitLab cho phép.
- Chỉ available cho protected branches/tags.

### 8.3 Kubernetes Secrets

CI tạo/update secrets:

```bash
kubectl create secret generic javanc-secrets \
  --namespace "$KUBE_NAMESPACE" \
  --from-literal=MYSQL_PASSWORD="$MYSQL_PASSWORD" \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --from-literal=OTP_HASH_SECRET="$OTP_HASH_SECRET" \
  --dry-run=client -o yaml | kubectl apply -f -
```

Không in secret ra log.

### 8.4 ConfigMap

Config không nhạy cảm:

```env
LOG_JSON_ENABLED=true
METRICS_PROMETHEUS_ENABLED=true
MESSAGING_ENABLED=true
KAFKA_DEV_SERVICES_ENABLED=false
DOWNSTREAM_CONNECT_TIMEOUT=1000
DOWNSTREAM_READ_TIMEOUT=3000
```

## 9. Managed services

Production dùng managed services để giảm rủi ro vận hành.

### 9.1 MySQL

Khuyến nghị:

- Tạo database riêng cho từng service:
  - `user_service`
  - `project_service`
  - `notification_service`
  - `email_service`
  - `image_service`
- Tạo DB user riêng, không dùng root.
- Bật backup tự động.
- Bật point-in-time recovery nếu provider hỗ trợ.
- Không bật `createDatabaseIfNotExist=true` ở prod nếu DB đã được provision bằng IaC.

Prod JDBC format:

```env
USER_MYSQL_JDBC_URL=jdbc:mysql://mysql-prod-host:3306/user_service?useSSL=true&serverTimezone=UTC&allowPublicKeyRetrieval=false
```

### 9.2 MongoDB

Khuyến nghị:

- Dùng MongoDB Atlas hoặc managed equivalent.
- Tạo database riêng hoặc collection namespace rõ ràng.
- Bật auth, network allowlist, backup.

Prod:

```env
MONGODB_CONNECTION_STRING=mongodb+srv://user:password@cluster.example.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=microservice-portfolio
```

### 9.3 Redis

Redis dùng cho foundation hiện tại và phase sau:

- rate limit
- OTP cache
- refresh token/session
- token blacklist

Prod:

```env
REDIS_ENABLED=true
REDIS_URL=rediss://:password@redis-prod-host:6379/0
REDIS_PASSWORD=password
REDIS_SSL=true
REDIS_TIMEOUT=5s
```

### 9.4 Kafka

Khuyến nghị:

- Dùng managed Kafka/Confluent/Redpanda Cloud/MSK tương đương.
- Tạo topics trước khi deploy app.
- Không bật auto-create topics ở prod.
- Thiết lập ACL theo service nếu provider hỗ trợ.

Topics hiện dùng:

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

## 10. Domain, TLS, Ingress

Chuẩn bị DNS:

```text
dev.your-domain.com       -> ingress load balancer
api-dev.your-domain.com   -> ingress load balancer
test.your-domain.com      -> ingress load balancer
api-test.your-domain.com  -> ingress load balancer
your-domain.com           -> ingress load balancer
api.your-domain.com       -> ingress load balancer
```

cert-manager:

- ClusterIssuer `letsencrypt-prod`.
- Issuer staging có thể dùng trước để tránh rate limit.

Ingress annotations mẫu:

```yaml
cert-manager.io/cluster-issuer: letsencrypt-prod
nginx.ingress.kubernetes.io/proxy-body-size: "20m"
```

Gateway CORS theo environment:

```env
GATEWAY_CORS_ORIGINS=https://your-domain.com
```

Dev/test:

```env
GATEWAY_CORS_ORIGINS=https://dev.your-domain.com
GATEWAY_CORS_ORIGINS=https://test.your-domain.com
```

## 11. Observability, logging, healthcheck

### 11.1 Health

Hiện trạng repo:

- Tất cả 8 backend service đã có health endpoint và test coverage cho `/q/health`, `/q/health/live`, `/q/health/ready`.
- Phần còn thiếu là wiring các endpoint này vào Kubernetes probe và smoke job thật sau deploy.

Public checks:

```text
https://api.your-domain.com/q/health/ready
https://api.your-domain.com/q/health/live
```

Internal checks:

- từng service `/q/health/ready`.
- Kubernetes readiness/liveness dùng endpoint này.

### 11.2 Logs

Hiện trạng repo:

- Các service đã có `RequestCorrelationFilter`.
- Production profile đã có `LOG_JSON_ENABLED=true` mặc định qua `application-prod.properties`.
- Phần còn thiếu là log aggregation tập trung và rule cảnh báo production.

Prod:

```env
LOG_JSON_ENABLED=true
```

Yêu cầu:

- log JSON.
- không log password/token/JWT/OTP.
- log request id/correlation id nếu phase sau thêm tracing.

### 11.3 Metrics

Hiện trạng repo:

- Tất cả backend service đã có Micrometer Prometheus config.
- Phần còn thiếu là stack thu thập/hiển thị/cảnh báo như Prometheus Operator, Grafana và Alertmanager.

Prod:

```env
METRICS_PROMETHEUS_ENABLED=true
```

Kubernetes có thể scrape:

```text
/q/metrics
```

Phase sau:

- Prometheus Operator.
- Grafana dashboards.
- Alertmanager.

### 11.4 Alerts tối thiểu

Prod nên có alert:

- Pod crash loop.
- readiness down.
- CPU/memory cao.
- 5xx gateway tăng.
- Kafka consumer lag tăng.
- DB connection failure.
- Redis unavailable khi `REDIS_ENABLED=true`.
- certificate gần hết hạn.

## 12. Security checklist

Bắt buộc:

- Không commit `.env` thật.
- Không dùng root DB user cho app prod.
- Prod GitLab variables phải protected.
- Prod deploy phải manual approval.
- Container chạy non-root.
- Không expose service nội bộ ra internet.
- Gateway là backend entrypoint duy nhất.
- HTTPS bắt buộc ở prod.
- CORS chỉ allow đúng frontend domain.
- JWT secret đủ dài, khác nhau theo environment.
- OTP hash secret khác JWT secret.
- Google OAuth client ID đúng environment.
- Mail password/API secret không log ra console.
- Cloudinary secret không đưa vào frontend.

Khuyến nghị:

- Bật network policies trong Kubernetes.
- Dùng External Secrets Operator hoặc sealed-secrets khi hệ thống trưởng thành.
- Bật image signature/provenance nếu team cần compliance.
- Sử dụng RBAC service account riêng cho CI deploy.

## 13. Rollback strategy

Rollback app:

```bash
helm rollback javanc <revision> -n javanc-prod
```

Kiểm tra revision:

```bash
helm history javanc -n javanc-prod
```

Rollback image:

- Vì image tag bằng `$CI_COMMIT_SHA`, có thể rollback chính xác về version cũ.
- Không xóa image prod cũ ngay sau release.

Database rollback:

- Flyway migration không sửa migration cũ.
- Migration prod phải backward-compatible khi có thể.
- Với migration phá vỡ schema, cần release 2 bước:
  - deploy code tương thích schema cũ + mới.
  - migrate schema.
  - cleanup ở release sau.

Kafka rollback:

- Không đổi topic contract phá vỡ consumer cũ trong cùng release.
- Event schema nên additive.
- Consumer phải idempotent.

## 14. Test plan

### 14.1 Backend

```bash
mvn -f quarkus/pom.xml test
```

Yêu cầu:

- Tất cả module pass.
- Không cần infra thật cho test profile.
- Không phụ thuộc `.env` local.

### 14.2 Frontend

```bash
cd client-react
npm ci
npm run lint
npm run test:run
npm run build
```

E2E:

```bash
npm run test:e2e
```

E2E có thể chạy:

- trong MR nếu thời gian chấp nhận được.
- nightly nếu quá lâu.
- smoke subset sau deploy.

### 14.3 Docker

Kiểm tra:

- build image thành công cho từng service.
- container start được.
- health endpoint UP.
- image không chứa `.env`.

### 14.4 Kubernetes

Trước deploy:

```bash
helm template javanc deploy/helm/javanc -f deploy/helm/javanc/values-dev.yaml
helm upgrade --install javanc deploy/helm/javanc -n javanc-dev --dry-run
```

Sau deploy:

```bash
kubectl rollout status deployment/gateway-service -n javanc-dev
kubectl get pods -n javanc-dev
kubectl get ingress -n javanc-dev
```

### 14.5 Smoke

Dev/test:

- frontend mở được.
- gateway health ready UP.
- login thường hoạt động.
- register + verify email hoạt động.
- Google login hoạt động.
- upload image hoạt động.
- Kafka publish/consume hoạt động.
- email command consumer hoạt động.

Prod:

- chỉ chạy smoke an toàn, không tạo dữ liệu rác không kiểm soát.
- nếu cần test account prod, dùng account riêng có cleanup policy.

## 15. Thứ tự triển khai thực tế

### 15.1 Bảng trạng thái hiện tại

| Phase | Trạng thái ngày `2026-05-17` | Ghi chú |
|---|---|---|
| Phase 1: Chuẩn hóa repo deploy | `Đang làm / gần hoàn tất` | Đã có `.gitignore`, env templates, tài liệu env, config profile, production guardrails, Dockerfile backend/frontend và `.dockerignore`; còn cần xác nhận build image local/CI ổn định |
| Phase 2: GitLab CI validate/test/build | `Chưa bắt đầu` | Chưa có `.gitlab-ci.yml` |
| Phase 3: Build và push images | `Chưa bắt đầu` | Chưa có pipeline publish image |
| Phase 4: Helm chart | `Chưa bắt đầu` | Chưa có `deploy/helm/javanc` |
| Phase 5: Kubernetes foundation | `Chưa thể xác nhận từ repo` | Đây là hạ tầng ngoài repo: namespace, ingress, cert-manager, DNS, pull secret |
| Phase 6: Deploy dev | `Chưa bắt đầu` | Phụ thuộc Phase 2-5 |
| Phase 7: Deploy test | `Chưa bắt đầu` | Phụ thuộc dev pipeline ổn định |
| Phase 8: Deploy prod | `Chưa bắt đầu` | Phụ thuộc manual approval, rollback, smoke, observability |

### Phase 1: Chuẩn hóa repo deploy

- `Đã có`: `.gitignore` exclude `.env`, kubeconfig và secret override.
- `Đã có`: tài liệu env/local runtime và hợp đồng production env.
- `Đã có`: profile config riêng cho `dev/test/prod`.
- `Đã có`: Dockerfile backend production dùng chung.
- `Đã có`: Dockerfile frontend production.
- `Đã có`: `.dockerignore` cho backend/frontend image build.
- `Còn thiếu`: xác nhận build image trong CI và wiring sang pipeline publish.

### Phase 2: GitLab CI validate/test/build

- Tạo `.gitlab-ci.yml`.
- Chạy backend tests.
- Chạy frontend lint/test/build.
- Cache Maven/npm hợp lý.
- Chưa deploy.

### Phase 3: Build và push images

- Build image cho 8 backend services.
- Build image frontend.
- Push GitLab Registry.
- Gắn tag `$CI_COMMIT_SHA`.

### Phase 4: Helm chart

- Tạo chart `deploy/helm/javanc`.
- Template Deployment/Service/Ingress/ConfigMap/Secret.
- Values riêng dev/test/prod.
- Chạy `helm template` và `helm --dry-run`.

### Phase 5: Kubernetes foundation

- Tạo namespaces.
- Cài ingress controller.
- Cài cert-manager.
- Tạo ClusterIssuer.
- Cấu hình DNS.
- Tạo registry pull secret nếu cần.

### Phase 6: Deploy dev

- Deploy từ `develop`.
- Verify health.
- Verify frontend/API domain.
- Fix config/service URLs.

### Phase 7: Deploy test

- Deploy từ `test` hoặc `release/*`.
- Chạy smoke test đầy đủ hơn.
- QA xác nhận.

### Phase 8: Deploy prod

- Deploy từ `main` hoặc tag `v*`.
- Manual approval.
- Monitor rollout.
- Chạy smoke test prod.
- Theo dõi logs/metrics sau release.

## 16. Acceptance criteria

Tài liệu và triển khai được coi là đạt khi:

- Có Docker image build được cho toàn bộ backend/frontend.
- Có GitLab pipeline chạy được validate/test/build/scan/publish.
- Có Helm chart deploy được dev/test/prod.
- Dev/test/prod tách namespace, domain, secrets và managed services.
- Không có secret trong repo.
- Gateway là public backend entrypoint duy nhất.
- Frontend gọi API qua gateway domain.
- Kubernetes readiness/liveness hoạt động.
- HTTPS hoạt động qua Ingress/cert-manager.
- Có rollback bằng Helm.
- Có smoke test sau deploy.
- Prod deploy bắt buộc manual approval.

Theo trạng thái hiện tại ngày `2026-05-17`, các acceptance criteria đã đạt một phần ở mức readiness:

- `Đã đạt`: repo không track secret thật, backend đã có health endpoint, metrics config, production env contract và profile config.
- `Chưa đạt`: Docker image toàn hệ thống, GitLab pipeline, Helm chart, Kubernetes deployment, HTTPS ingress, rollback bằng Helm và smoke test sau deploy.

## 17. Những việc không làm trong phase đầu

- Không deploy production bằng `docker-compose.yml`.
- Không chạy MySQL/MongoDB/Redis/Kafka production trong cùng app cluster nếu đã chọn managed services.
- Không build native image Quarkus ở phase đầu.
- Không đưa secret vào image.
- Không expose service nội bộ trực tiếp ra internet.
- Không đổi business flow auth/register/login/google login trong phase deploy.
