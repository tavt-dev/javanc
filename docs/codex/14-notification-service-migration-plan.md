# Notification-Service Quarkus Migration Plan

## Purpose

This file is the implementation plan for migrating the current Spring Boot `notification-service` to Quarkus. It is documentation only. It does not create Quarkus code.

The Spring service remains the source of truth until the Quarkus replacement compiles, passes tests, and is verified against the Angular client, gateway, `user-service`, `manager-service`, and `project-service` compatibility calls.

The next service after the already migrated `user-service`, `image-service`, and `profile-service` is `notification-service`, matching the order in `05-service-mapping.md` and `09-feature-roadmap.md`.

## Current Service Facts

| Item | Current value | Target value |
|---|---|---|
| Source service | `microservice/notification-service` | `quarkus/notification-service` |
| Current package | `com.baconbao.notification_service` | `com.javanc.notification` |
| Current framework | Spring Boot 3.3.2 | Quarkus 3.33 LTS |
| Java version | 21 | 21 |
| Port | 8084 | 8084 |
| Persistence | Spring Data JPA + MySQL | Hibernate ORM with Panache or explicit repository |
| Database | MySQL `notification1` | MySQL `notification1` |
| Table | `notifications` | `notifications` |
| Entity id type | `Integer` | `Integer` |
| Service discovery | Eureka client | No Eureka; config-backed service URLs |
| Main downstream call | `user-service` | MicroProfile REST Client |
| Kafka state | Spring Kafka config exists, but no active listener method exists | Do not make Kafka part of baseline behavior unless a real flow is added |
| Gateway behavior | `/notification/**` has no auth filter in current gateway config | Preserve current behavior first |

Current dependencies to replace:

- Spring Web -> Quarkus REST Jackson.
- Spring Data JPA -> Hibernate ORM with Panache or explicit repository.
- MySQL connector -> Quarkus JDBC MySQL.
- OpenFeign -> MicroProfile REST Client.
- ModelMapper -> explicit mapper.
- Spring Kafka config -> SmallRye Reactive Messaging only if a real Kafka listener or producer flow is implemented later.
- Lombok -> avoid if practical in Quarkus target.
- Eureka client -> removed.

## Current Notification Domain Contract

### Entity

`Notification` maps to MySQL table `notifications`.

Fields to preserve:

- `id: Integer`
- `message: String`
- `createAt: LocalDateTime`
- `idUser: Integer`
- `url: String`
- `isRead: boolean`

Compatibility notes:

- `id` is manually generated from UUID most-significant bits and cast to `Integer`.
- No generated-value database strategy is used.
- `createAt` is set with `LocalDateTime.now()` when a notification is created from `MessageDTO`.
- New notifications created through `/notification/create` are unread by default.

### DTOs

Preserve these JSON fields:

`ApiResponse<T>`:

- `success`
- `message`
- `data`

`MessageDTO`:

- `message`
- `id`

`NotificationDTO`:

- `id`
- `message`
- `createAt`
- `url`
- `read`
- `idUser`

`UserDTO`:

- `id`
- `name`
- `email`
- `password`
- `idEmployee`
- `role`
- `isActive`

Important compatibility note:

- Spring/Lombok field `isRead` is consumed by the Angular client as JSON field `read`.
- The Quarkus `NotificationDTO` must serialize read state as `read`.
- Accept `isRead` as a deserialization alias if practical, but do not break current Angular usage of `read`.

## Current Endpoint Contract

Base path: `/notification`

| Method | Path | Inputs | Current response |
|---|---|---|---|
| `POST` | `/create` | `MessageDTO` JSON body | `200 OK`, `ApiResponse<String>` with message `"Create is success"` and data `"true"` |
| `POST` | `/update` | `NotificationDTO` JSON body | `200 OK`, `ApiResponse<NotificationDTO>` with message `"Update is success"` |
| `GET` | `/user/findByUser` | query `userId` | `200 OK`, `ApiResponse<List<NotificationDTO>>` with message `"Find is success"` |
| `GET` | `/getAll` | none | `200 OK`, `ApiResponse<String>` with message `"Find is success"` and data `"ok"` |

Do not expose new public endpoints during the baseline migration, even though the current service interface has internal methods for `findById` and `seenNotification`.

## Current Business Behavior

Current create endpoint:

- Accepts `MessageDTO` JSON.
- Calls `NotificationService.send(messageDTO)`.
- Returns `ApiResponse<String>` with `success=true`, message `"Create is success"`, and data `"true"`.
- The response does not return the saved notification.

Current `send` logic:

- Builds a `NotificationDTO` from the message payload.
- Sets `message` from `MessageDTO.message`.
- Sets `idUser` from `MessageDTO.id`.
- Sets `read=false`.
- Leaves `url=null`.
- Delegates to `create(NotificationDTO)`.

Current save logic:

- Generates a random manual `Integer` id from UUID bits.
- Sets `createAt=LocalDateTime.now()`.
- Persists a row in table `notifications`.
- Maps the saved entity back to `NotificationDTO`.
- Maps `DataIntegrityViolationException` to `NOTIFICATION_UNABLE_TO_SAVE`.
- Maps `DataAccessException` to `DATABASE_ACCESS_ERROR`.

Current update logic:

- Accepts a `NotificationDTO`.
- Maps it directly to `Notification`.
- Saves it through the repository.
- Does not check whether the notification exists before saving.
- Returns the saved `NotificationDTO`.

Current find-by-user logic:

- Calls user-service `/auth/checkId?id=...` before querying notifications.
- If the user check returns false, throws `DATABASE_ACCESS_ERROR`.
- Queries all notifications where `idUser` equals the query parameter.
- Returns a list mapped to `NotificationDTO`.

Current get-all compatibility endpoint:

- Does not return stored notifications.
- Returns `ApiResponse<String>` with data `"ok"`.

## Current REST Client Contract

Spring Feign client: `microservice/notification-service/.../openFeign/UserClient.java`

Current calls:

- `GET /auth/checkId`, query `id`, response `ApiResponse<Boolean>`.
- `GET /auth/getCurrentUser`, response `ApiResponse<UserDTO>`.

Quarkus target:

- Use MicroProfile REST Client with `services.user.url=${USER_SERVICE_URL:http://localhost:8088}`.
- Preserve `GET /auth/checkId?id=...` because `findByUser` depends on it.
- Port `GET /auth/getCurrentUser` for parity only; it is present in the Spring client but not used by the current notification service logic.

## Kafka Compatibility Notes

The Spring service includes `KafkaConfig` with:

- bootstrap servers `localhost:9092`
- group id `email-service-group`
- `StringDeserializer` for key and value

However:

- No active `@KafkaListener` method exists in the current notification service.
- `NotificationServiceImpl` imports `KafkaListener`, but no listener is declared.
- Current public notification behavior is HTTP-driven.

Baseline Quarkus migration should not introduce Kafka as required runtime infrastructure. Add `quarkus-messaging-kafka` only when a real listener or producer flow is implemented and documented.

## Current Consumers To Verify

Angular client:

- Calls gateway URL `http://localhost:8080/notification/create`.
- Calls `POST /notification/update`.
- Calls `GET /notification/user/findByUser?userId=...`.
- Maps response notification read state from `notificationDTO.read`.

Manager service:

- Calls `POST /notification/create` through `NotificationClient`.
- Uses `MessageDTO.message` and `MessageDTO.id`.

Project service:

- Contains a test Feign client calling `GET /notification/getAll`.

Gateway:

- Current route `/notification/**` forwards to notification-service without `AuthenticationFilter`.
- Baseline notification-service should not implement its own JWT validation unless the gateway migration plan changes this behavior.

## Current Risks And Cleanup Candidates

Do not silently fix these during baseline unless the phase explicitly allows it:

- `/notification/**` is currently not protected by the gateway auth filter.
- `findByUser` maps a false user check to `DATABASE_ACCESS_ERROR`, not a client-facing user-not-found error.
- `update` can create or overwrite rows because it saves the mapped DTO directly.
- No public endpoint exposes `seenNotification`, even though the service method exists.
- No public endpoint exposes `findById`, even though the service method exists.
- Random integer id generation can collide.
- Kafka configuration exists but no listener behavior exists.
- Kafka group id is named `email-service-group`, which appears inconsistent for notification-service.
- Generic exception handling exposes exception messages in the response.
- `UserDTO` includes `password` for downstream compatibility.
- Boolean naming differs between entity field `isRead` and Angular JSON field `read`.

## Phase 0: Source Inventory And Contract Freeze

Goal: capture current behavior before writing Quarkus code.

Tasks:

- Inspect all files under `microservice/notification-service/src/main/java/com/baconbao/notification_service`.
- Freeze endpoint paths, methods, query names, response wrappers, and response messages listed in this document.
- Freeze database contract: MySQL `notification1`, table `notifications`, id `Integer`.
- Freeze DTO contract, especially `NotificationDTO.read` JSON compatibility.
- Confirm no active Kafka listener exists despite Kafka config and imports.
- Decide per known risk whether baseline preserves it or documents a safe intentional fix.

