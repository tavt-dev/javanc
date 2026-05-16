# Javanc Pre-CI/CD Readiness Runbook

## 1. Muc tieu va pham vi

Tai lieu nay la runbook cho phase readiness truoc khi bat dau Dockerfile, GitLab CI, Helm chart va Kubernetes deployment.

Phase nay chi lam nen tang:

1. Khoa Java 21 va build baseline.
2. Dong bo local infra, env mau va tai lieu.
3. Giu repo sach khoi secret that.
4. Tach cau hinh Quarkus theo profile file ro rang.
5. Them guardrail production vao runtime config.
6. Xac nhan migration readiness truoc khi di vao CI/CD that.

Khong nam trong phase nay:

- Tao Dockerfile production.
- Tao `.gitlab-ci.yml`.
- Tao Helm chart.
- Deploy Kubernetes.
- Chuyen database production.
- Them Flyway baseline cho `image-service`, `project-service`, `notification-service`.
- Doi business flow auth/register/login/google login.

## 2. Hien trang sau audit

### 2.1 Nen tang repo

- Backend la Maven multi-module trong `quarkus/`.
- Quarkus platform version la `3.33.1`.
- Parent POM dung `maven.compiler.release=21`.
- Frontend la `client-react`, dung React/Vite.
- Local infra gom MySQL, MongoDB, Redis, Kafka, Kafka UI va Mailpit.

| Service | Port | Runtime dependency chinh |
|---|---:|---|
| `gateway-service` | 8080 | Internal service URLs |
| `user-service` | 8088 | MySQL, Redis, Kafka, Google OAuth |
| `profile-service` | 8085 | MongoDB |
| `project-service` | 8086 | MySQL, Kafka |
| `manager-service` | 8091 | MongoDB, Kafka |
| `notification-service` | 8084 | MySQL, Kafka |
| `email-service` | 8087 | MySQL, Kafka, SMTP |
| `image-service` | 8083 | MySQL, Cloudinary/local uploads |

### 2.2 Trang thai readiness

Da co trong repo:

- Maven Enforcer trong `quarkus/pom.xml` de chan Java duoi 21 va Maven duoi 3.9.
- `.gitignore` chan `.env`, `infra.env`, kubeconfig va secret override.
- Kafka dung `apache/kafka:3.7.0`.
- `init-topics.sh` dung dung Apache Kafka CLI path.
- Local infra bat auth cho MySQL, MongoDB va Redis.
- `user-service` da co Redis foundation.
- Tai lieu deployment CI/CD/Kubernetes da co.

Van can chu y truoc khi vao CI/CD:

- Tren mot so may Windows, `java -version` co the la 21 nhung `mvn -version` van la 17 vi `JAVA_HOME` con tro vao JDK 17.
- Local runtime tung bi drift: `infra.env.example` dung MySQL `3307` va Redis co password, trong khi env/docs cu van mo ta `3306` va Redis khong auth.
- `image-service`, `project-service`, `notification-service` van dung `update` cho local/dev; production phai bi khoa ve `validate`.
- Moi service hien dung layout config rieng theo profile thay vi tron tat ca vao mot file:
  - `application.properties`
  - `application-dev.properties`
  - `application-test.properties`
  - `application-prod.properties`
- Hop dong env production tap trung nam tai `quarkus/env/services-prod.env.example`.

## 3. Runbook thuc hien

### 3.1 Khoa Java 21 va build baseline

Kiem tra dong thoi `java`, Maven va `JAVA_HOME`:

```powershell
java -version
mvn -version
echo $env:JAVA_HOME
```

Neu gap tinh huong `java -version` la 21 nhung Maven van hien Java 17, nguyen nhan thuong la:

```text
JAVA_HOME=C:\Program Files\Java\jdk-17
```

Set tam cho terminal hien tai:

```powershell
$env:JAVA_HOME="C:\Program Files\Java\jdk-21"
$env:Path="$env:JAVA_HOME\bin;$env:Path"
mvn -version
```

Set lau dai cho user:

```powershell
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-21", "User")
```

Sau khi Maven dung Java 21:

```powershell
mvn -f quarkus/pom.xml test
```

Neu can co lap theo module:

```powershell
mvn -f quarkus/pom.xml -pl user-service -am test
mvn -f quarkus/pom.xml -pl gateway-service -am test
```

Pass criteria:

- Enforcer fail som neu Java duoi 21.
- `mvn -version` hien Java 21.
- Backend tests pass bang Java 21.

### 3.2 Dong bo local runtime

File runtime local la `quarkus/local/infra.env`; template commit duoc la `quarkus/local/infra.env.example`.

Gia tri baseline:

```env
MYSQL_PORT=3307
MONGODB_CONNECTION_STRING=mongodb://root:javanc_local@localhost:27017/?authSource=admin
REDIS_PORT=6379
REDIS_PASSWORD=javanc_local
```

`quarkus/local/services-local.env` la file runtime local dung that va phai khop voi template `quarkus/local/services-local.env.example`:

- JDBC URLs tro toi `localhost:3307`.
- `MONGODB_CONNECTION_STRING=mongodb://root:javanc_local@localhost:27017/?authSource=admin`.
- `REDIS_URL=redis://:javanc_local@localhost:6379/0`.
- `REDIS_PASSWORD=javanc_local`.

`quarkus/env/services-prod.env.example` la hop dong bien moi truong production tap trung; no phai khop voi `application-prod.properties` va khong duoc chua localhost fallback.

Khoi dong local infra:

```powershell
cd quarkus
.\scripts\local-infra-up.ps1
```

Kiem tra endpoint va service health:

```powershell
.\scripts\local-infra-status.ps1
docker exec javanc-mysql mysqladmin ping -uroot -pjavanc_local --silent
docker exec javanc-mongo mongosh --quiet -u root -p javanc_local --authenticationDatabase admin --eval "db.adminCommand('ping').ok"
docker exec javanc-redis redis-cli -a javanc_local ping
docker exec javanc-kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
```

Expected Kafka topics:

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

Pass criteria:

- MySQL host port duoc tai lieu hoa la `3307`.
- Redis docs va env mau deu dung auth.
- Redis tra `PONG`, MySQL alive, Mongo tra `1`, Kafka list topic thanh cong.

### 3.3 Giu repo sach khoi secret that

Khong commit:

- `.env` that.
- `quarkus/local/infra.env`.
- kubeconfig.
- secret override.
- private key.
- access token.
- password/secret that cua database, mail, Cloudinary, JWT hoac OTP.

Chi commit:

- `.env.example`.
- tai lieu bien moi truong.
- config khong chua secret that.

Audit tracked files:

```powershell
git ls-files | rg "\.env$|infra\.env$|secret|kubeconfig|\.pem$"
```

Audit pattern trong docs/config:

```powershell
rg -n "PASSWORD=|SECRET=|TOKEN=|API_SECRET=|MONGODB_CONNECTION_STRING=|REDIS_URL=|JWT_SECRET=|OTP_HASH_SECRET=|MAIL_PASSWORD=|CLOUDINARY_API_SECRET=" . -g "*.md" -g "*.yml" -g "*.yaml" -g "*.properties" -g ".env.example"
```

Placeholder nhu `change-me` la chap nhan duoc; secret that thi khong.

### 3.4 Layout config theo profile

Moi service Quarkus dung cung mot convention:

```text
application.properties
application-dev.properties
application-test.properties
application-prod.properties
```

Quy tac:

- `application.properties` chi giu cau hinh chung, khong chua `localhost`, `127.0.0.1` hay profile prefix.
- `application-dev.properties` chua local defaults.
- `application-test.properties` chua test-only config.
- `application-prod.properties` chua production guardrails.

Kiem tra nhanh sau khi sua config:

```powershell
rg -n "localhost|127\.0\.0\.1" quarkus -g "application.properties"
rg -n "^%(dev|test|prod)\." quarkus -g "application.properties"
rg -n "localhost|127\.0\.0\.1|update" quarkus -g "application-prod.properties"
```

Expected:

- Base files khong co local assumption.
- Base files khong con `%dev`, `%test`, `%prod`.
- Prod files khong co localhost va khong dung `update`.

### 3.5 Them production guardrails

Production profile phai khong fallback ve localhost neu thieu bien moi truong.

