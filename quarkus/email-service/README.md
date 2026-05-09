# Quarkus Email Service

Quarkus replacement for `microservice/email-service`.

## Runtime Contract

- Port: `8087`
- Base path: `/email`
- Main endpoint: `POST /email/create`
- User lookup: `GET /auth/findbyid` through `USER_SERVICE_URL`
- Mail transport: Quarkus Mailer
- Health: `/q/health`
- OpenAPI: `/q/openapi`

## Local Run

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path='C:\Program Files\Java\jdk-21\bin;' + $env:Path

$env:EMAIL_SERVICE_PORT='8087'
$env:USER_SERVICE_URL='http://localhost:8088'
$env:MAIL_HOST='smtp.gmail.com'
$env:MAIL_PORT='587'
$env:MAIL_USERNAME='<local-mail-username>'
$env:MAIL_PASSWORD='<local-mail-app-password>'
$env:MAIL_FROM='<local-mail-from-address>'
$env:MAIL_MOCK='false'

.\mvnw.cmd quarkus:dev
```

Run from the `quarkus/email-service/` directory with:

```powershell
.\mvnw.cmd quarkus:dev
```

From the parent `quarkus/` directory, you can also run:

```powershell
mvn -pl email-service quarkus:dev
```

## Smoke Test

- `GET http://localhost:8087/q/health`
- `POST http://localhost:8087/email/create`

Example request:

```json
{
  "message": "accept job successful byjava",
  "id": 1
}
```

Successful response preserves the Spring wrapper:

```json
{
  "success": true,
  "message": "Check user id successfully",
  "data": "true"
}
```

Use `MAIL_MOCK=true` for local endpoint testing without sending real email. Do not commit `.env`, real SMTP credentials, or generated `target/` output.
