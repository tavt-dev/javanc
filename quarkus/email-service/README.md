# Quarkus Email Service

Quarkus replacement for `microservice/email-service`.

## Runtime Contract

- Port: `8087`
- Base path: `/email`
- Main endpoint: `POST /email/create`
- Internal OTP endpoint: `POST /internal/emails/verification-otp`
- User lookup: `GET /users/{id}` through `USER_SERVICE_URL`
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
- `POST http://localhost:8087/internal/emails/verification-otp`

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

Internal verification OTP request:

```json
{
  "to": "user@example.com",
  "name": "User",
  "otp": "123456",
  "expiresInMinutes": 10
}
```

`/internal/emails/verification-otp` is intended for `user-service` only and is not exposed through `gateway-service`.

## Optional Kafka Consumer

Kafka is disabled by default so the HTTP email flow keeps working without broker infrastructure.

To enable the async email command consumer locally:

```powershell
docker compose -f ..\..\docker-compose.kafka.yml up -d

$env:EMAIL_KAFKA_ENABLED='true'
$env:KAFKA_BOOTSTRAP_SERVERS='localhost:9092'
$env:EMAIL_COMMAND_TOPIC='javanc.email.command.v1'
$env:EMAIL_COMMAND_DLT_TOPIC='javanc.email.command.v1.dlt'

.\mvnw.cmd quarkus:dev
```

Supported command payloads can either target a user id and reuse the existing user lookup flow:

```json
{
  "commandId": "cmd-1",
  "recipientUserId": 12,
  "subject": "Application accepted",
  "body": "Application accepted"
}
```

Or send directly to an email address:

```json
{
  "commandId": "cmd-2",
  "to": "user@example.com",
  "subject": "Application accepted",
  "body": "Application accepted"
}
```

Use `MAIL_MOCK=true` for local endpoint testing without sending real email. Do not commit `.env`, real SMTP credentials, or generated `target/` output.
