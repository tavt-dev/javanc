# User-Service Quarkus Migration Plan

## Purpose

This file is the implementation plan for migrating the current Spring Boot `user-service` to Quarkus. It is documentation only. It does not create Quarkus code.

The current Spring service remains the source of truth until the Quarkus replacement compiles, passes tests, and is verified against the gateway and downstream service clients.

## Current Service Facts

| Item | Current value | Target value |
|---|---|---|
| Source service | `microservice/user-service` | `quarkus/user-service` |
| Current package | `com.baconbao.user_service` | `com.javanc.user` |
| Current framework | Spring Boot 3.3.2 | Quarkus 3.33 LTS |
| Java version | 21 | 21 |
| Port | 8088 | 8088 |
| Database | MySQL `portfolio` | MySQL `portfolio` |
| Table | `user` | `user` |
| Entity id type | `Integer` | `Integer` |
| Service discovery | Eureka client | No Eureka; config-backed service URLs |

Current dependencies to replace:

- Spring Web -> Quarkus REST Jackson.
- Spring Security -> Quarkus Security plus service-level auth utilities.
- Spring Data JPA -> Hibernate ORM with Panache or explicit repository.
- MySQL connector -> Quarkus JDBC MySQL.
- JJWT -> preserve compatible JWT behavior first; use environment-backed secret.
- ModelMapper -> explicit mapper or small mapping helper.
- Lombok -> avoid if practical in Quarkus target, unless the project standard allows it.
- Eureka client -> removed.

## Current User Domain Contract

### Entity

`User` maps to table `user` and implements Spring `UserDetails`.

Fields to preserve:

- `id: Integer`
- `name: String`
- `email: String`
- `idEmployee: String`
- `password: String`
- `isActive: boolean`
- `role: Role`

Role enum values:

- `admin`
- `user`
- `hr`
- `manager`

Compatibility notes:

- `role` is stored as string in the current JPA entity.
- `email` is the auth username and JWT subject.
- Current id generation is manual random `Integer` derived from UUID bits in `AuthService.getGenerationId()`.

### DTOs

Preserve these JSON fields:

`ApiResponse<T>`:

- `success`
- `message`
- `data`

`AuthenticationRequest`:

- `name`
- `email`
- `role`
- `token`
- `password`
- `idEmployee`

`AuthenticationResponse`:

- `statusCode`
- `error`
- `message`
- `token`
- `refreshToken`
- `expirationTime`
- `user`
- `isVaild`
- `role`

`UserDTO`:

- `id`
- `name`
- `email`
- `password`
- `idEmployee`
- `role`
- `isActive`

Important: preserve the current typo `isVaild` during baseline migration because other services or frontend code may depend on it.

## Current Endpoint Contract

Base path: `/auth`

| Method | Path | Inputs | Current response |
|---|---|---|---|
| `POST` | `/isValid` | raw token string body | `ApiResponse<AuthenticationResponse>` |
| `GET` | `/ourUserDetailsService` | intended `username`, but mapping has no path variable | `ApiResponse<UserDetails>` |
| `POST` | `/signup` | `AuthenticationRequest` JSON body | `200 OK` or `409 CONFLICT`, `ApiResponse<AuthenticationResponse>` |
| `POST` | `/signin` | `AuthenticationRequest` JSON body | `200 OK` or `401 UNAUTHORIZED`, `ApiResponse<AuthenticationResponse>` |
| `POST` | `/update` | query `token`, `UserDTO` JSON body | `ApiResponse<UserDTO>` |
| `GET` | `/findbyid` | query `id` | `ApiResponse<UserDTO>` |
| `POST` | `/refresh` | `AuthenticationRequest` JSON body with `token` | `ApiResponse<AuthenticationResponse>` |
| `GET` | `/checkId` | query `id` | `ApiResponse<Boolean>` |
| `GET` | `/getCurrentUser` | current authenticated user | `ApiResponse<UserDTO>` |
| `GET` | `/getAll` | query `token` | `ApiResponse<List<UserDTO>>` |
| `GET` | `/getlistuserbyid` | query `token`, query list `ids` | `ApiResponse<List<UserDTO>>` |
| `POST` | `/updateactive` | query `token`, `UserDTO` JSON body | `ApiResponse<UserDTO>` |
| `DELETE` | `/delete` | query `token`, query `id` | `ApiResponse<UserDTO>` |

