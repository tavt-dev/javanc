# Email-Service Quarkus Migration Plan

## Purpose

This file is the implementation plan for migrating the current Spring Boot `email-service` to Quarkus with a small DDD-oriented architecture. It is documentation only. It does not create Quarkus code.

The Spring service remains the source of truth until the Quarkus replacement compiles, passes tests, and is verified against the gateway, `user-service`, and `manager-service`.

## Current Service Facts

| Item | Current value | Target value |
|---|---|---|
| Source service | `microservice/email-service` | `quarkus/email-service` |
| Current package | `com.baconbao.email_service` | `com.javanc.email` |
| Current framework | Spring Boot 3.3.2 | Quarkus 3.33 LTS |
| Java version | 21 | 21 |
| Port | 8087 | 8087 |
| Database | none detected | none |
| Main external system | Gmail SMTP through Spring Mail | Quarkus Mailer with environment-backed config |
| Main downstream call | `user-service` `/auth/findbyid` | MicroProfile REST Client |
| Service discovery | Eureka client | No Eureka; config-backed service URLs |
| Current direct caller | `manager-service` `EmailClient` | Preserve `/email/create` contract |

Current dependencies to replace:

- Spring Web -> Quarkus REST Jackson.
- Spring Mail -> Quarkus Mailer.
- OpenFeign -> MicroProfile REST Client.
- Spring Kafka -> SmallRye Reactive Messaging only if an active email topic is implemented.
- Lombok -> avoid if practical in Quarkus target, unless the project standard allows it.
- Eureka client -> removed.

Important secret note:

- The current Spring mail properties contain real SMTP credentials. Do not copy them to Quarkus source, docs, tests, examples, screenshots, or commits.
- The current sender address is hardcoded in Java. Move sender identity to environment-backed config.

## Current Email Domain Contract

### Model

`Mail` is not persisted. It is a transient mail command model.

Fields observed:

- `mailFrom: String`
- `mailTo: String`
- `mailCc: String`
- `mailBcc: String`
- `mailSubject: String`
- `mailContent: String`
- `contentType: String`
- `attachments: List<Object>`
- `mailSendDate: Date`, computed from the getter

Compatibility notes:

- Only `mailFrom`, `mailTo`, `mailSubject`, and `mailContent` are used by the current send path.
- `contentType` is set to `text/plain` but not applied to the `MimeMessageHelper`.
- CC, BCC, attachments, and send date are not used by current endpoints.
- No database entity or repository exists.

### DTOs

Preserve these JSON fields:

`ApiResponse<T>`:

- `success`
- `message`
- `data`

`MessageDTO`:

- `message`
- `id`

`MailDTO`:

- `mailTo`
- `mailSubject`
- `mailContent`

`UserDTO`:

- `id`
- `name`
- `email`
- `password`
- `role`

Compatibility notes:

- `MessageDTO.id` is the target user id, not a message id.
- `MailDTO.mailSubject` and `MailDTO.mailContent` are both populated from `MessageDTO.message`.
- `UserDTO.password` exists in the current DTO shape, but email-service only needs `email`.

## Current Endpoint Contract

Base path: `/email`

| Method | Path | Inputs | Current response |
|---|---|---|---|
| `POST` | `/create` | `MessageDTO` JSON body | `200 OK`, `ApiResponse<String>` with data `"true"` |

Current response message to preserve during baseline:

- Create: `"Check user id successfully"`

Compatibility notes:

- The endpoint returns success after calling `mailService.send(messageDTO)`.
- There is no explicit request validation.
- There is no local exception handler in `email-service`.
- If the user lookup or runtime mail send fails, the exception may bubble out.
- If `MessagingException` occurs inside `sendMail`, the current code prints the stack trace and does not rethrow, so `/email/create` can still return success.

## Current Business Behavior

Current create/send flow:

- Accepts `MessageDTO` with `message` and `id`.
- Calls `user-service` `GET /auth/findbyid?id={id}`.
- Reads `response.data.email` from the user-service response without null checks.
- Builds a `MailDTO`:
  - `mailTo` from the user email.
  - `mailSubject` from `message`.
  - `mailContent` from `message`.
