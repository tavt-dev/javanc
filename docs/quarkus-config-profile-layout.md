# Quarkus Config Profile Layout

Tat ca service trong `quarkus/` dung cung mot layout:

```text
src/main/resources/
  application.properties
  application-dev.properties
  application-test.properties
  application-prod.properties
```

## File nao chua gi

### `application.properties`

File base rat mong:

- ten ung dung;
- port mac dinh;
- topic/channel names;
- serializer/deserializer;
- timeout chung;
- cac property co cung y nghia o moi moi truong.

Khong dat trong file nay:

- `localhost`;
- `127.0.0.1`;
- `%dev`, `%test`, `%prod`;
- secret that;
- fallback local cho production-only dependency.

### `application-dev.properties`

Chi chua local/dev defaults:

- JDBC, Mongo, Redis, Kafka local;
- internal service URLs local;
- local CORS;
- local mail transport nhu Mailpit;
- JSON log local;
- Flyway dev baseline;
- schema `update` neu service hien tai van can cho local.

### `application-test.properties`

Chi chua test-only config:

- H2;
- Mongo dev services;
- fake URLs;
- mock mailer;
- test secret;
- messaging tat;
- admin bootstrap test.

### `application-prod.properties`

Chi chua production guardrails:

- JDBC/Mongo/service URLs phai lay tu bien moi truong ro rang;
- gateway CORS phai lay tu `GATEWAY_CORS_ORIGINS`;
- JSON log mac dinh bat;
- Prometheus metrics giu bat;
- schema production dung `validate` cho cac service chua co Flyway baseline.

## Cach chay

Dev mode mac dinh:

```powershell
mvn -f quarkus/pom.xml -pl user-service quarkus:dev
```

Test:

```powershell
mvn -f quarkus/pom.xml test
```

Prod profile:

```powershell
mvn -f quarkus/pom.xml -pl user-service quarkus:run -Dquarkus.profile=prod
```

Trong production, truyen bien moi truong tu secret/config management cua platform; khong dua vao fallback local.

## Audit nhanh

```powershell
rg -n "localhost|127\.0\.0\.1" quarkus -g "application.properties"
rg -n "^%(dev|test|prod)\." quarkus -g "application.properties"
rg -n "localhost|127\.0\.0\.1|update" quarkus -g "application-prod.properties"
```

Neu ba lenh tren co output bat ngo, config da bat dau drift khoi convention.