Deliverables:

- Updated docs only if new facts are discovered.
- No Java code.
- No Quarkus scaffold.

Acceptance:

- Future implementer can list exact files to create and modify.
- No unresolved endpoint, DTO field, database, or Kafka ambiguity remains for baseline migration.

## Phase 1: Quarkus Module Scaffold

Goal: create the minimum Quarkus module for `notification-service` only.

Target files when implementation begins:

- `quarkus/notification-service/pom.xml`.
- `quarkus/notification-service/src/main/resources/application.properties`.
- Initial package root: `quarkus/notification-service/src/main/java/com/javanc/notification`.
- Initial test package root: `quarkus/notification-service/src/test/java/com/javanc/notification`.
- Add `notification-service` to `quarkus/pom.xml` modules.

Required Quarkus extensions:

- `quarkus-rest-jackson`
- `quarkus-rest-client-jackson`
- `quarkus-hibernate-validator`
- `quarkus-hibernate-orm-panache`
- `quarkus-jdbc-mysql`
- `quarkus-smallrye-health`
- `quarkus-smallrye-openapi`
- test dependencies used by Quarkus defaults, plus H2 for isolated repository tests if used

Do not add Kafka extension in the baseline unless a real listener or producer is implemented.

Config defaults:

```properties
quarkus.application.name=notification-service
quarkus.http.port=${NOTIFICATION_SERVICE_PORT:8084}
quarkus.datasource.db-kind=mysql
quarkus.datasource.username=${MYSQL_USERNAME:root}
quarkus.datasource.password=${MYSQL_PASSWORD:}
quarkus.datasource.jdbc.url=${NOTIFICATION_MYSQL_JDBC_URL:jdbc:mysql://localhost:3306/notification1?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&useLegacyDatetimeCode=false&allowPublicKeyRetrieval=true}
quarkus.hibernate-orm.database.generation=${NOTIFICATION_DB_GENERATION:update}
quarkus.hibernate-orm.log.sql=${NOTIFICATION_DB_LOG_SQL:false}
services.user.url=${USER_SERVICE_URL:http://localhost:8088}
```

Acceptance:

- `notification-service` module exists.
- It compiles with no business logic.
- No Eureka dependency exists.
- MySQL and user-service URL are environment-backed.
- No real secret exists in config.

## Phase 2: DTO And Mapper Migration

Goal: port external JSON contracts before business logic.

Target packages:

- `com.javanc.notification.dto`
- `com.javanc.notification.mapper`

DTOs to create:

- `ApiResponse<T>`
- `MessageDTO`
- `NotificationDTO`
- `UserDTO`

Mapper to create:

- `NotificationMapper` or equivalent explicit mapper.

Rules:

- Preserve `ApiResponse` fields exactly.
- Preserve `MessageDTO.id` as the target user id field.
- Preserve `NotificationDTO` response field `read` for Angular compatibility.
- Accept `isRead` as an input alias if practical.
- Avoid ModelMapper for this service because mapping is small and explicit mapping is clearer.

Acceptance:

- JSON serialization tests prove `ApiResponse` fields are `success`, `message`, and `data`.
- JSON serialization tests prove notification read state serializes as `read`.
- Mapper tests prove id, message, createAt, url, read, and idUser round-trip correctly.

## Phase 3: Persistence Migration

Goal: port notification persistence without schema redesign.

Target packages:

- `com.javanc.notification.entity`
- `com.javanc.notification.repository`

Create:

- `Notification` JPA entity mapped to table `notifications`.
- Repository with id lookup, save, and query by `idUser`.

Rules:

- Preserve `Integer id`.
- Preserve table name `notifications`.
- Preserve fields: `id`, `message`, `createAt`, `idUser`, `url`, `isRead`.
- Keep manual id assignment for baseline unless a database migration is approved.
- Do not add unread count, ownership, or delivery-state columns during baseline.

Acceptance:

- Repository tests can persist and find a notification by id.
- Repository tests can list notifications by `idUser`.
- Existing database table can be reused.

## Phase 4: User REST Client Migration

Goal: port downstream user-service calls.

Target package:

- `com.javanc.notification.client`

Create:

- `UserClient` using MicroProfile REST Client.
- `UserServiceAdapter` or direct client usage depending on local service pattern.

Rules:

- Preserve `GET /auth/checkId?id=...`.
- Preserve `GET /auth/getCurrentUser` for parity, but do not call it unless current business logic needs it.
- Use config-backed `services.user.url`.
- Do not introduce Eureka or hardcoded localhost values in Java code.