- Builds a `Mail` command:
  - `mailTo` from `MailDTO.mailTo`.
  - `mailSubject` from `MailDTO.mailSubject`.
  - `mailContent` from `MailDTO.mailContent`.
  - `mailFrom` from a hardcoded sender address.
  - `contentType` as `text/plain`.
- Creates a MIME email.
- Sets subject, from, recipient, and text body.
- Sends the email through JavaMailSender.
- Returns `ApiResponse<String>(true, "Check user id successfully", "true")`.

Current mail behavior:

- SMTP host is Gmail.
- SMTP port is 587.
- SMTP auth and STARTTLS are enabled.
- SMTP debug is enabled.
- Connection, read, and write timeouts are set to 5000 milliseconds.
- Mail credentials are hardcoded in current Spring properties and must be replaced by environment variables in Quarkus.

Current Kafka behavior:

- `KafkaConfig` configures a string consumer with bootstrap server `localhost:9092` and group id `email-service-group`.
- `MailServiceImpl` imports `@KafkaListener`, but no active `@KafkaListener` method was found.
- No Kafka topic name or email message schema is currently implemented.
- Baseline migration should preserve HTTP behavior first and treat Kafka as declared-but-unused unless a separate message flow is approved.

## Current REST Client Contract

### User Client

Spring Feign client: `microservice/email-service/.../openfeign/UserClient.java`

Current call:

- `GET /auth/findbyid`, query `id`, response `ApiResponse<UserDTO>`.

Quarkus target:

- Use MicroProfile REST Client with `services.user.url=${USER_SERVICE_URL:http://localhost:8088}`.
- Preserve the path `/auth/findbyid` and query parameter `id`.
- Do not rely on Eureka service names.
- Handle null user responses explicitly only if the compatibility impact is documented.

### Manager Client Consumer

Spring caller: `microservice/manager-service/.../openfeign/EmailClient.java`

Current call:

- `POST /email/create`, body `MessageDTO`, response `ApiResponse<String>`.

Quarkus target:

- Preserve the `/email/create` path, JSON fields, wrapper fields, and success message.
- Verify manager job accept/reject flows after the migration.

## Current Consumers To Verify

Manager service:

- `JobServiceImpl` calls `emailClient.send(messageDTO)`.
- The message text is built from job acceptance behavior.
- The recipient is derived from the profile/user id carried in `MessageDTO.id`.

Gateway:

- Existing route docs do not list `/email/**` in current gateway routes, but the API contract preserves the route family.
- Verify whether email-service is called service-to-service only, or through gateway in any runtime setup.

Angular client:

- No direct Angular email-service call was detected in the current scan.
- Preserve backend contract for manager-service first.

## Current Risks And Cleanup Candidates

Do not silently fix these during baseline unless the phase explicitly allows it:

- Real SMTP credentials exist in Spring config.
- Sender email is hardcoded in Java.
- SMTP debug is enabled in current config.
- `sendMail` catches `MessagingException`, prints a stack trace, and does not fail the endpoint.
- Runtime mail exceptions may still bubble out and return a generic error.
- User lookup response is dereferenced without null checks.
- Missing or invalid `MessageDTO.id` can cause downstream lookup failure.
- Missing `MessageDTO.message` can send a null subject/body.
- `MailDTO.mailSubject` and `mailContent` are both set from the same message.
- Kafka dependency/config exists, but no active listener was found.
- `MailService` interface is annotated with `@Service`, which is unusual Spring structure.
- Current logs mention email send activity; avoid logging SMTP credentials or full sensitive payloads in Quarkus.

## Target DDD Architecture

Use a lightweight DDD structure. The email domain has no persistence, so the goal is clear boundaries around the mail send use case and external adapters.

Target package root:

```text
com.javanc.email
```

Recommended package layout:

```text
domain/
  model/          MailMessage, MailRecipient
application/
  dto/            ApiResponse, MessageDTO, MailDTO, UserDTO
  port/           MailSenderPort, UserLookupPort
  service/        EmailApplicationService
infrastructure/
  mail/           QuarkusMailerAdapter
  client/         UserClient, UserServiceAdapter
  messaging/      EmailMessageConsumer if Kafka is enabled
  config/         MailConfig
interfaces/
  rest/
    resource/     EmailResource
  rest/exception/ exception mappers
```