## Current Auth And JWT Behavior

Current signup:

- Normalizes email for duplicate check by trimming and lowercasing.
- Stores the original request email value on the entity.
- Defaults role to `user` when request role is null.
- Encodes password with BCrypt.
- Generates random integer id manually.
- Returns `AuthenticationResponse` with `statusCode=200`, `message="User Saved Successfully"`, `isVaild=true`, and `user`.
- Duplicate email returns `statusCode=409`, `message="Email already exists"`, `isVaild=false`; controller wraps it and returns HTTP `409`.

Current signin:

- Trims and lowercases request email for lookup.
- Unknown email returns `statusCode=404`, `message="Email not found"`, `isVaild=false`; controller returns HTTP `401`.
- Wrong password returns `statusCode=401`, `message="Invalid credentials"`, `isVaild=false`; controller returns HTTP `401`.
- Success returns token, refresh token, `expirationTime="24Hr"`, role, user, and `isVaild=true`.

Current JWT:

- HMAC SHA-256 compatible signing.
- Subject is user email.
- Access token expiration is 24 hours.
- Refresh token expiration is also 24 hours.
- Current secret is hardcoded in source. Do not copy it to Quarkus.

Current validation:

- `/auth/isValid` extracts username from token, loads user, checks expiration and subject.
- Valid token returns `AuthenticationResponse` with `isVaild=true` and `role`.
- Current fallback returns `isVaild=true` even when no valid email path is reached. Treat this as a compatibility bug: preserve only if needed for gateway compatibility, otherwise document the intentional fix.

## Current Risks And Cleanup Candidates

Do not silently fix these during baseline unless the phase explicitly allows it:

- JWT secret is hardcoded.
- Raw passwords and encoded passwords are logged during signup.
- JWT token and user email are printed in `JwtAuthenticationFilter`.
- `AuthenticationResponse.user` may expose password because it contains the entity.
- `UserDTO` includes `password`.
- Random integer id generation can collide.
- `GET /auth/ourUserDetailsService` has `@PathVariable username` but no `{username}` path segment.
- Several admin-style operations use `token` query parameters instead of Authorization headers.
- `updateIsActive` accepts token but does not validate it.
- `isValid` fallback currently returns `isVaild=true`.
- `AppConfig` defines ModelMapper mappings but lacks `@Configuration`; `ModelMapperConfig` provides a plain mapper, so role mapping behavior must be verified.

## Phase 0: Source Inventory And Contract Freeze

Goal: capture current behavior before writing Quarkus code.

Tasks:

- Inspect all files under `microservice/user-service/src/main/java/com/baconbao/user_service`.
- Freeze endpoint paths, methods, input names, response wrappers, and status behavior listed in this document.
- Freeze database contract: MySQL `portfolio`, table `user`, id `Integer`, role enum string values.
- Freeze JWT contract: subject=email, 24-hour expiration, `expirationTime="24Hr"` response string.
- Decide per known risk whether baseline preserves it or documents a safe intentional fix.

Deliverables:

- Updated docs only if new facts are discovered.
- No Java code.
- No Quarkus scaffold.

Acceptance:

- Future implementer can list exact files to create and modify.
- No unresolved endpoint or DTO field ambiguity remains for baseline migration.

## Phase 1: Quarkus Module Scaffold

Goal: create the minimum Quarkus module for `user-service` only.

Target files when implementation begins:

- `quarkus/pom.xml` if the parent monorepo does not exist.
- `quarkus/user-service/pom.xml`.
- `quarkus/user-service/src/main/resources/application.properties`.
- Initial package root: `quarkus/user-service/src/main/java/com/javanc/user`.
- Initial test package root: `quarkus/user-service/src/test/java/com/javanc/user`.

