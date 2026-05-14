# Backend API Contract - Quarkus Current State

## 1. Purpose

This document is the Phase 2 HTTP API contract for the current Quarkus backend. It is based on the Quarkus source under `quarkus/`, not on the older Spring-oriented contract in `docs/codex/06-api-contract.md`.

Phase 2 does not remove, rename, version, or normalize runtime behavior. It labels the current surface so frontend and service consumers can distinguish current APIs from compatibility debt.

Status labels:

| Status | Meaning |
|---|---|
| `current` | Preferred HTTP contract for new frontend/service calls |
| `legacy compatibility` | Kept for compatibility; do not promote for new flows |
| `internal` | Service-to-service only; not intended for frontend calls |

Common response wrapper:

```json
{
  "success": true,
  "message": "string",
  "data": {}
}
```

Error policy:

- Desired policy for new error handling: `success=false`, `message=string`, `data=null`.
- Current compatibility behavior is not fully normalized. Some services still return `data=""` for selected errors.
- Phase 2 documents this behavior and may add characterization tests, but does not change runtime response shape.

## 2. Gateway Boundary

| Method | Endpoint | Gateway auth | Service-level auth/validation | Status | Request | Success data | Notes |
|---|---|---|---|---|---|---|---|
| Any supported method | `/auth/**` | Public | `user-service` validates request-specific auth rules | `current` | Forwarded method/path/query/body/headers | Downstream response | Auth endpoints are public at gateway |
| Any supported method | `/users/**` | Bearer required | `user-service` checks self/admin/role rules | `current` | Forwarded request | Downstream response | Protected by gateway introspection |
| Any supported method | `/profiles/**` | Bearer required | `profile-service` also introspects Bearer token | `current` | Forwarded request | Downstream response | Double validation is intentional defense-in-depth |
| Any supported method | `/project/**` | Bearer required | `project-service` uses current-profile/downstream checks in newer flows | `current` | Forwarded request | Downstream response | Includes current and legacy project endpoints |
| Any supported method | `/manager/**` | Bearer required | `manager-service` enforces role/business rules in application layer | `current` | Forwarded request | Downstream response | Includes company, HR, and job APIs |
| Any supported method | `/notification/**` | Public | `notification-service` validates user for selected flows such as find-by-user | `current` | Forwarded request | Downstream response | Public at gateway does not mean all notification operations are trusted |
| Any supported method | `/image/**` | Public | `image-service` validates upload/content rules | `current` | Forwarded request | Downstream response | Upload/preview/file serving surface |
| Any supported method | `/email/**` | Not routed | `email-service` only when called directly/internal | `internal` | N/A | 404 from gateway | Gateway intentionally does not expose email-service |
| Any supported method | `/internal/emails/**` | Not routed | `email-service` internal endpoint | `internal` | N/A | 404 from gateway | Used by `user-service`, not frontend |

## 3. User Service

Base URLs through gateway: `/auth/**`, `/users/**`. Service port: `8088`.