DDD boundary rules:

- The application service owns the use case: resolve target user, build mail message, send mail, return success.
- The domain model represents a mail command only; do not add persistence.
- Quarkus Mailer is infrastructure, not domain logic.
- User-service lookup is infrastructure behind `UserLookupPort`.
- Kafka is infrastructure and should not shape the HTTP contract unless an active event flow is approved.
- The REST resource adapts HTTP JSON to the application service and preserves current API compatibility.
- Keep the DDD split small; do not add templates, retries, queues, or notification policies during baseline unless explicitly requested.

Suggested ports:

- `UserLookupPort.findEmailByUserId(Integer id): String`
- `MailSenderPort.send(MailMessage message): void`

Suggested adapters:

- `UserServiceAdapter` uses MicroProfile REST Client and unwraps `ApiResponse<UserDTO>`.
- `QuarkusMailerAdapter` maps `MailMessage` to Quarkus Mailer `Mail`.
- `EmailMessageConsumer` is optional and should only be added if a current or new Kafka topic contract is defined.

## Phase 0: Source Inventory And Contract Freeze

Goal: capture current behavior before writing Quarkus code.

Tasks:

- Inspect all files under `microservice/email-service/src/main/java/com/baconbao/email_service`.
- Freeze endpoint path, method, request body fields, response wrapper, and status behavior listed in this document.
- Freeze downstream user-service call: `GET /auth/findbyid?id=...`.
- Freeze direct caller expectations from manager-service `EmailClient`.
- Confirm whether `/email/**` is ever routed through gateway or only called by manager-service.
- Decide per known risk whether baseline preserves it or documents a safe intentional fix.

Deliverables:

- Updated docs only if new facts are discovered.
- No Java code.
- No Quarkus scaffold.

Acceptance:

- Future implementer can list exact files to create and modify.
- No unresolved endpoint, DTO field, mail config, or downstream path ambiguity remains for baseline migration.

## Phase 1: Quarkus Module Scaffold

Goal: create the minimum Quarkus module for `email-service` only.

Target files when implementation begins:

- `quarkus/email-service/pom.xml`.
- `quarkus/email-service/src/main/resources/application.properties`.
- Initial package root: `quarkus/email-service/src/main/java/com/javanc/email`.
- Initial test package root: `quarkus/email-service/src/test/java/com/javanc/email`.

Required Quarkus extensions:

- `quarkus-rest-jackson`
- `quarkus-rest-client-jackson`
- `quarkus-hibernate-validator`
- `quarkus-mailer`
- `quarkus-smallrye-health`
- `quarkus-smallrye-openapi`
- `quarkus-messaging-kafka` only if a Kafka listener or channel is implemented in the baseline
- test dependencies used by Quarkus defaults

Config defaults:

```properties
quarkus.application.name=email-service
quarkus.http.port=${EMAIL_SERVICE_PORT:8087}

services.user.url=${USER_SERVICE_URL:http://localhost:8088}

quarkus.mailer.host=${MAIL_HOST:smtp.gmail.com}
quarkus.mailer.port=${MAIL_PORT:587}
quarkus.mailer.username=${MAIL_USERNAME:}
quarkus.mailer.password=${MAIL_PASSWORD:}
quarkus.mailer.from=${MAIL_FROM:}
quarkus.mailer.start-tls=${MAIL_START_TLS:REQUIRED}
quarkus.mailer.login=${MAIL_LOGIN:REQUIRED}
quarkus.mailer.mock=${MAIL_MOCK:false}
mail.timeout-millis=${MAIL_TIMEOUT_MILLIS:5000}

kafka.bootstrap.servers=${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}
email.kafka.group-id=${EMAIL_KAFKA_GROUP_ID:email-service-group}
```

Rules:

- Do not include real mail username, password, or sender values.
- Do not recreate Eureka configuration.
- Keep default port `8087`.
- Keep `quarkus.mailer.mock=true` in test profile so tests do not send real email.