Required Quarkus extensions:

- `quarkus-rest-jackson`
- `quarkus-hibernate-validator`
- `quarkus-hibernate-orm-panache`
- `quarkus-jdbc-mysql`
- `quarkus-security`
- `quarkus-smallrye-jwt`
- `quarkus-smallrye-health`
- `quarkus-smallrye-openapi`
- test dependencies used by Quarkus defaults

Config defaults:

```properties
quarkus.application.name=user-service
quarkus.http.port=${USER_SERVICE_PORT:8088}
quarkus.datasource.db-kind=mysql
quarkus.datasource.username=${MYSQL_USERNAME:root}
quarkus.datasource.password=${MYSQL_PASSWORD:}
quarkus.datasource.jdbc.url=${USER_MYSQL_JDBC_URL:jdbc:mysql://localhost:3306/portfolio?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true}
quarkus.hibernate-orm.database.generation=${USER_DB_GENERATION:update}
quarkus.hibernate-orm.log.sql=${USER_DB_LOG_SQL:false}
jwt.secret=${JWT_SECRET:}
jwt.expiration-millis=${JWT_EXPIRATION_MILLIS:86400000}
```

Acceptance:

- `user-service` module exists.
- It compiles with no business logic.
- No Eureka dependency exists.
- No real secret exists in config.

## Phase 2: DTO And Wrapper Migration

Goal: port external JSON contracts before business logic.

Target package:

- `com.javanc.user.dto`

DTOs to create:

- `ApiResponse<T>`
- `AuthenticationRequest`
- `AuthenticationResponse`
- `UserDTO`

Rules:

- Preserve JSON field names exactly.
- Preserve `isVaild` spelling.
- Preserve nullable fields where current responses omit values.
- Avoid returning password in new public DTOs only after compatibility impact is reviewed. During baseline, document any deviation.

Acceptance:

- JSON serialization tests prove field names match current DTOs.
- `AuthenticationResponse.isVaild` serializes with the expected name.

Implementation note:

- Phase 2 preserves the actual Spring/Lombok/Jackson wire names for boolean fields: `AuthenticationResponse` serializes validity as `vaild` while accepting `isVaild` as an alias, and `UserDTO` serializes active status as `active` while accepting `isActive` as an alias.
- This keeps the Angular client compatible, because `client/src/app/model/user.ts` uses `active`.

## Phase 3: Persistence Migration

Goal: port user persistence without schema redesign.

Target packages:

- `com.javanc.user.entity`
- `com.javanc.user.repository`

Create:

- `User` entity mapped to table `user`.
- `Role` enum with values `admin`, `user`, `hr`, `manager`.
- `UserRepository` with lookup by email, id lookup, list all, delete by id, and find all by ids.

Rules:

- Preserve `Integer id`.
- Preserve string enum storage for `role`.
- Preserve fields: `id`, `name`, `email`, `idEmployee`, `password`, `isActive`, `role`.
- Keep manual id assignment for baseline unless a database migration is approved.

Acceptance:

- Repository tests can persist and find a user by email and id.
- Role round-trips as string.
- Existing database table can be reused.

## Phase 4: Auth, Password, And JWT Migration

Goal: port signup, signin, refresh, and validation logic.

Target packages:

- `com.javanc.user.security`
- `com.javanc.user.service`

Create service components:

- Password hashing service using BCrypt-compatible hashing.
- JWT service with env-backed secret and 24-hour expiration.
- Auth service for signup, signin, refresh, and token validation.
- User lookup service that uses email as username.

Rules:

- Preserve signup duplicate email behavior.
- Preserve signin unknown email and invalid password response payloads.
- Preserve `expirationTime="24Hr"`.
- Preserve JWT subject=email.
- Do not log raw passwords, encoded passwords, JWTs, or secrets.
- Move the signing secret to `JWT_SECRET`.
- Decide explicitly whether `/auth/isValid` invalid fallback preserves current `isVaild=true` bug or returns a secure false response. Baseline recommendation: fix to `isVaild=false` only if gateway behavior is tested.

Acceptance:

- Unit tests cover signup, duplicate signup, signin, wrong password, unknown email, refresh, valid token, invalid token, expired token if feasible.
- Generated token can be parsed by the new JWT service.

## Phase 5: REST Resource Migration

Goal: expose `/auth/**` endpoints with compatible behavior.

Target package:

- `com.javanc.user.resource`

Create:

- `AuthResource` or `UserResource` with base path `/auth`.

Endpoint rules:

- Preserve all current paths and methods.
- Preserve query parameter names: `token`, `id`, `ids`.
- Preserve response wrapper shape.
- Preserve HTTP `409` for duplicate signup.
- Preserve HTTP `401` for signin failure.
- Preserve current public accessibility for `/auth/**`.

Special cases:

- `GET /auth/ourUserDetailsService` is currently broken because `username` has no path segment. Document whether to skip, preserve broken compatibility, or expose a corrected path in a later cleanup. Baseline recommendation: do not rely on this endpoint unless a current client uses it.

Acceptance:

- Resource tests verify main success and failure status codes.
- Gateway compatibility endpoint `/auth/isValid` returns the expected wrapper.

## Phase 6: Exceptions And Security Behavior

Goal: replace Spring exception handling and request security with Quarkus equivalents.

Target packages:

- `com.javanc.user.exception`
- `com.javanc.user.security`

Create:

- `ErrorCode` equivalent preserving current codes/messages/statuses.
- Custom exceptions equivalent to `CustomException` and JWT exceptions.
- `ExceptionMapper` classes returning `ApiResponse<String>` with `success=false`.
- Security config that allows `/auth/**` and protects non-public endpoints if any are later added.

Rules:

- Preserve current error HTTP statuses.
- Preserve `ApiResponse` error shape.
- Avoid leaking exception stack traces in responses.

Acceptance:

- Tests verify not found, unauthorized, invalid JWT, and generic exception behavior where practical.

## Phase 7: Test Plan

Goal: prove baseline compatibility.

Minimum tests:

- `POST /auth/signup` success.
- `POST /auth/signup` duplicate email returns HTTP `409`.
- `POST /auth/signin` success returns token, refreshToken, role, user, `isVaild=true`.
- `POST /auth/signin` unknown email returns HTTP `401` with current payload behavior.
- `POST /auth/signin` wrong password returns HTTP `401`.
- `POST /auth/refresh` returns new token and original refresh token.
- `POST /auth/isValid` with valid token returns `isVaild=true` and role.
- `GET /auth/findbyid?id=...` returns matching user.
- `GET /auth/checkId?id=...` returns true for existing user.
- `GET /auth/getAll?token=...` returns users after token parsing.
- `POST /auth/updateactive?token=...` toggles active state.
- `DELETE /auth/delete?token=...&id=...` deletes and returns deleted user.

Test infrastructure:

- Prefer Quarkus tests.
- Use test profile config.
- Use an isolated test database or Testcontainers when available.
- Do not require production secrets.

## Phase 8A: Run Readiness For Quarkus user-service

Goal: make the migrated Quarkus `user-service` easy to run locally against real MySQL before gateway/downstream integration starts.

Current verified state:

- `mvnw.cmd test` from `quarkus/user-service` passes 41 tests with JDK 21.
- `mvnw.cmd -f ..\pom.xml test` from `quarkus/user-service` passes the parent reactor.
- `mvnw.cmd -DskipTests package` builds `target/quarkus-app/quarkus-run.jar`.
- MySQL `localhost:3306` is reachable on the current machine.
- Runtime env vars such as `JWT_SECRET`, `MYSQL_PASSWORD`, `USER_MYSQL_JDBC_URL`, and `USER_SERVICE_PORT` must still be supplied by the local shell or deployment environment.

Runtime facts:

- Quarkus does not need a Spring Boot-style `main()` source file.
- The Quarkus runtime is started with `.\mvnw.cmd quarkus:dev` or `java -jar target\quarkus-app\quarkus-run.jar`.
- The main HTTP entrypoint is `com.javanc.user.resource.AuthResource`.
- Default port remains `8088`.
- Health endpoint is `/q/health`.
- OpenAPI endpoint is `/q/openapi`.
- Auth base path remains `/auth`.

