# Quarkus Manager Service

Quarkus replacement for `microservice/manager-service`.

## Runtime Contract

- Port: `8091`
- Base path: `/manager`
- Database: MongoDB `microservice-portfolio`
- Collections: `company`, `job`
- Company multipart upload field: `image`
- Health: `/q/health`
- OpenAPI: `/q/openapi`

## Local Run

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path='C:\Program Files\Java\jdk-21\bin;' + $env:Path

$env:MANAGER_SERVICE_PORT='8091'
$env:MONGODB_CONNECTION_STRING='mongodb://root:javanc_local@localhost:27017/?authSource=admin'
$env:MONGODB_DATABASE='microservice-portfolio'
$env:USER_SERVICE_URL='http://localhost:8088'
$env:IMAGE_SERVICE_URL='http://localhost:8083'
$env:PROFILE_SERVICE_URL='http://localhost:8085'
$env:NOTIFICATION_SERVICE_URL='http://localhost:8084'
$env:EMAIL_SERVICE_URL='http://localhost:8087'

.\mvnw.cmd quarkus:dev
```

Run from the `quarkus/manager-service/` directory with:

```powershell
.\mvnw.cmd quarkus:dev
```

From the parent `quarkus/` directory, you can also run:

```powershell
mvn -pl manager-service quarkus:dev
```

## Smoke Test

- `GET http://localhost:8091/q/health`
- `GET http://localhost:8091/manager/user/company/getcompany`
- `POST http://localhost:8091/manager/admin/company/create`
- `POST http://localhost:8091/manager/hr/job/create`

The migrated service preserves the Spring `ApiResponse` wrapper and compatibility names such as `idHR`, `idProfiePending`, and `/manager/setmaanagertocompany`.

Do not commit `.env` or generated `target/` output.