Acceptance:

- `email-service` module exists.
- It compiles with no business logic.
- No Eureka dependency exists.
- Mail, user-service URL, and optional Kafka settings are environment-backed.
- No real secret exists in config.

## Phase 2: DTO And Domain Model Migration

Goal: port external JSON contracts and create a small domain mail command.

Target packages:

- `com.javanc.email.application.dto`
- `com.javanc.email.domain.model`

Create:

- `ApiResponse<T>`
- `MessageDTO`
- `MailDTO`
- `UserDTO`
- `MailMessage`

Rules:

- Preserve JSON field names exactly.
- Preserve `MessageDTO.id` as `Integer`.
- Preserve `MessageDTO.message` as `String`.
- Preserve `ApiResponse` fields `success`, `message`, and `data`.
- Avoid exposing or using `UserDTO.password` in application logic even if the field exists for compatibility.
- Keep `MailMessage` focused on sender, recipient, subject, body, and content type.

Acceptance:

- JSON serialization tests prove `ApiResponse` fields are `success`, `message`, and `data`.
- JSON serialization tests prove `MessageDTO` fields are `message` and `id`.
- Mapping tests prove `MessageDTO.message` becomes both mail subject and content during baseline.

## Phase 3: User Lookup Client Migration

Goal: port the user-service dependency behind an application port.

Target packages:

- `com.javanc.email.application.port`
- `com.javanc.email.infrastructure.client`

Create:

- `UserLookupPort`.
- `UserClient` MicroProfile REST Client.
- `UserServiceAdapter`.

Rules:

- Preserve `GET /auth/findbyid`.
- Preserve query parameter name `id`.
- Use `USER_SERVICE_URL` through config.
- Do not add Eureka.
- Baseline behavior may keep null-sensitive failures, but tests should document the result.
- Preferred safe baseline: translate missing user/email into a clear application exception while preserving response shape if an exception mapper is added.

Acceptance:

- Client contract test or adapter unit test verifies path `/auth/findbyid` and query `id`.
- Application service tests can stub `UserLookupPort`.
- No hardcoded localhost exists in Java code.

## Phase 4: Mail Sender Infrastructure Migration

Goal: replace Spring Mail with Quarkus Mailer.

Target packages:

- `com.javanc.email.application.port`
- `com.javanc.email.infrastructure.mail`
- `com.javanc.email.infrastructure.config`

Create:

- `MailSenderPort`.
- `QuarkusMailerAdapter`.
- `MailConfig` or config mapping for sender/from and timeout values.

Rules:

- Use environment-backed mail host, port, username, password, sender, TLS, and mock settings.
- Preserve text/plain body behavior.
- Preserve subject/body mapping from `MessageDTO.message`.
- Do not log credentials.
- Do not enable SMTP debug by default in Quarkus.
- Decide explicitly whether mail failures preserve current swallowed `MessagingException` behavior or return an error. Baseline recommendation: fail clearly in application tests, but document this as an intentional compatibility improvement.

Acceptance:

- Unit tests can stub `MailSenderPort`.
- Quarkus mailer tests run with mock mode and do not send real email.
- Missing mail config is handled clearly for real runtime profiles.

## Phase 5: Application Service Migration

Goal: port the send-email use case.

Target package:

- `com.javanc.email.application.service`

Create:

- `EmailApplicationService`.

Rules:

- Preserve flow: receive message, lookup user email, build mail command, send mail.
- Preserve response data `"true"` and message `"Check user id successfully"` at the REST boundary.
- Preserve `MailDTO.mailSubject = MessageDTO.message` and `MailDTO.mailContent = MessageDTO.message`.
- Do not add database writes.
- Do not introduce email templates during baseline.
- Do not add new notification or retry behavior during baseline.

Acceptance:

- Unit tests cover successful send.
- Unit tests cover missing user id behavior.
- Unit tests cover missing user email behavior.
- Unit tests cover mail sender failure behavior and document whether it is compatible or intentionally safer than Spring.

## Phase 6: REST Resource Migration

Goal: expose `/email/**` endpoints with compatible behavior.

Target package:

