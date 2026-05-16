# Quarkus notification-service

Quarkus migration of the Spring Boot `notification-service`.

## Contract

- Base path: `/notification`
- Port: `8084`
- Database: MySQL `notification1`
- Table: `notifications`
- User validation: `GET /users/{id}` through `USER_SERVICE_URL`
- Kafka is not part of the baseline runtime because the Spring service has no active listener or producer flow.

## Local Run

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path='C:\Program Files\Java\jdk-21\bin;' + $env:Path

$env:NOTIFICATION_SERVICE_PORT='8084'
$env:MYSQL_USERNAME='root'
$env:MYSQL_PASSWORD='<local-mysql-password>'
$env:NOTIFICATION_MYSQL_JDBC_URL='jdbc:mysql://localhost:3307/notification1?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&useLegacyDatetimeCode=false&allowPublicKeyRetrieval=true'
$env:USER_SERVICE_URL='http://localhost:8088'

.\mvnw.cmd quarkus:dev
```

## Useful Endpoints

- `GET /q/health`
- `GET /q/openapi`
- `GET /notification/getAll`
- `POST /notification/create`
- `POST /notification/update`
- `GET /notification/user/findByUser?userId=<id>`

## Test

```powershell
.\mvnw.cmd test
```

From the parent reactor:

```powershell
cd ..
mvn test
```

## Environment

Use `.env.example` as the local template. Do not commit `.env`, `target/`, or IDE files.
