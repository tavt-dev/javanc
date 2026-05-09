# Project-Service Quarkus Migration Plan

## Purpose

This file is the implementation plan for migrating the current Spring Boot `project-service` to Quarkus. It is documentation only. It does not create Quarkus code.

The Spring service remains the source of truth until the Quarkus replacement compiles, passes tests, and is verified against the Angular client, gateway, `user-service`, `image-service`, `profile-service`, and notification compatibility calls.

This is numbered as plan 16 because `notification-service` already has plan 14 and `email-service` plan 15 is being handled separately. `project-service` is the remaining medium-dependency service before `manager-service`.

## Current Service Facts

| Item | Current value | Target value |
|---|---|---|
| Source service | `microservice/project-service` | `quarkus/project-service` |
| Current package | `com.baconbao.project_service` | `com.javanc.project` |
| Current framework | Spring Boot 3.3.2 | Quarkus 3.33 LTS |
| Java version | 21 | 21 |
| Port | 8086 | 8086 |
| Persistence | Spring Data JPA + MySQL | Hibernate ORM with Panache or explicit repository |
| Database | MySQL `project1` | MySQL `project1` |
| Table | `project` | `project` |
| Entity id type | `Integer` | `Integer` |
| Service discovery | Eureka client | No Eureka; config-backed service URLs |
| Main downstream calls | `image-service`, `profile-service`, `user-service`, `notification-service` | MicroProfile REST Clients |
| Gateway behavior | `/project/**` is protected by `AuthenticationFilter` in the current gateway | Preserve current behavior first; service should not add its own JWT checks during baseline |

Current dependencies to replace:

- Spring Web -> Quarkus REST Jackson plus multipart support for the compatibility endpoint.
- Spring Data JPA -> Hibernate ORM with Panache or explicit repository.
- MySQL connector -> Quarkus JDBC MySQL.
- OpenFeign -> MicroProfile REST Client.
- ModelMapper -> explicit mapper.
- Lombok -> avoid if practical in Quarkus target.
- Eureka client -> removed.

Configuration oddity to preserve only as documentation:

- `application.yml` uses `spring.application.name=comment-service`, while `application.properties` uses `project-service`.
- Quarkus target should use `project-service`.

## Current Project Domain Contract

### Entity

`Project` maps to MySQL table `project`.

Fields to preserve:

- `id: Integer`
- `title: String`
- `description: String`
- `createAt: LocalDateTime`
- `idImage: String`
- `isDisplay: boolean`
- `url: String`
- `idProfile: Integer`

Compatibility notes:

- `id` is manually generated from UUID most-significant bits and cast to `Integer`.
- No generated-value database strategy is used.
- `@PrePersist` sets `createAt=LocalDateTime.now()`, and the service save method also sets `createAt=LocalDateTime.now()`.
- Update logic keeps the existing `createAt` by calling `findById(projectDTO.id)` before saving.
- `idImage` exists on the entity, while `ProjectDTO` exposes `imageId`. Current save logic does not set `idImage`.
- `imageFile` exists on `ProjectDTO`, but current JSON save/update logic does not use it.

### DTOs

Preserve these JSON fields:

`ApiResponse<T>`:

- `success`
- `message`
- `data`

`ProjectDTO`:

- `id`
- `title`
- `description`
- `createAt`
- `url`
- `imageId`
- `display`
- `imageFile`
- `idProfile`

`ImageDTO`:

- `id`
- `url`

`ProfileDTO`:

- `id`
- `objective`
- `education`
- `workExperience`
- `skills`
- `typeProfile`
- `userId`
- `url`
- `imageFile`

`UserDTO`:

- `id`
- `name`
- `email`
- `password`
- `idEmployee`
- `role`
- `isActive`

Important compatibility note:

- Spring/Lombok field `isDisplay` is consumed by the Angular client as JSON field `display`.
- The Quarkus `ProjectDTO` must serialize display state as `display`.
- Accept `isDisplay` as a deserialization alias if practical, but do not break current Angular usage of `display`.

## Current Endpoint Contract

Base path: `/project`