- `com.javanc.email.interfaces.rest.resource`

Create:

- `EmailResource` with base path `/email`.

Endpoint rules:

- Preserve `POST /email/create`.
- Consume JSON.
- Produce JSON.
- Preserve request body fields `message` and `id`.
- Preserve HTTP `200 OK` on success.
- Preserve response wrapper shape.
- Preserve success response:
  - `success=true`
  - `message="Check user id successfully"`
  - `data="true"`

Acceptance:

- Resource test verifies success response shape.
- Resource test verifies the application service receives the expected `id` and `message`.
- Resource test documents current or intentionally improved behavior for invalid request bodies.

## Phase 7: Optional Kafka Migration

Goal: decide whether Kafka belongs in the baseline email-service migration.

Current facts:

- Spring Kafka dependency and consumer config exist.
- No active listener method or topic contract was found.
- No current producer path in email-service was found.

Baseline recommendation:

- Do not implement a Kafka consumer in the first Quarkus email-service pass unless a topic name, payload schema, and producer are confirmed.
- Keep Kafka properties documented for future messaging alignment.
- Add `quarkus-messaging-kafka` only if the implementation includes an actual `@Incoming` channel.

If Kafka is approved later:

- Define topic name, message schema, consumer group, retry/dead-letter behavior, and idempotency expectations.
- Map incoming message payload to `MessageDTO`.
- Reuse `EmailApplicationService` so HTTP and Kafka paths share the same use case.
- Test with an in-memory connector or test Kafka profile.

Acceptance:

- Baseline migration either excludes Kafka code with a documented reason, or includes a tested `@Incoming` channel with an explicit topic contract.

## Phase 8: Exceptions And Error Responses

Goal: replace implicit Spring failure behavior with Quarkus exception mappers where needed.

Target package:

- `com.javanc.email.interfaces.rest.exception`

Create if needed:

- `ErrorCode`.
- `EmailApplicationException`.
- `UserLookupException`.
- `MailSendException`.
- Exception mappers returning `ApiResponse<String>` with `success=false`.

Rules:

- Preserve success response exactly.
- Avoid stack traces in responses.
- Avoid logging SMTP credentials, tokens, or raw secrets.
- Document any intentional difference from Spring's swallowed `MessagingException` behavior.
- Keep error `data=""` if following the existing service family convention.

Acceptance:

- Tests verify user lookup failure behavior.
- Tests verify mail send failure behavior.
- Tests verify generic exceptions do not expose secrets.

## Phase 9: Test Plan

Goal: prove baseline compatibility without sending real email.

Minimum tests:

- `POST /email/create` with `{"message":"...", "id":1}` returns HTTP `200`.
- Success response has `success=true`, message `"Check user id successfully"`, and data `"true"`.
- Application service calls user lookup with `MessageDTO.id`.
- Application service sends mail to the email returned by user-service.
- Subject and body both equal `MessageDTO.message`.
- Mail sender failure behavior is tested and documented.
- Missing user or missing user email behavior is tested and documented.
- DTO serialization preserves `ApiResponse`, `MessageDTO`, `MailDTO`, and `UserDTO` field names.
- REST client path test verifies `/auth/findbyid?id=...`.

Test infrastructure:

- Prefer Quarkus tests.
- Use `quarkus.mailer.mock=true` in test profile.
- Stub `UserLookupPort` for resource and application tests.
- Do not require production SMTP credentials.
- Do not require Kafka unless an actual Kafka channel is implemented.

## Phase 10: Run Readiness For Quarkus email-service

Goal: make the migrated Quarkus `email-service` easy to run locally against user-service and SMTP.

Runtime facts:

- Default port remains `8087`.
- Health endpoint is `/q/health`.
- OpenAPI endpoint is `/q/openapi`.
- Email base path remains `/email`.
- User lookup depends on `USER_SERVICE_URL`.
- Real mail sending requires mail environment variables.

Required documentation and templates:

- Add `quarkus/email-service/README.md` with project-specific run instructions.
- Add `quarkus/email-service/.env.example` with placeholders only:
  - `EMAIL_SERVICE_PORT=8087`
  - `USER_SERVICE_URL=http://localhost:8088`
  - `MAIL_HOST=smtp.gmail.com`
  - `MAIL_PORT=587`
  - `MAIL_USERNAME=change-me`
  - `MAIL_PASSWORD=change-me`
  - `MAIL_FROM=change-me`
  - `MAIL_START_TLS=REQUIRED`
  - `MAIL_LOGIN=REQUIRED`
  - `MAIL_MOCK=false`
  - `MAIL_TIMEOUT_MILLIS=5000`
  - `KAFKA_BOOTSTRAP_SERVERS=localhost:9092`
  - `EMAIL_KAFKA_GROUP_ID=email-service-group`

Local run command from `quarkus/email-service`:

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

Manual smoke after startup:

- `GET /q/health` returns healthy.
- `POST /email/create` with a user id that exists in user-service returns the success wrapper.
- The configured mailbox sends a real message only when `MAIL_MOCK=false`.
- With `MAIL_MOCK=true`, the endpoint can be tested without sending real email.

Commit hygiene:

- Do not commit `quarkus/email-service/.env`.
- Do not commit real SMTP credentials.
- Do not commit `quarkus/email-service/.idea/`.
- Do not commit `quarkus/email-service/target/`.
- Commit `.env.example` because it contains placeholders only.

Acceptance:

- A developer can run `email-service` locally without Eureka.
- Runtime setup is explicit about port, user-service URL, mail host, mail credentials, sender, and mock mode.
- No real secret is added to source control.
- No business behavior changes are introduced by this phase unless documented as intentional safety fixes.

## Phase 11: Gateway And Downstream Integration

Goal: verify the migrated Quarkus email-service works with current or future gateway and dependent services.

Compatibility checks:

- `manager-service` can call `POST /email/create`.
- `email-service` can call migrated or Spring `user-service` `GET /auth/findbyid`.
- The endpoint response still satisfies `manager-service` `ApiResponse<String>`.
- Gateway behavior for `/email/**` is clarified before exposing email-service publicly.

Known integration points:

- `manager-service` accepts or rejects job applications and sends email through `EmailClient`.
- `user-service` must return `ApiResponse<UserDTO>` with a non-null `email` for the target id.
- No Angular direct consumer was detected, but preserve route family compatibility.

Acceptance:

- Manager job acceptance flow can trigger email-service successfully.
- User lookup path works with the currently active user-service implementation.
- Any gateway route gap for `/email/**` is documented before gateway migration.

## Phase 12: Hardening After Baseline

Only perform after baseline is verified.

Candidate cleanup:

- Add request validation for `MessageDTO.id` and `MessageDTO.message`.
- Return clear `ApiResponse` errors for missing user, missing email, and mail send failures.
- Add an email template model instead of using the same string for subject and body.
- Add async send or queue-based processing if product flow needs resilience.
- Define and implement Kafka topic consumption only after a topic contract exists.
- Disable SMTP debug by default and expose it only through explicit local config.
- Add retry/backoff around transient mail failures if needed.
- Remove password from `UserDTO` once cross-service compatibility allows it.
- Add OpenAPI examples for `/email/create`.
- Decide whether `/email/**` should be gateway-protected before public exposure.

## Implementation Stop Conditions

Stop and ask before proceeding if:

- The team wants mail failures to be swallowed exactly like the current `MessagingException` branch.
- A Kafka topic must be implemented during baseline but topic name or payload schema is unknown.
- The sender address must remain compatible with the old hardcoded value but no environment variable is provided.
- Manager-service expects `/email/create` through gateway and no route exists.
- User-service lookup path differs from `/auth/findbyid`.
- SMTP provider changes from Gmail to another provider with different TLS/login behavior.

## Final Deliverables For Actual Migration

When implementation is requested later, the final response must include:

- Files created.
- Files modified.
- Endpoints implemented.
- DDD packages and boundaries implemented.
- User-service REST client implemented.
- Mailer configuration variables.
- Kafka decision and any implemented channels.
- Compatibility differences.
- How to run `email-service`.
- How to test it.
- Remaining risks before migrating `manager-service` or `gateway-service`.