Bat buoc qua `application-prod.properties`:

- MySQL JDBC URL cho `user-service`, `project-service`, `notification-service`, `email-service`, `image-service`.
- MongoDB connection string cho `profile-service`, `manager-service`.
- Internal service URLs cho gateway va cac service goi cheo.
- `GATEWAY_CORS_ORIGINS` cho gateway.
- `LOG_JSON_ENABLED=true` mac dinh trong prod.
- Prometheus metrics tiep tuc bat trong prod.

Schema strategy production:

```env
IMAGE_DB_GENERATION=validate
PROJECT_DB_GENERATION=validate
NOTIFICATION_DB_GENERATION=validate
```

Local/dev co the van dung `update`, nhung production khong duoc tu dong sua schema.

`user-service` hien van co:

```properties
quarkus.http.auth.permission.default.policy=permit
```

Dieu nay chi hop le neu dong thoi dung ca ba dieu kien:

1. `user-service` khong public internet.
2. Gateway la auth guard bat buoc cho protected API.
3. Kubernetes Ingress khong route truc tiep toi `user-service`.

### 3.6 Migration readiness

Da phu hop hon cho production:

- `user-service`: Flyway + `validate`.
- `email-service`: Flyway + `validate`.

Con can lam o phase sau:

- Them Flyway cho `image-service`, `project-service`, `notification-service`.
- Tao baseline migration tu schema hien tai.
- Moi thay doi schema sau do di qua migration versioned.

Trong phase readiness hien tai, muc toi thieu la production khong duoc dung Hibernate `update`.

## 4. Checklist kiem chung truoc khi vao CI/CD

### 4.1 Build/test

```powershell
mvn -version
mvn -f quarkus/pom.xml test
cd client-react
npm run lint
npm run test:run
npm run build
```

Pass criteria:

- Maven dung Java 21.
- Backend test pass.
- Frontend lint/test/build pass.

### 4.2 Secret hygiene

```powershell
git ls-files | rg "\.env$|infra\.env$|secret|kubeconfig|\.pem$"
```

Pass criteria:

- Khong co `.env` that.
- Khong co `infra.env` bi track.
- Khong co kubeconfig hay private key bi track.

### 4.3 Infra smoke

```powershell
cd quarkus
docker compose --env-file local\infra.env up -d
docker exec javanc-redis redis-cli -a javanc_local ping
docker exec javanc-mysql mysqladmin ping -uroot -pjavanc_local --silent
docker exec javanc-mongo mongosh --quiet -u root -p javanc_local --authenticationDatabase admin --eval "db.adminCommand('ping').ok"
docker exec javanc-kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
```

### 4.4 Config audit

Pass criteria:

- `application.properties` khong chua local default hay profile prefix.
- `application-prod.properties` khong fallback ve localhost.
- JDBC config production khong fallback ve localhost.
- Mongo config production khong fallback ve localhost.
- CORS production khong fallback ve localhost.
- Service URLs production deu lay tu env.
- `image-service`, `project-service`, `notification-service` dung `validate` trong prod.
- Chi `client-react` va `gateway-service` duoc public.

## 5. Definition of Done

Phase readiness hoan thanh khi:

- Maven Enforcer chan Java duoi 21.
- Maven local dung JDK 21 va backend tests pass.
- Frontend lint/test/build pass.
- Local env/docs/scripts thong nhat giua `infra.env` runtime va `infra.env.example` template.
- `.gitignore` bao ve env local, kubeconfig va secret override.
- `git ls-files` khong co `.env` that hoac kubeconfig.
- Redis/Kafka/MySQL/Mongo local smoke pass.
- `application-prod.properties` da co guardrails trong runtime config va tai lieu.
- Production schema strategy khong dung Hibernate `update`.
- Worktree duoc gom commit ro rang truoc khi bat dau CI/CD implementation.

## 6. Chien luoc commit de xuat

Neu muon review va rollback de:

```text
build: fix local java 21 baseline and readiness verification
infra: align local runtime docs and env defaults
config: harden production service configuration
docs: turn pre cicd readiness plan into execution runbook
```

Neu can gom it commit hon, chi gom sau khi tat ca acceptance pass.