| Method | Path | Inputs | Current response |
|---|---|---|---|
| `POST` | `/user/save` | `ProjectDTO` JSON body | `200 OK`, `ApiResponse<ProjectDTO>` with message `"Project saved successfully"` |
| `POST` | `/user/update` | `ProjectDTO` JSON body | `200 OK`, `ApiResponse<ProjectDTO>` with message `"Project updated successfully"` |
| `GET` | `/user/getProfile` | none | `200 OK`, `ApiResponse<List<ProfileDTO>>` with message `"Profiles fetched successfully"` |
| `GET` | `/user/getProject` | query `id` | `200 OK`, `ApiResponse<List<ProjectDTO>>` with message `"Projects fetched successfully"` |
| `GET` | `/user/get` | multipart part `image`, optional | `200 OK`, `ApiResponse<ImageDTO>` with message `"ok"` |
| `GET` | `/user/get1` | none | `200 OK`, `ApiResponse<String>` with message `"ok"` |

Do not add public endpoints during baseline that are only expected by the Angular client but are not present in the Spring controller. In particular, do not add `/project/user/delete/{id}` during baseline unless a separate API contract change is approved.

## Current Business Behavior

Current save:

- Accepts `ProjectDTO` as JSON.
- Generates a random manual `Integer` id.
- Copies `title`, `description`, `idProfile`, `url`, and display state.
- Sets `createAt=LocalDateTime.now()`.
- Ignores `imageId` and `imageFile`.
- Saves a row in table `project`.
- Returns the saved project as `ProjectDTO`.

Current update:

- Accepts `ProjectDTO` as JSON.
- Loads the existing project by `projectDTO.id`.
- Copies the existing `createAt` into the incoming DTO.
- Maps the DTO directly to `Project`.
- Saves through the repository.
- Throws `PROJECT_NOT_FOUND` if the existing id cannot be found.

Current profile lookup:

- `GET /project/user/getProfile` calls `ProfileClient.getAll()`.
- Current Feign path is `GET /user/profile/getAll`, returning bare `List<ProfileDTO>`.
- This path does not match the documented profile-service endpoint `/profile/user/getAll`.
- Baseline migration should preserve or explicitly document this compatibility gap before integration.

Current project lookup:

- `GET /project/user/getProject?id=...` queries repository method `findByIdProfile(id)`.
- It returns all projects with matching `idProfile`.

Current image compatibility endpoints:

- `GET /project/user/get` accepts multipart part `image` on a GET endpoint and forwards it to `image-service` `POST /image/save`.
- `GET /project/user/get1` calls `image-service` `GET /image/getAll` and returns its data.
- These endpoints are odd but part of the current API surface.

## Current REST Client Contract

### Image Client

Spring Feign client: `microservice/project-service/.../openFeign/ImageClient.java`

Current calls:

- `POST /image/save`, multipart part `image`, response `ApiResponse<ImageDTO>`.
- `GET /image/getAll`, response `ApiResponse<String>`.

Quarkus target:

- Use MicroProfile REST Client with `services.image.url=${IMAGE_SERVICE_URL:http://localhost:8083}`.
- Preserve multipart part name `image`.
- Keep `GET /project/user/get` behavior as a compatibility endpoint, even though GET multipart is unusual.

### Profile Client

Spring Feign client: `microservice/project-service/.../openFeign/ProfileClient.java`

Current call:

- `GET /user/profile/getAll`, response bare `List<ProfileDTO>`.

Compatibility issue:

- The real profile-service endpoint is documented as `GET /profile/user/getAll` returning `ApiResponse<List<ProfileDTO>>`.
- Do not silently fix the path in baseline without integration verification because that changes downstream behavior.

Quarkus target:

- Use MicroProfile REST Client with `services.profile.url=${PROFILE_SERVICE_URL:http://localhost:8085}`.
- Start by documenting the mismatch clearly.
- If the Quarkus profile-service only supports `/profile/user/getAll`, either add a compatibility adapter endpoint in profile-service or intentionally update project-service client behavior with tests and release notes.

### User Client

Spring Feign client: `microservice/project-service/.../openFeign/UserClient.java`

Current call:

- `GET /auth/getCurrentUser`, response `ApiResponse<UserDTO>`.

Compatibility note:

- The client exists but is not used in current `ProjectServiceImpl`.
- Port for parity only; do not introduce user-service calls into save/update/list flows during baseline.

### Notification Compatibility Client

Spring Feign client: `microservice/project-service/.../openFeign/test.java`

Current call:

- `GET /notification/getAll`, response `ApiResponse<String>`.

Compatibility note:

- The client is injected as `ts` but not used in current `ProjectServiceImpl`.
- Port only if needed for compile parity or future integration. Do not add new notification calls during baseline.

## Current Consumers To Verify

Angular client:

- Uses gateway base URL `http://localhost:8080/project/user/`.
- Calls:
  - `POST /project/user/save`
  - `POST /project/user/update`
  - `GET /project/user/getProject?id=...`
- Maps project display state from JSON field `display`.
- Contains a delete call to `/project/user/delete/{id}`, but Spring `ProjectController` does not expose that endpoint.
- Contains one suspicious direct call to `http://localhost:8088/project/getByUser`, which does not match current project-service port or controller contract.

Gateway:

- Current route `/project/**` is protected by `AuthenticationFilter`.
- Baseline project-service should not implement its own JWT validation unless the gateway migration plan requires it.

Profile service:

- Project-service expects a bare profile list from a likely incorrect path.
- This must be resolved or documented before end-to-end project profile selection is tested.

Image service:

- Project-service depends on `POST /image/save` and `GET /image/getAll` for compatibility endpoints.

## Current Risks And Cleanup Candidates

Do not silently fix these during baseline unless the phase explicitly allows it:

- `ProfileClient.getAll` maps `GET /user/profile/getAll`, but profile-service exposes `GET /profile/user/getAll`.
- `GET /project/user/get` uses multipart part `image` on a GET endpoint.
- `ProjectDTO.imageFile` uses Spring `MultipartFile`, but the main save/update endpoints are JSON body endpoints.
- `ProjectDTO.imageId` does not map directly to entity field `idImage` in current save logic.
- `saveProject` ignores `imageId` and `imageFile`.
- `updateProject` overwrites fields from DTO after preserving only `createAt`.
- Angular has a delete call, but Spring controller has no delete endpoint.
- Angular has a direct `8088` project URL that appears incorrect.
- `UserClient` and notification `test` client exist but are unused.
- Random integer id generation can collide.
- Generic exception handling exposes exception messages in the response.
- `application.yml` says `comment-service`, while `application.properties` says `project-service`.
- Boolean naming differs between entity field `isDisplay` and Angular JSON field `display`.

## Phase 0: Source Inventory And Contract Freeze

Goal: capture current behavior before writing Quarkus code.

Tasks:

- Inspect all files under `microservice/project-service/src/main/java/com/baconbao/project_service`.
- Freeze endpoint paths, methods, query names, response wrappers, and response messages listed in this document.
- Freeze database contract: MySQL `project1`, table `project`, id `Integer`.
- Freeze DTO contract, especially `ProjectDTO.display` JSON compatibility.
- Confirm current oddities:
  - GET multipart image endpoint.
  - Broken profile client path.
  - Unused user client.
  - Unused notification compatibility client.
  - Missing Spring delete endpoint despite Angular delete call.
- Decide per known risk whether baseline preserves it or documents a safe intentional fix.

Deliverables:

- Updated docs only if new facts are discovered.
- No Java code.
- No Quarkus scaffold.

Acceptance:

- Future implementer can list exact files to create and modify.
- No unresolved endpoint, DTO field, database, or downstream client ambiguity remains for baseline migration.

## Phase 1: Quarkus Module Scaffold

Goal: create the minimum Quarkus module for `project-service` only.

Target files when implementation begins:

- `quarkus/project-service/pom.xml`.
- `quarkus/project-service/src/main/resources/application.properties`.
- Initial package root: `quarkus/project-service/src/main/java/com/javanc/project`.
- Initial test package root: `quarkus/project-service/src/test/java/com/javanc/project`.
- Add `project-service` to `quarkus/pom.xml` modules.

Required Quarkus extensions:

- `quarkus-rest-jackson`
- `quarkus-rest-client-jackson`
- `quarkus-hibernate-validator`
- `quarkus-hibernate-orm-panache`
- `quarkus-jdbc-mysql`
- `quarkus-smallrye-health`
- `quarkus-smallrye-openapi`
- test dependencies used by Quarkus defaults, plus H2 for isolated repository tests if used

Config defaults:

```properties
quarkus.application.name=project-service
quarkus.http.port=${PROJECT_SERVICE_PORT:8086}
quarkus.datasource.db-kind=mysql
quarkus.datasource.username=${MYSQL_USERNAME:root}
quarkus.datasource.password=${MYSQL_PASSWORD:}
quarkus.datasource.jdbc.url=${PROJECT_MYSQL_JDBC_URL:jdbc:mysql://localhost:3306/project1?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&useLegacyDatetimeCode=false&allowPublicKeyRetrieval=true}
quarkus.hibernate-orm.database.generation=${PROJECT_DB_GENERATION:update}
quarkus.hibernate-orm.log.sql=${PROJECT_DB_LOG_SQL:false}
services.user.url=${USER_SERVICE_URL:http://localhost:8088}
services.image.url=${IMAGE_SERVICE_URL:http://localhost:8083}
services.profile.url=${PROFILE_SERVICE_URL:http://localhost:8085}
services.notification.url=${NOTIFICATION_SERVICE_URL:http://localhost:8084}
```

Acceptance:

- `project-service` module exists.
- It compiles with no business logic.
- No Eureka dependency exists.
- MySQL and downstream URLs are environment-backed.
- No real secret exists in config.

## Phase 2: DTO And Mapper Migration

Goal: port external JSON contracts before business logic.

Target packages:

- `com.javanc.project.dto`
- `com.javanc.project.mapper`

DTOs to create:

- `ApiResponse<T>`
- `ProjectDTO`
- `ImageDTO`
- `ProfileDTO`
- `UserDTO`

Mapper to create:

- `ProjectMapper` or equivalent explicit mapper.

Rules:

- Preserve `ApiResponse` fields exactly.
- Preserve `ProjectDTO.display` as the response JSON field.
- Accept `isDisplay` as an input alias if practical.
- Preserve nullable fields such as `imageId`, `imageFile`, and `url`.
- Replace ModelMapper with explicit mapping.
- Document that current save ignores `imageId` and `imageFile`.
- Do not use Spring `MultipartFile` in Quarkus DTOs; represent multipart input only in REST form types for the compatibility endpoint.

Acceptance:

- JSON serialization tests prove `ApiResponse` fields are `success`, `message`, and `data`.
- JSON serialization tests prove project display state serializes as `display`.
- Mapper tests prove id, title, description, createAt, url, display, and idProfile round-trip correctly.

## Phase 3: Persistence Migration

Goal: port project persistence without schema redesign.

Target packages:

- `com.javanc.project.entity`
- `com.javanc.project.repository`

Create:

- `Project` JPA entity mapped to table `project`.
- Repository with id lookup, save, and query by `idProfile`.

Rules:

- Preserve `Integer id`.
- Preserve table name `project`.
- Preserve fields: `id`, `title`, `description`, `createAt`, `idImage`, `isDisplay`, `url`, `idProfile`.
- Keep manual id assignment for baseline unless a database migration is approved.
- Preserve create/update `createAt` behavior.
- Do not add delete behavior during baseline.

Acceptance:

- Repository tests can persist and find a project by id.
- Repository tests can list projects by `idProfile`.
- Existing database table can be reused.

## Phase 4: REST Client Migration

Goal: port downstream service calls.

Target package:

- `com.javanc.project.client`

Create:

- `ImageClient` for `POST /image/save` and `GET /image/getAll`.
- `ProfileClient` for the current profile get-all compatibility path.
- `UserClient` for parity with the current unused source client.
- `NotificationClient` for parity with the current unused `test` client if needed.

Rules:

- Preserve image multipart part name `image`.
- Use config-backed service URLs.
- Do not introduce Eureka or hardcoded localhost values in Java code.
- Do not add new user or notification calls to project business logic.
- Explicitly document whether profile get-all uses the broken current path or an intentionally corrected Quarkus profile endpoint.