| Method | Endpoint | Gateway auth | Service-level auth/validation | Status | Request | Success data | Notes |
|---|---|---|---|---|---|---|---|
| `POST` | `/auth/register` | Public | Rejects public role/employeeId; creates pending user | `current` | `{ name, email, password }` | `{ email, status, expiresInSeconds }` | Sends verification OTP through email-service |
| `POST` | `/auth/verify-email` | Public | Validates OTP and pending account | `current` | `{ email, otp }` | `AuthSession` | Activates account |
| `POST` | `/auth/resend-verification-otp` | Public | Cooldown and pending-account rules | `current` | `{ email }` | `null` | Neutral success unless cooldown rejects |
| `POST` | `/auth/login` | Public | Active account and credentials required | `current` | `{ email, password }` | `AuthSession` | Pending accounts return verification-required error |
| `POST` | `/auth/refresh` | Public | Refresh token only | `current` | `{ refreshToken }` | `AuthSession` | Access tokens are rejected |
| `POST` | `/auth/introspect` | Public | Validates token and account state | `internal` | `{ token }` | `{ active, subject, userId, role, expiresAt }` | Gateway and services use this for auth checks |
| `POST` | `/auth/logout` | Public | Bearer access token required by service | `current` | `Authorization: Bearer <accessToken>` | `null` | Does not use query-token access |
| `GET` | `/users/me` | Bearer required | Any active authenticated user | `current` | Authorization header | `UserDTO` | Self lookup |
| `GET` | `/users/{id}` | Bearer required | Self or `admin` | `current` | Path `id` | `UserDTO` | Used by other services for user validation |
| `GET` | `/users?ids=...` | Bearer required | `admin` | `current` | Query `ids`, optional pagination/filter params | `List<UserDTO>` | Batch/list behavior depends on query params |
| `GET` | `/users/search` | Bearer required | `admin`/authorized service logic | `current` | Query `query`, `role`, `page`, `size` | `List<UserDTO>` | Used by manager HR candidate flow |
| `PATCH` | `/users/{id}` | Bearer required | Self or `admin` | `current` | User profile update body | `UserDTO` | Profile fields only |
| `PATCH` | `/users/{id}/status` | Bearer required | `admin` | `current` | `{ active }` or `{ status }` | `UserDTO` | Admin account protections apply |
| `PATCH` | `/users/{id}/role` | Bearer required | `admin`, but direct role change is disabled in application logic | `legacy compatibility` | `{ role }` | Error or unchanged behavior per current logic | Keep documented because route exists |
| `POST` | `/users/admin/accounts` | Bearer required | `admin` | `current` | Internal account creation body | `UserDTO` | Creates `admin/user/hr/manager` accounts |
| `DELETE` | `/users/{id}` | Bearer required | `admin` | `current` | Path `id` | `UserDTO` | Soft delete |
| `POST` | `/users/me/manager-upgrade-requests` | Bearer required | Active user | `current` | Optional request body | `RoleRequestDTO` | User requests manager role |
| `GET` | `/users/me/role-requests` | Bearer required | Active user | `current` | Authorization header | `List<RoleRequestDTO>` | Self role request history |
| `GET` | `/users/admin/role-requests` | Bearer required | `admin` | `current` | Optional query `status` | `List<RoleRequestDTO>` | Admin review queue |
| `PATCH` | `/users/admin/role-requests/{id}/approve` | Bearer required | `admin` | `current` | Path `id` | `RoleRequestDTO` | Approves role request |
| `PATCH` | `/users/admin/role-requests/{id}/reject` | Bearer required | `admin` | `current` | Path `id` | `RoleRequestDTO` | Rejects role request |
| `POST` | `/users/manager/hr-promotion-requests` | Bearer required | `manager` flow | `current` | HR promotion request body/query | `RoleRequestDTO` | Used by manager-service |
| `GET` | `/users/me/hr-promotion-requests` | Bearer required | Target user | `current` | Authorization header | `List<RoleRequestDTO>` | Self HR promotion queue |
| `GET` | `/users/role-requests/{id}` | Bearer required | Authorized participant/admin | `current` | Path `id` | `RoleRequestDTO` | Role request detail |
| `PATCH` | `/users/me/hr-promotion-requests/{id}/accept` | Bearer required | Target user | `current` | Path `id` | `RoleRequestDTO` | Accepts HR promotion |
| `PATCH` | `/users/me/hr-promotion-requests/{id}/reject` | Bearer required | Target user | `current` | Path `id` | `RoleRequestDTO` | Rejects HR promotion |
| `PATCH` | `/users/me/leave-hr` | Bearer required | Current HR user | `current` | Authorization header | `UserDTO` | Removes HR role |

Removed legacy auth endpoints:

- `/auth/signup`
- `/auth/signin`
- `/auth/isValid`
- `/auth/findbyid`
- `/auth/checkId`
- Query-token protected access patterns

## 4. Profile Service

Base URL through gateway: `/profiles/**`. Service port: `8085`.