Required documentation and templates:

- Replace generated `quarkus/user-service/README.md` content with project-specific run instructions.
- Add `quarkus/user-service/.env.example` with placeholders only:
  - `USER_SERVICE_PORT=8088`
  - `MYSQL_USERNAME=root`
  - `MYSQL_PASSWORD=change-me`
  - `USER_MYSQL_JDBC_URL=jdbc:mysql://localhost:3306/portfolio?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true`
  - `USER_DB_GENERATION=update`
  - `JWT_SECRET=change-me-local-dev-secret-at-least-32-bytes`
  - `JWT_EXPIRATION_MILLIS=86400000`

Local run command from `quarkus/user-service`:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path='C:\Program Files\Java\jdk-21\bin;' + $env:Path

$env:USER_SERVICE_PORT='8088'
$env:MYSQL_USERNAME='root'
$env:MYSQL_PASSWORD='<local-mysql-password>'
$env:USER_MYSQL_JDBC_URL='jdbc:mysql://localhost:3306/portfolio?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true'
$env:JWT_SECRET='local-dev-secret-with-at-least-32-bytes-1234567890'

.\mvnw.cmd quarkus:dev
```

Manual smoke after startup:

- `GET /q/health` returns healthy.
- `POST /auth/signup` creates a user.
- `POST /auth/signin` returns token and refresh token.
- `POST /auth/isValid` with that token returns `data.vaild=true`.
- `GET /auth/getCurrentUser` with `Authorization: Bearer <token>` returns the current user.

Commit hygiene:

- Do not commit `quarkus/user-service/.env`.
- Do not commit `quarkus/user-service/.idea/`.
- Do not commit `quarkus/user-service/target/`.
- Commit `.env.example` because it contains placeholders only.

Acceptance:

- A developer can run `user-service` locally without searching for a `main()` file.
- Runtime setup is explicit about MySQL, port, and JWT secret.
- No real secret is added to source control.
- No business behavior changes are introduced by this phase.

## Phase 8: Gateway And Downstream Integration

Goal: verify the migrated Quarkus user-service works with current or future gateway and services.

Compatibility checks:

- `api-gateway` can call `POST /auth/isValid` with raw token string body.
- `notification-service` can call `/auth/checkId` and `/auth/getCurrentUser`.
- `project-service` can call `/auth/getCurrentUser`.
- `manager-service` can call `/auth/signup` and `/auth/getCurrentUser`.
- `email-service` can call `/auth/findbyid`.

Known client path issues to verify:

- Some existing Feign clients omit `/auth` in paths. Do not design new user-service around incorrect clients until the caller is inspected.

Acceptance:

- At least gateway token validation flow works with migrated service.
- Downstream compatibility gaps are listed before migrating dependent services.

## Phase 9: Hardening After Baseline

Only perform after baseline is verified.

Candidate cleanup:

- Remove password from public response DTOs.
- Stop returning entity `User` directly inside `AuthenticationResponse`.
- Replace token query params with Authorization headers.
- Fix `/auth/ourUserDetailsService` mapping or remove if unused.
- Fix `/auth/isValid` invalid fallback to return `isVaild=false`.
- Replace random integer id generation with a safer strategy only with database migration approval.
- Add role-based authorization rules.
- Add OpenAPI examples and stricter validation annotations.
- Add integration tests with gateway.

## Implementation Stop Conditions

Stop and ask before proceeding if:

- Existing clients require the broken `isValid` fallback behavior.
- Password exposure cannot be changed without frontend impact.
- Database id generation must change.
- A schema migration becomes necessary.
- Gateway auth behavior conflicts with current service auth behavior.

## Final Deliverables For Actual Migration

When implementation is requested later, the final response must include:

- Files created.
- Files modified.
- Endpoints implemented.
- Compatibility differences.
- How to run `user-service`.
- How to test it.
- Remaining risks before migrating the next service.
