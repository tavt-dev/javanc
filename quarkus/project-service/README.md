# Project Service

Quarkus replacement for the Spring `project-service`.

## Run locally

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path='C:\Program Files\Java\jdk-21\bin;' + $env:Path

$env:PROJECT_SERVICE_PORT='8086'
$env:MYSQL_USERNAME='root'
$env:MYSQL_PASSWORD='<local-mysql-password>'
$env:PROJECT_MYSQL_JDBC_URL='jdbc:mysql://localhost:3306/project1?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true'
$env:USER_SERVICE_URL='http://localhost:8088'
$env:IMAGE_SERVICE_URL='http://localhost:8083'
$env:PROFILE_SERVICE_URL='http://localhost:8085'
$env:NOTIFICATION_SERVICE_URL='http://localhost:8084'

.\mvnw.cmd quarkus:dev
```

## Smoke checks

- `GET /q/health`
- `POST /project/user/save`
- `POST /project/user/update`
- `GET /project/user/getProject?id=<profileId>`
- `GET /project/user/getProfile`
- `GET /project/user/get1`