Acceptance:

- Service tests can stub downstream clients.
- Client/resource tests verify image upload path and multipart part name.
- Profile path mismatch is documented before integration testing.

## Phase 5: Project Service Logic Migration

Goal: port save, update, profile list, project list, and image compatibility behavior.

Target package:

- `com.javanc.project.service`

Create:

- `ProjectApplicationService` or equivalent.
- Id generation helper preserving current UUID-based random integer behavior.
- Explicit mapper use from Phase 2.

Rules:

- Preserve save behavior: generate id, set createAt now, copy title/description/idProfile/url/display, ignore imageId/imageFile.
- Preserve update behavior: find existing project, preserve existing createAt, save mapped DTO.
- Preserve `findById` error behavior with `PROJECT_NOT_FOUND`.
- Preserve `getAlliProfile` by delegating to the profile client.
- Preserve `getProjectByIdProfile` repository query.
- Preserve `getall` by forwarding multipart image to image-service and returning `ApiResponse.data`.
- Preserve `get1` by returning image-service get-all data.

Acceptance:

- Unit tests cover save.
- Unit tests cover update preserving original `createAt`.
- Unit tests cover missing project update/find behavior.
- Unit tests cover list by `idProfile`.
- Unit tests cover profile client delegation.
- Unit tests cover image compatibility delegation.

## Phase 6: REST Resource Migration

Goal: expose `/project/**` endpoints with compatible behavior.

Target package:

- `com.javanc.project.resource`

Create:

- `ProjectResource` with base path `/project`.
- Multipart form type for the compatibility endpoint part name `image`.

Endpoint rules:

- Preserve all current paths and methods.
- Preserve query parameter name `id`.
- Preserve response wrapper shape.
- Preserve response messages exactly:
  - `"Project saved successfully"`
  - `"Project updated successfully"`
  - `"Profiles fetched successfully"`
  - `"Projects fetched successfully"`
  - `"ok"`
- Preserve multipart part name `image` on `GET /project/user/get`.
- Do not add delete endpoint during baseline.
- Do not add service-level JWT checks during baseline.

Acceptance:

- Resource tests verify all six public endpoints.
- Resource tests verify messages and data shapes exactly match Spring behavior.
- Resource tests verify project JSON uses `display`.

## Phase 7: Exceptions And Error Responses

Goal: replace Spring exception handling with Quarkus equivalents.

Target package:

- `com.javanc.project.exception`

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

- `POST /project/user/save` returns HTTP `200`, message `"Project saved successfully"`, and persists a project.
- Save response JSON uses `display`.
- `POST /project/user/update` returns HTTP `200`, message `"Project updated successfully"`, and keeps original `createAt`.
- Update missing project maps to `PROJECT_NOT_FOUND`.
- `GET /project/user/getProject?id=...` returns only projects with matching `idProfile`.
- `GET /project/user/getProfile` calls profile client and wraps response with message `"Profiles fetched successfully"`.
- `GET /project/user/get` forwards multipart part `image` to image-service.
- `GET /project/user/get1` returns image-service data with message `"ok"`.
- Error mapper returns `ApiResponse<String>` with `success=false` and `data=""`.

Test infrastructure:

- Prefer Quarkus tests.
- Use a test profile config.
- Use H2 or an isolated test database for JPA tests.
- Stub downstream image/profile/user/notification clients where practical.
- Do not require production secrets.

## Phase 9: Run Readiness For Quarkus project-service

Goal: make the migrated Quarkus `project-service` easy to run locally against MySQL and migrated or Spring dependencies.

Runtime facts:

- Default port remains `8086`.
- Health endpoint is `/q/health`.
- OpenAPI endpoint is `/q/openapi`.
- Project base path remains `/project`.
- MySQL database remains `project1`.
- Downstream service URLs are config-backed.
- Current gateway route behavior is still owned by the gateway.

Required documentation and templates:

- Add `quarkus/project-service/README.md` with project-specific run instructions.
- Add `quarkus/project-service/.env.example` with placeholders only:
  - `PROJECT_SERVICE_PORT=8086`
  - `MYSQL_USERNAME=root`
  - `MYSQL_PASSWORD=change-me`
  - `PROJECT_MYSQL_JDBC_URL=jdbc:mysql://localhost:3306/project1?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&useLegacyDatetimeCode=false&allowPublicKeyRetrieval=true`
  - `PROJECT_DB_GENERATION=update`
  - `PROJECT_DB_LOG_SQL=false`
  - `USER_SERVICE_URL=http://localhost:8088`
  - `IMAGE_SERVICE_URL=http://localhost:8083`
  - `PROFILE_SERVICE_URL=http://localhost:8085`
  - `NOTIFICATION_SERVICE_URL=http://localhost:8084`

Local run command from `quarkus/project-service`:

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

Manual smoke after startup:

- `GET /q/health` returns healthy.
- `POST /project/user/save` creates a project.
- `POST /project/user/update` updates a project and keeps `createAt`.
- `GET /project/user/getProject?id=<profileId>` returns projects by profile.
- `GET /project/user/get1` returns an `ApiResponse` with data from image-service.

Commit hygiene:

- Do not commit `quarkus/project-service/.env`.
- Do not commit `quarkus/project-service/.idea/`.
- Do not commit `quarkus/project-service/target/`.
- Commit `.env.example` because it contains placeholders only.

Acceptance:

- A developer can run `project-service` locally without Eureka.
- Runtime setup is explicit about MySQL, port, and downstream service URLs.
- No real secret is added to source control.
- No business behavior changes are introduced by this phase.

## Phase 10: Gateway And Downstream Integration

Goal: verify the migrated Quarkus project-service works with current or future gateway and dependent services.

Compatibility checks:

- Angular create, update, and project-by-profile flows work through gateway `/project/**`.
- Gateway still protects `/project/**`.
- `project-service` can call migrated or Spring image-service `POST /image/save` and `GET /image/getAll`.
- `project-service` profile list behavior is verified against the actual profile-service path.
- Notification compatibility client can call `/notification/getAll` if still ported.

Known client details to verify:

- Angular maps project display state from `display`.
- Angular delete call points to an endpoint not implemented in Spring project-service.
- Angular direct `8088` project URL appears incorrect and should not drive backend baseline behavior without a separate frontend/API fix.
- Profile client path mismatch must be resolved before treating `GET /project/user/getProfile` as production-ready.

Acceptance:

- Angular project create/update/list-by-profile works through gateway.
- Image compatibility endpoints work with configured image-service URL.
- Profile list endpoint behavior is either compatible or explicitly documented as a remaining gap.
- Downstream compatibility gaps are listed before migrating `manager-service`.

## Phase 11: Hardening After Baseline

Only perform after baseline is verified.

Candidate cleanup:

- Decide whether to fix profile client path to `/profile/user/getAll`.
- Add a delete project endpoint only if an API contract change is approved.
- Normalize `display` and `isDisplay` only after frontend/API compatibility is reviewed.
- Remove unused user and notification clients if no real flow needs them.
- Replace random integer id generation with a safer strategy only with database migration approval.
- Add validation for required project fields.
- Decide whether `imageId`, `idImage`, and `imageFile` should become a real image upload flow.
- Stop exposing low-level exception messages in generic error responses.

## Implementation Stop Conditions

Stop and ask before proceeding if:

- Existing clients require `ProjectDTO` to serialize only as `isDisplay` rather than `display`.
- Gateway security for `/project/**` should move into the service during migration.
- `GET /project/user/get` should be removed or converted away from GET multipart during baseline.
- `GET /project/user/getProfile` must be corrected to `/profile/user/getAll` during baseline.
- The Angular delete endpoint must be implemented as part of migration.
- A schema or id generation migration becomes necessary.

## Final Deliverables For Actual Migration

When implementation is requested later, the final response must include:

- Files created.
- Files modified.
- Endpoints implemented.
- Downstream clients implemented.
- Compatibility differences.
- How to run `project-service`.
- How to test it.
- Remaining risks before migrating `manager-service` or `gateway-service`.