Acceptance:

- Service tests can stub the user check.
- Resource or client tests verify the path `/auth/checkId` and query name `id`.

## Phase 5: Notification Service Logic Migration

Goal: port create, update, find-by-user, and get-all behavior.

Target package:

- `com.javanc.notification.service`

Create:

- `NotificationApplicationService` or equivalent.
- Id generation helper preserving current UUID-based random integer behavior.
- Explicit mapper use from Phase 2.

Rules:

- Preserve create endpoint behavior: return `"true"` instead of the saved notification.
- Preserve `send` behavior: message from `MessageDTO.message`, user id from `MessageDTO.id`, unread by default.
- Preserve `createAt=LocalDateTime.now()` for new notifications.
- Preserve update behavior: save the mapped DTO directly.
- Preserve find-by-user validation through user-service.
- Preserve current false-user behavior or document any intentional change.
- Preserve `getAll` as a compatibility endpoint returning `"ok"`.

Acceptance:

- Unit tests cover create from `MessageDTO`.
- Unit tests cover update.
- Unit tests cover find by user when user exists.
- Unit tests cover false user check behavior.
- Unit tests cover get-all compatibility response.

## Phase 6: REST Resource Migration

Goal: expose `/notification/**` endpoints with compatible behavior.

Target package:

- `com.javanc.notification.resource`

Create:

- `NotificationResource` with base path `/notification`.

Endpoint rules:

- Preserve all current paths and methods.
- Preserve query parameter name `userId`.
- Preserve response wrapper shape.
- Preserve response messages exactly:
  - `"Create is success"`
  - `"Update is success"`
  - `"Find is success"`
- Preserve `GET /notification/getAll` returning data `"ok"`.
- Do not add public `findById` or `seenNotification` endpoints during baseline.
- Do not add service-level JWT checks during baseline.

Acceptance:

- Resource tests verify all four public endpoints.
- Resource tests verify messages and data values exactly match Spring behavior.
- Resource tests verify notification JSON uses `read`.

## Phase 7: Exceptions And Error Responses

Goal: replace Spring exception handling with Quarkus equivalents.

Target package:

- `com.javanc.notification.exception`

Create:

- `ErrorCode` equivalent preserving current codes/messages/statuses.
- `ApplicationException` or `CustomException` equivalent.
- `BadRequestException`.
- Exception mappers returning `ApiResponse<String>`.

Rules:

- Preserve current error HTTP statuses.
- Preserve `ApiResponse<String>` error shape with `success=false`.
- Preserve `data=""` for mapped exceptions.
- Avoid leaking stack traces.
- Avoid logging raw tokens, secrets, or full downstream response payloads.

Acceptance:

- Tests verify custom exceptions return the configured status and message.
- Tests verify generic exceptions map to HTTP `500`.
- Tests verify error response `data` is an empty string.

## Phase 8: Test Plan

Goal: prove baseline compatibility.

Minimum tests:

- `POST /notification/create` returns HTTP `200`, `success=true`, message `"Create is success"`, and data `"true"`.
- Create flow persists notification with `read=false`, `idUser=MessageDTO.id`, and non-null `createAt`.
- `POST /notification/update` returns updated `NotificationDTO`.
- `GET /notification/user/findByUser?userId=...` calls user validation and returns notifications.
- Invalid user check preserves current error behavior or documents the intentional change.
- `GET /notification/getAll` returns HTTP `200`, message `"Find is success"`, and data `"ok"`.
- JSON response uses `read` for notification read state.
- Error mapper returns `ApiResponse<String>` with `success=false` and `data=""`.

Test infrastructure:

- Prefer Quarkus tests.
- Use a test profile config.
- Use H2 or an isolated test database for JPA tests.
- Stub downstream `user-service` client where practical.
- Do not require production secrets.

## Phase 9: Run Readiness For Quarkus notification-service

Goal: make the migrated Quarkus `notification-service` easy to run locally against MySQL and migrated or Spring user-service.

Runtime facts:

- Default port remains `8084`.
- Health endpoint is `/q/health`.
- OpenAPI endpoint is `/q/openapi`.
- Notification base path remains `/notification`.
- MySQL database remains `notification1`.
- User validation depends on `USER_SERVICE_URL`.
- Current gateway route behavior is still owned by the gateway.

Required documentation and templates:

- Add `quarkus/notification-service/README.md` with project-specific run instructions.
- Add `quarkus/notification-service/.env.example` with placeholders only:
  - `NOTIFICATION_SERVICE_PORT=8084`
  - `MYSQL_USERNAME=root`
  - `MYSQL_PASSWORD=change-me`
  - `NOTIFICATION_MYSQL_JDBC_URL=jdbc:mysql://localhost:3306/notification1?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&useLegacyDatetimeCode=false&allowPublicKeyRetrieval=true`
  - `NOTIFICATION_DB_GENERATION=update`
  - `NOTIFICATION_DB_LOG_SQL=false`
  - `USER_SERVICE_URL=http://localhost:8088`

Local run command from `quarkus/notification-service`:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path='C:\Program Files\Java\jdk-21\bin;' + $env:Path

$env:NOTIFICATION_SERVICE_PORT='8084'
$env:MYSQL_USERNAME='root'
$env:MYSQL_PASSWORD='<local-mysql-password>'
$env:NOTIFICATION_MYSQL_JDBC_URL='jdbc:mysql://localhost:3306/notification1?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&useLegacyDatetimeCode=false&allowPublicKeyRetrieval=true'
$env:USER_SERVICE_URL='http://localhost:8088'

.\mvnw.cmd quarkus:dev
```

Manual smoke after startup:

- `GET /q/health` returns healthy.
- `GET /notification/getAll` returns an `ApiResponse` with data `"ok"`.
- `POST /notification/create` creates a notification for a target user.
- `POST /notification/update` updates read state.
- `GET /notification/user/findByUser?userId=<id>` returns notifications after user-service validates the id.

Commit hygiene:

- Do not commit `quarkus/notification-service/.env`.
- Do not commit `quarkus/notification-service/.idea/`.
- Do not commit `quarkus/notification-service/target/`.
- Commit `.env.example` because it contains placeholders only.

Acceptance:

- A developer can run `notification-service` locally without Eureka.
- Runtime setup is explicit about MySQL, port, and user-service URL.
- No real secret is added to source control.
- No business behavior changes are introduced by this phase.

## Phase 10: Gateway And Downstream Integration

Goal: verify the migrated Quarkus notification-service works with current or future gateway and dependent services.

Compatibility checks:

- Angular notification list and update flows work through gateway `/notification/**`.
- Gateway preserves current `/notification/**` no-filter behavior until gateway hardening.
- `manager-service` can call `POST /notification/create`.
- `project-service` compatibility client can call `GET /notification/getAll`.
- `notification-service` can call migrated or Spring `user-service` `GET /auth/checkId`.

Known client details to verify:

- Angular maps notification read state from `read`.
- Angular `createNotification` currently maps the raw wrapped response through `mapToNotification`, so the create response shape may not be useful to the client even though the server returns `ApiResponse<String>`.
- Manager job acceptance sends notification message text and user id through `MessageDTO`.

Acceptance:

- Angular notification component can load notifications for the current user.
- Mark-as-read flow updates notification read state.
- Manager job acceptance can create a notification.
- Downstream compatibility gaps are listed before migrating `manager-service`.

## Phase 11: Hardening After Baseline

Only perform after baseline is verified.

Candidate cleanup:

- Add a real read/seen endpoint if the frontend needs a dedicated API.
- Add unread count if product flow requires it.
- Normalize `read` and `isRead` naming only after frontend/API compatibility is reviewed.
- Protect `/notification/**` through gateway if security policy changes.
- Decide whether Kafka is needed or remove unused Kafka configuration.
- Fix Kafka group id if Kafka is introduced for notification-service.
- Replace random integer id generation with a safer strategy only with database migration approval.
- Improve invalid user behavior from `DATABASE_ACCESS_ERROR` to a clearer client error only with API approval.
- Stop exposing low-level exception messages in generic error responses.

## Implementation Stop Conditions

Stop and ask before proceeding if:

- Existing clients require `NotificationDTO` to serialize only as `isRead` rather than `read`.
- Gateway security for `/notification/**` should be tightened during migration instead of after baseline.
- Kafka must become part of notification delivery during baseline.
- The create endpoint must start returning the saved notification instead of data `"true"`.
- A schema or id generation migration becomes necessary.
- User validation behavior must change from `DATABASE_ACCESS_ERROR` to a user-facing 404 or 400.

## Final Deliverables For Actual Migration

When implementation is requested later, the final response must include:

- Files created.
- Files modified.
- Endpoints implemented.
- Downstream user client implemented.
- Compatibility differences.
- How to run `notification-service`.
- How to test it.
- Remaining risks before migrating `project-service`, `email-service`, or `manager-service`.