| Method | Endpoint | Gateway auth | Service-level auth/validation | Status | Request | Success data | Notes |
|---|---|---|---|---|---|---|---|
| `GET` | `/profiles/me` | Bearer required | Profile-service introspects Bearer token | `current` | Authorization header | `ProfileDTO` | Current user's profile |
| `POST` | `/profiles/me` | Bearer required | Current user; duplicate profile rules | `current` | Profile JSON | `ProfileDTO` | Creates or reuses current profile according to service rules |
| `PATCH` | `/profiles/me` | Bearer required | Current user ownership | `current` | Partial profile JSON | `ProfileDTO` | Updates current profile |
| `POST` | `/profiles/me/avatar` | Bearer required | Current user ownership; image-service upload | `current` | Multipart field `image` | `ProfileDTO` or avatar data | Stores avatar URL |
| `DELETE` | `/profiles/me` | Bearer required | Current user ownership | `current` | Authorization header | `ProfileDTO` | Soft delete |
| `GET` | `/profiles` | Bearer required | Active authenticated user | `current` | Query `type`, `title`, `page`, `size` | `List<ProfileDTO>` | Search/list current route |
| `GET` | `/profiles/by-user/{userId}` | Bearer required | Self or `admin` | `current` | Path `userId` | `ProfileDTO` | User-profile lookup |
| `GET` | `/profiles/batch` | Bearer required | `manager`/authorized batch role | `current` | Query `ids` | `List<ProfileDTO>` | Batch lookup for service flows |
| `GET` | `/profiles/{id}` | Bearer required | Active authenticated user | `current` | Path `id` | `ProfileDTO` | Profile detail |

Removed legacy profile endpoints:

- `/profile/user/save`
- `/profile/user/update`
- `/profile/user/getAll`
- `/profile/user/findById`
- `/profile/user/findByUserId`
- `/profile/**` route family in general

## 5. Project Service

Base URL through gateway: `/project/**`. Service port: `8086`.

| Method | Endpoint | Gateway auth | Service-level auth/validation | Status | Request | Success data | Notes |
|---|---|---|---|---|---|---|---|
| `GET` | `/project/user/projects` | Bearer required | Uses current profile from profile-service | `current` | Authorization context | `List<ProjectDTO>` | Preferred list route |
| `GET` | `/project/user/projects/{id}` | Bearer required | Current profile ownership | `current` | Path `id` | `ProjectDTO` | Preferred detail route |
| `POST` | `/project/user/projects` | Bearer required | Uses current profile from profile-service | `current` | Project JSON | `ProjectDTO` | Preferred create route |
| `PATCH` | `/project/user/projects/{id}` | Bearer required | Current profile ownership | `current` | Project patch JSON | `ProjectDTO` | Preferred update route |
| `DELETE` | `/project/user/projects/{id}` | Bearer required | Current profile ownership | `current` | Path `id` | `ProjectDTO` or delete wrapper | Preferred delete route |
| `POST` | `/project/user/save` | Bearer required | Legacy profile id in request | `legacy compatibility` | `ProjectDTO` JSON | `ProjectDTO` | Kept for compatibility |
| `POST` | `/project/user/update` | Bearer required | Legacy id/profile semantics | `legacy compatibility` | `ProjectDTO` JSON | `ProjectDTO` | Keeps original `createAt` behavior |
| `GET` | `/project/user/getProfile` | Bearer required | Calls profile-service | `legacy compatibility` | None | `List<ProfileDTO>` | Compatibility service aggregation |
| `GET` | `/project/user/getProject` | Bearer required | Query profile id | `legacy compatibility` | Query `id` | `List<ProjectDTO>` | Legacy lookup by profile id |
| `GET` | `/project/user/get` | Bearer required | Forwards multipart image to image-service | `legacy compatibility` | Multipart field `image` on GET | `ImageDTO` | Odd legacy contract; do not use for new flows |
| `GET` | `/project/user/get1` | Bearer required | Calls image-service getAll | `legacy compatibility` | None | String, usually `"ok"` | Legacy compatibility route |

## 6. Manager Service

Base URL through gateway: `/manager/**`. Service port: `8091`.

### Company and HR

| Method | Endpoint | Gateway auth | Service-level auth/validation | Status | Request | Success data | Notes |
|---|---|---|---|---|---|---|---|
| `POST` | `/manager/admin/company/create` | Bearer required | Admin/business rules in service | `current` | Multipart company form, optional `image` | `CompanyDTO` | Creates company |
| `POST` | `/manager/manager/company/update` | Bearer required | Manager/business rules in service | `current` | `CompanyDTO` JSON | `CompanyDTO` | Updates company |
| `PUT` | `/manager/manager/sethrtocompany` | Bearer required | Manager/business rules in service | `legacy compatibility` | `AuthenticationRequest`, query `idCompany` | `CompanyDTO` | Creates HR account and attaches to company |
| `PUT` | `/manager/manager/promotehrtocompany` | Bearer required | Manager/business rules in service | `current` | Query `idUser`, `idCompany` | `CompanyDTO` | Newer HR promotion request flow |
| `GET` | `/manager/manager/company/me` | Bearer required | Current manager via user-service | `current` | Authorization context | `CompanyDTO` | Current managed company |
| `GET` | `/manager/manager/hr-candidates` | Bearer required | Current manager via user-service | `current` | Query `query`, `page`, `size` | `List<UserDTO>` | Candidate search |
| `POST` | `/manager/manager/hr-promotions` | Bearer required | Current manager via user-service | `current` | Query `targetUserId` | `RoleRequestDTO` | Creates HR promotion request |
| `PATCH` | `/manager/user/hr-promotions/{requestId}/accept` | Bearer required | Target user acceptance flow | `current` | Path `requestId` | `CompanyDTO` | Adds accepted HR to company |
| `PATCH` | `/manager/hr/leave` | Bearer required | Current HR user | `current` | Authorization context | `CompanyDTO` | HR leaves company |
| `POST` | `/manager/admin/company/delete` | Bearer required | Admin/business rules in service | `current` | Query `id` | String `"ok"` | Deletes company |
| `PUT` | `/manager/manager/setmaanagertocompany` | Bearer required | Manager/admin assignment rules in service | `legacy compatibility` | `AuthenticationRequest`, query `idCompany` | `CompanyDTO` | Misspelled path preserved for compatibility |
| `GET` | `/manager/user/company/getbyid` | Bearer required | Business validation | `legacy compatibility` | Query `id` | `CompanyDTO` | Legacy company lookup |
| `GET` | `/manager/user/company/getcompany` | Bearer required | Business validation | `legacy compatibility` | None | `List<CompanyDTO>` | Legacy company list |
| `GET` | `/manager/user/company/getcompanybytype` | Bearer required | Business validation | `legacy compatibility` | Query `type` | `List<CompanyDTO>` | Legacy type search |
| `GET` | `/manager/company/getcompanybyidmanager` | Bearer required | Business validation | `legacy compatibility` | Query `managerId` | `CompanyDTO` | Legacy manager lookup |
| `GET` | `/manager/hr/findByIdHr` | Bearer required | Business validation | `legacy compatibility` | Query `id` | `CompanyDTO` | Legacy HR lookup |

Compatibility field names:

- `idHR`
- `idProfiePending`

### Job

| Method | Endpoint | Gateway auth | Service-level auth/validation | Status | Request | Success data | Notes |
|---|---|---|---|---|---|---|---|
| `POST` | `/manager/hr/job/create` | Bearer required | HR/business rules in service | `current` | `JobDTO` JSON | `JobDTO` | Creates job |
| `POST` | `/manager/hr/job/update` | Bearer required | HR/business rules in service | `current` | `JobDTO` JSON | `JobDTO` | Updates job |
| `POST` | `/manager/hr/job/delete` | Bearer required | HR/business rules in service | `current` | Query `id` | String `"Ok"` or wrapper data | Deletes job |
| `PUT` | `/manager/user/job/apply` | Bearer required | Legacy profile id query | `legacy compatibility` | Query `jobDTO`, `idProfile` | `JobDTO` | Legacy apply flow |
| `POST` | `/manager/user/jobs/{id}/applications` | Bearer required | Current user/profile flow | `current` | Path job id | `JobDTO` | Preferred apply flow |
| `POST` | `/manager/user/jobs/{id}/leave` | Bearer required | Current user/profile flow | `current` | Path job id | `JobDTO` | User leaves job |
| `GET` | `/manager/user/jobs/{id}/application-status` | Bearer required | Current user/profile flow | `current` | Path job id | Status DTO/string | Preferred status route |
| `PUT` | `/manager/hr/job/accept` | Bearer required | HR/business rules in service | `legacy compatibility` | Query `jobDTO`, `idProfile` | `JobDTO` | Legacy accept route; sends notification/email side effects |
| `PUT` | `/manager/hr/job/reject` | Bearer required | HR/business rules in service | `legacy compatibility` | Query `jobDTO`, `idProfile` | `JobDTO` | Legacy reject route |
| `GET` | `/manager/user/job/findbyid` | Bearer required | Business validation | `legacy compatibility` | Query/binding `id` | `JobDTO` | Legacy lookup |
| `GET` | `/manager/user/job/getall` | Bearer required | Business validation | `legacy compatibility` | None | `List<JobDTO>` | Legacy list |
| `GET` | `/manager/user/job/getjobbycompany` | Bearer required | Business validation | `legacy compatibility` | Query `id` | `List<JobDTO>` | Legacy company jobs |
| `GET` | `/manager/user/job/getjobpending` | Bearer required | Business validation | `legacy compatibility` | Query `id` | `List<JobDTO>` | Legacy pending jobs |
| `GET` | `/manager/user/job/getjobaccepted` | Bearer required | Business validation | `legacy compatibility` | Query `id` | `List<JobDTO>` | Legacy accepted jobs |
| `GET` | `/manager/user/job/getnewjob` | Bearer required | Business validation | `legacy compatibility` | Query `id` | `List<JobDTO>` | Legacy new-job query |

## 7. Notification Service

Base URL through gateway: `/notification/**`. Service port: `8084`.

| Method | Endpoint | Gateway auth | Service-level auth/validation | Status | Request | Success data | Notes |
|---|---|---|---|---|---|---|---|
| `POST` | `/notification/create` | Public | Request validation; no gateway auth | `current` | `MessageDTO` JSON | String `"true"` | Usually called by other services |
| `POST` | `/notification/update` | Public | Notification existence/business validation | `current` | `NotificationDTO` JSON | `NotificationDTO` | Updates read/status fields |
| `GET` | `/notification/user/findByUser` | Public | Calls user-service to validate `userId` | `current` | Query `userId` | `List<NotificationDTO>` | Public gateway route with internal user validation |
| `GET` | `/notification/getAll` | Public | None beyond service logic | `legacy compatibility` | None | String `"ok"` | Compatibility smoke/check route |

Known compatibility error behavior:

- Some notification errors currently return `data=""`; do not normalize in Phase 2.

## 8. Image Service

Base URL through gateway: `/image/**`. Service port: `8083`.

| Method | Endpoint | Gateway auth | Service-level auth/validation | Status | Request | Success data | Notes |
|---|---|---|---|---|---|---|---|
| `POST` | `/image/save` | Public | Multipart and magic-byte image validation | `current` | Multipart field `image` | `ImageDTO` metadata | Accepts JPEG, PNG, WEBP |
| `GET` | `/image/getAll` | Public | None beyond service logic | `legacy compatibility` | None | String `"ok"` | Compatibility route |
| `GET` | `/image/preview` | Public | URL/width processing | `current` | Query `url`, optional `width` | Preview URL string | Generates Cloudinary-style preview URL |
| `GET` | `/image/files/{filename}` | Public | Local file lookup | `current` | Path `filename` | File response | Local file serving route |

## 9. Email Service

Gateway does not expose this service. Service port: `8087`.

| Method | Endpoint | Gateway auth | Service-level auth/validation | Status | Request | Success data | Notes |
|---|---|---|---|---|---|---|---|
| `POST` | `/email/create` | Not routed | Looks up user through user-service | `internal` | `MessageDTO` JSON | String `"true"` | Called by manager-service or direct internal clients |
| `POST` | `/internal/emails/verification-otp` | Not routed | Request validation | `internal` | `{ to, name, otp, expiresInMinutes }` | `null` or send confirmation wrapper | Called by user-service only |

Kafka note:

- Kafka is not part of the public HTTP contract.
- Phase 4 adds Kafka foundation code as an internal interface only.
- HTTP remains the active public/service-facing contract while `MESSAGING_ENABLED=false`.

## 10. Internal Kafka Contract

Phase 4 adds Kafka foundation without changing HTTP paths, request bodies, response shapes, auth rules, schema, or frontend behavior.
Phase 5 adds outbox and consumer idempotency foundation while keeping HTTP as the active business contract.
Phase 6 wires selected real async side effects behind feature flags. HTTP remains the public contract.

Status:

- `MESSAGING_ENABLED=false` is the default.
- Kafka channels are configured but disabled by default.
- Producer skeletons exist in `user-service`, `manager-service`, and `project-service`.
- Consumer skeletons exist in `email-service` and `notification-service`.
- Producer services have internal outbox persistence and a disabled-by-default publisher worker.
- Consumer services have `processed_message` idempotency persistence.
- Consumers validate envelope metadata, apply idempotency, and record metrics.
- Phase 6 consumers can send email/create notifications only when `KAFKA_CONSUMER_SIDE_EFFECTS_ENABLED=true`.
- Async producer use cases are guarded by per-use-case flags and keep HTTP fallback enabled by default.
- DLQ metadata publishing exists behind `KAFKA_DLQ_ENABLED=false` by default.

Phase 4 coverage notes:

- Kafka is not wired into normal HTTP business transactions.
- Broker-backed integration coverage currently verifies one representative producer path from `user-service` to `javanc.email.commands`.
- `manager-service` and `project-service` producer skeletons are covered by component tests, not separate broker-backed publish tests.
- `email-service` and `notification-service` consumer skeletons are covered by direct consumer/component tests, not separate broker-backed incoming-channel tests.
- Phase 5 adds outbox/idempotency and expands broker-backed producer tests before any production async flow is enabled.

Dependencies:

| Service | Kafka dependency | Role |
|---|---:|---|
| `user-service` | Yes | Producer skeleton |
| `manager-service` | Yes | Producer skeleton |
| `project-service` | Yes | Producer skeleton |
| `email-service` | Yes | Consumer skeleton |
| `notification-service` | Yes | Consumer skeleton |
| `gateway-service` | No | No Kafka role |
| `profile-service` | No | No Kafka role |
| `image-service` | No | No Kafka role |

Phase 5 persistence:

| Service | Persistence addition | Purpose |
|---|---|---|
| `user-service` | MySQL `outbox_event` via Flyway | Producer outbox |
| `project-service` | JPA `outbox_event` with existing schema strategy | Producer outbox |
| `manager-service` | Mongo `outbox_event` collection | Producer outbox |
| `email-service` | MySQL `processed_message` via Flyway | Consumer idempotency |
| `notification-service` | JPA `processed_message` with existing schema strategy | Consumer idempotency |

Channels and topics:

| Channel | Direction | Topic | Service role |
|---|---|---|---|
| `user-events-out` | outgoing | `javanc.user.events` | `user-service` producer |
| `manager-events-out` | outgoing | `javanc.manager.events` | `manager-service` producer |
| `project-events-out` | outgoing | `javanc.project.events` | `project-service` producer |
| `email-commands-out` | outgoing | `javanc.email.commands` | producer skeleton where configured |
| `notification-commands-out` | outgoing | `javanc.notification.commands` | producer skeleton where configured |
| `email-commands-in` | incoming | `javanc.email.commands` | `email-service` consumer |
| `notification-commands-in` | incoming | `javanc.notification.commands` | `notification-service` consumer |
| `email-commands-dlq-out` | outgoing | `javanc.email.commands.dlq` | `email-service` sanitized failure metadata |
| `notification-commands-dlq-out` | outgoing | `javanc.notification.commands.dlq` | `notification-service` sanitized failure metadata |

Phase 6 commands:

| Command | Topic | Producer | Consumer |
|---|---|---|---|
| `SendVerificationOtpEmail` | `javanc.email.commands` | `user-service` | `email-service` |
| `SendUserMessageEmail` | `javanc.email.commands` | `manager-service` | `email-service` |
| `CreateNotification` | `javanc.notification.commands` | `user-service`, `manager-service` | `notification-service` |

Envelope policy:

- Domain events use `EventEnvelope`.
- Commands use `CommandEnvelope`.
- Required metadata must include id, type, timestamp, source service, correlation id, payload version, and payload.
- Commands also require `idempotencyKey`.
- Payload version starts at `1`.
- Message logs must include metadata only, never raw OTP, token, password, secret, or full payload.

Metrics:

- Kafka publish attempts are counted by `javanc_kafka_publish_total{service,topic,outcome}`.
- Kafka consume attempts are counted by `javanc_kafka_consume_total{service,topic,outcome}`.
- Disabled publisher calls are counted with `outcome=disabled`.
- Outbox record transitions are counted by `javanc_outbox_records_total{service,status,messageType}`.
- Outbox publish attempts are counted by `javanc_outbox_publish_attempt_total{service,topic,outcome}`.
- Consumer idempotency outcomes are counted by `javanc_consumer_idempotency_total{service,messageType,outcome}`.
- Async side effects are counted by `javanc_async_side_effect_total{service,useCase,path,outcome}`.
- DLQ publish attempts are counted by `javanc_kafka_dlq_total{service,topic,commandType,outcome}`.

Phase 5 runtime guardrails:

- `OUTBOX_PUBLISHER_ENABLED=false` by default.
- `MESSAGING_ENABLED=false` remains the default.
- Outbox publisher workers only poll when both outbox and messaging are enabled.
- `ASYNC_OTP_EMAIL_ENABLED=false`, `ASYNC_ROLE_NOTIFICATION_ENABLED=false`, and `ASYNC_JOB_SIDE_EFFECTS_ENABLED=false` keep HTTP side effects as the baseline.
- `ASYNC_HTTP_FALLBACK_ENABLED=true` keeps dual-path rollout available when an async use case is enabled.
- `KAFKA_CONSUMER_SIDE_EFFECTS_ENABLED=false` prevents Kafka consumers from sending mail or creating notifications unless explicitly enabled.
- `KAFKA_DLQ_ENABLED=false` prevents DLQ producer startup unless explicitly enabled.
- DLQ records contain sanitized metadata only; raw OTP/email payloads are not copied.

## 11. Operational Contract

Phase 3 adds operational behavior without changing business API paths, request bodies, or success response shapes.

Request correlation:

- All services accept `X-Request-Id`.
- If the header is missing or invalid, the receiving service generates a UUID.
- Valid request ids are trimmed, capped at 128 characters, and limited to safe characters.
- Every service response includes `X-Request-Id`.
- Gateway and service REST clients forward `X-Request-Id` to downstream services.
- Existing `Authorization` propagation is preserved where it already existed.

Logging and metrics:

- Access logs include service name, request id, method, path, status, and latency.
- Request/response bodies, Bearer tokens, passwords, OTPs, cookies, and secrets are not logged by the access filter.
- Prometheus metrics are exposed at `/q/metrics` for all 8 services.
- JSON console logging can be enabled with `LOG_JSON_ENABLED=true`.

Health:

| Endpoint | Meaning |
|---|---|
| `/q/health` | Aggregate health |
| `/q/health/live` | Liveness baseline |
| `/q/health/ready` | Readiness baseline |

Readiness policy:

- DB/Mongo health may participate in readiness for services that own storage.
- Downstream HTTP services are not marked as readiness blockers by default to avoid cascading restarts.
- Downstream failures are observed through logs and metrics.

Downstream timeout and unavailable policy:

- REST client connect timeout defaults to `1000` milliseconds through `DOWNSTREAM_CONNECT_TIMEOUT`.
- REST client read timeout defaults to `3000` milliseconds through `DOWNSTREAM_READ_TIMEOUT`.
- Gateway keeps `GATEWAY_AUTH_TIMEOUT_MILLIS` and `GATEWAY_REQUEST_TIMEOUT_MILLIS`.
- Timeout/connect processing failures are mapped to `503 Service Unavailable` with `success=false`, a non-empty `message`, and `data=null` where the service-level mapper applies.
- Invalid or unauthorized auth remains `401/403`; it is not mapped to `503`.
- Phase 3 does not add automatic retries.

Kafka note:

- Kafka foundation metrics are available from Phase 4.
- Phase 7 adds an infra-only Docker Compose local runtime for MySQL, MongoDB, Kafka, Kafka UI, and Mailpit.
- Local Kafka topics are created for the internal contract channels, including DLQ topics, but Kafka remains an internal interface.
- Broker health/readiness, outbox status views, consumer lag dashboards, schema registry, and production retention policy remain future operational hardening.

## 12. Versioning And Change Policy

- Do not introduce `/v1` routes in Phase 2.
- If API versioning is needed later, add new versioned paths while keeping existing paths until frontend/service migration is complete.
- Any future removal of `legacy compatibility` endpoints requires a separate migration plan, frontend dependency audit, and regression tests.
- Any future error response normalization requires characterization tests first and must preserve frontend expectations or include a coordinated migration.
