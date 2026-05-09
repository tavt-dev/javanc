# Profile-Service Quarkus Migration Plan

## Purpose

This file is the implementation plan for migrating the current Spring Boot `profile-service` to Quarkus. It is documentation only. It does not create Quarkus code.

The Spring service remains the source of truth until the Quarkus replacement compiles, passes tests, and is verified against the Angular client, gateway, `image-service`, `user-service`, `project-service`, and `manager-service`.

## Current Service Facts

| Item | Current value | Target value |
|---|---|---|
| Source service | `microservice/profile-service` | `quarkus/profile-service` |
| Current package | `com.baconbao.profile_service` | `com.javanc.profile` |
| Current framework | Spring Boot 3.3.2 | Quarkus 3.33 LTS |
| Java version | 21 | 21 |
| Port | 8085 | 8085 |
| Database | MongoDB `microservice-portfolio` | MongoDB `microservice-portfolio` |
| Collection | `profile` | `profile` |
| Entity id type | `Integer` | `Integer` |
| Service discovery | Eureka client | No Eureka; config-backed service URLs |
| Main downstream calls | `user-service`, `image-service` | MicroProfile REST clients |

Current dependencies to replace:

- Spring Web -> Quarkus REST Jackson.
- Spring Data MongoDB and `MongoTemplate` -> Quarkus MongoDB Panache plus MongoDB client queries where needed.
- OpenFeign -> MicroProfile REST Client.
- ModelMapper -> explicit mapper or small mapping helper.
- Spring multipart -> Quarkus multipart form support.
- Lombok -> avoid if practical in Quarkus target, unless the project standard allows it.
- Eureka client -> removed.

## Current Profile Domain Contract

### Document

`Profile` maps to MongoDB collection `profile`.

Fields to preserve:

- `id: Integer`
- `objective: String`
- `education: String`
- `workExperience: String`
- `skills: String`
- `contact: Contact`
- `typeProfile: TypeProfile`
- `idImage: Integer`
- `title: String`
- `idUser: Integer`
- `url: String`

`Contact` fields:

- `id: Integer`
- `address: String`
- `phone: String`
- `email: String`

`TypeProfile` enum values:

- `JAVA`
- `PYTHON`
- `C`

Compatibility notes:

- `typeProfile` is stored and returned using enum names.
- `ProfileDTO.typeProfile` is a `String`; the mapper converts between string and enum.
- Current id generation is manual random `Integer` derived from UUID bits in `ProfileServiceImp.getGenerationId()`.
- `idImage` exists on the document but current save/update logic does not populate it; image upload currently stores only the returned URL.

### DTOs

Preserve these JSON fields:

`ApiResponse<T>`:

- `success`
- `message`
- `data`

`ProfileDTO`:

- `id`
- `objective`
- `education`
- `workExperience`
- `skills`
- `contact`
- `typeProfile`
- `idUser`
- `url`
- `title`

`Contact`:

- `id`
- `address`
- `phone`
- `email`

`ImageDTO`:

- `id`
- `url`

`UserDTO`:

- `id`
- `name`
- `email`
- `password`
- `idEmployee`
- `role`
- `isActive`

`BooleanDTO`:

- `isCheck`

Compatibility notes:

- `BooleanDTO` exists and `ProfileService.checkIdProfile` can compute a real value, but the current controller endpoint returns string `"true"` without checking the id.
- Angular sends profile create/update as `FormData`, including nested contact fields named `contact.address`, `contact.phone`, and `contact.email`.
- Angular sends the image multipart part as `image`.

## Current Endpoint Contract

Base path: `/profile`

| Method | Path | Inputs | Current response |
|---|---|---|---|
| `POST` | `/user/save` | `ProfileDTO` model attributes, optional multipart part `image` | `200 OK`, `ApiResponse<ProfileDTO>` |
| `POST` | `/user/update` | multipart form `ProfileDTO`, optional multipart part `image` | `200 OK`, `ApiResponse<ProfileDTO>` |
| `GET` | `/user/findProfileByType` | query `typeProfile` | `200 OK`, `ApiResponse<List<ProfileDTO>>` |
| `GET` | `/user/getAll` | none | `200 OK`, `ApiResponse<List<ProfileDTO>>` |
| `GET` | `/user/findById` | query `id` | `200 OK`, `ApiResponse<ProfileDTO>` or exception wrapper |
| `GET` | `/user/findByUserId` | query `userId` | `200 OK`, success true with profile or success false with null |
| `GET` | `/user/findByTitle` | query `title` | `200 OK`, `ApiResponse<List<ProfileDTO>>` |
| `GET` | `/user/checkIdProfile` | query `id` | `200 OK`, `ApiResponse<String>` with data `"true"` |
| `GET` | `/manager/getProfileByIdPendingJob` | query list `ids` | `200 OK`, `ApiResponse<List<ProfileDTO>>` |

Current response messages to preserve during baseline:

- Save: `"Profile saved successfully"`
- Update: `"Profile update successfully"`
- Find by type: `"Find Profile By Type"`
- Get all: `"Get all is successfully"`
- Find by id: `"Find by id is successfully"`
- Find by user id success: `"Find by user id is successfully"`
- Find by user id missing: `"Profile not found"`
- Find by title: `"Find by title is successfully"`
- Check id: `"Check id profile"`
- Pending job list: `"Profiles retrieved successfully by pending job id"`

## Current Business Behavior

Current save:

- Accepts form fields bound to `ProfileDTO` and optional multipart part `image`.
- Uploads the image to `image-service` only when `image != null`.
- Reads `imageClient.save(image).getData().getUrl()` without null checks in save.
- Generates a random integer id manually.
- Converts `ProfileDTO.typeProfile` with `TypeProfile.valueOf(...)`; invalid or lowercase values fail.
- Inserts a new MongoDB document.
- Returns `ApiResponse<ProfileDTO>` with `success=true`.

Current update:

- Accepts multipart form fields and optional multipart part `image`.
- Uploads the image when present.
- If image upload response or data is null, logs it and keeps `url=""`.
- Builds a new `Profile` from request fields and saves it by id.
- If no new image is supplied, current behavior overwrites `url` with an empty string rather than preserving the old URL.
- Returns `ApiResponse<ProfileDTO>` with `success=true`.

Current searches:

- `findProfilesByType` queries Mongo field `typeProfile` with `.in(typeProfile.name())` and limits results to 20.
- `getAllProfile` returns at most 20 profiles.
- `findByTitle` performs regex search on Mongo field `title` and limits results to 20.
- `findByIdUser` queries Mongo field `idUser` and returns null when absent.
- `findListProfileByIdPendingJob` uses repository method `findByIdIn(ids)`.
- `checkIdProfile` service method checks repository existence, but controller does not use it.

## Current REST Client Contract

### Image Client

Spring Feign client: `microservice/profile-service/.../openFeign/ImageClient.java`

Current calls:

- `POST /image/save`, multipart part `image`, response `ApiResponse<ImageDTO>`.
- `GET /image/getAll`, response `ApiResponse<String>`.

Quarkus target:

- Use MicroProfile REST Client with `services.image.url=${IMAGE_SERVICE_URL:http://localhost:8083}`.
- Preserve multipart part name `image`.
- Preserve null/empty image compatibility for profile endpoints; image-service itself returns `400` when image is missing.

### User Client

Spring Feign client: `microservice/profile-service/.../openFeign/UserClient.java`

Current calls:

- `GET /checkId`, query `id`, response `Boolean`.
- `GET /auth/getCurrentUser`, response `ApiResponse<UserDTO>`.

Compatibility issue:

- `GET /checkId` omits `/auth`, while the real user-service endpoint is documented as `/auth/checkId`.
- `checkUserId` exists in `ProfileServiceImp` but is not used by save/update in the current code.

Quarkus target:

- Use MicroProfile REST Client with `services.user.url=${USER_SERVICE_URL:http://localhost:8088}`.
- Do not add new user validation to the baseline profile save/update flow unless explicitly approved.
- If `checkUserId` is ported for parity, document whether its path keeps the broken `/checkId` behavior or intentionally uses `/auth/checkId`.

## Current Consumers To Verify

Angular client:

- Calls gateway base URL `http://localhost:8080/profile/`.
- Sends Authorization bearer token on profile routes.
- Uses:
  - `GET /profile/user/getAll`
  - `GET /profile/manager/getProfileByIdPendingJob?ids=...`
  - `POST /profile/user/save`
  - `POST /profile/user/update`
  - `GET /profile/user/findProfileByType?typeProfile=...`
  - `GET /profile/user/findById?id=...`
  - `GET /profile/user/findByUserId?userId=...`
- Expects response wrapper for most reads and update.
- Current `createProfile` maps the raw post response directly instead of unwrapping `ApiResponse`; verify runtime behavior before changing the API or client.

Manager service:

- Calls `GET /profile/user/checkIdProfile?id=...`.
- Calls `GET /profile/user/findById?id=...`.

Project service:

- Has a likely incorrect Feign path `GET /user/profile/getAll`, returning a bare `List<ProfileDTO>`.
- Do not design the Quarkus profile-service around this path without inspecting active project-service usage.

Gateway:

- Current route `/profile/**` is protected by `AuthenticationFilter`.
- Baseline profile-service should not implement its own JWT validation unless the Quarkus gateway plan requires it.

## Current Risks And Cleanup Candidates

Do not silently fix these during baseline unless the phase explicitly allows it:

- `GET /profile/user/checkIdProfile` always returns `"true"` without checking the id.
- `updateProfile` clears `url` when no new image is uploaded.
- `saveProfile` can fail with null pointer behavior if image-service returns an unexpected empty response.
- `TypeProfile.valueOf(...)` is case-sensitive and throws for invalid values.
- Random integer id generation can collide.
- `MongoConfig` hardcodes the MongoDB connection string.
- `application.properties` also stores the MongoDB URI, creating duplicate config sources.
- Profile logs include multipart/image details; avoid logging sensitive request data in Quarkus.
- `UserClient.checkId` path omits `/auth`.
- `ProjectClient` consumer path for profile get-all appears wrong.
- Error responses return `ApiResponse<String>` with `data=""`, and generic errors expose the exception message.

## Phase 0: Source Inventory And Contract Freeze

Goal: capture current behavior before writing Quarkus code.

Tasks:

- Inspect all files under `microservice/profile-service/src/main/java/com/baconbao/profile_service`.
- Freeze endpoint paths, methods, query names, multipart field names, response wrappers, and status behavior listed in this document.
- Freeze MongoDB contract: database `microservice-portfolio`, collection `profile`, id `Integer`.
- Freeze enum contract: `JAVA`, `PYTHON`, `C`.
- Confirm how Angular `createProfile` handles the current wrapped save response at runtime.
- Decide per known risk whether baseline preserves it or documents a safe intentional fix.

Deliverables:

- Updated docs only if new facts are discovered.
- No Java code.
- No Quarkus scaffold.

Acceptance:

- Future implementer can list exact files to create and modify.
- No unresolved endpoint, DTO field, or multipart field ambiguity remains for baseline migration.

## Phase 1: Quarkus Module Scaffold

Goal: create the minimum Quarkus module for `profile-service` only.

Target files when implementation begins:

- `quarkus/profile-service/pom.xml`.
- `quarkus/profile-service/src/main/resources/application.properties`.
- Initial package root: `quarkus/profile-service/src/main/java/com/javanc/profile`.
- Initial test package root: `quarkus/profile-service/src/test/java/com/javanc/profile`.

Required Quarkus extensions:

- `quarkus-rest-jackson`
- `quarkus-rest-client-jackson`
- `quarkus-hibernate-validator`
- `quarkus-mongodb-panache`
- `quarkus-smallrye-health`
- `quarkus-smallrye-openapi`
- multipart support compatible with the chosen Quarkus REST stack
- test dependencies used by Quarkus defaults

Config defaults:

```properties
quarkus.application.name=profile-service
quarkus.http.port=${PROFILE_SERVICE_PORT:8085}
quarkus.mongodb.connection-string=${MONGODB_CONNECTION_STRING:mongodb://localhost:27017}
quarkus.mongodb.database=${MONGODB_DATABASE:microservice-portfolio}
quarkus.http.body.uploads-directory=${PROFILE_UPLOADS_DIR:target/uploads}
quarkus.http.limits.max-body-size=${PROFILE_MAX_BODY_SIZE:10M}
services.user.url=${USER_SERVICE_URL:http://localhost:8088}
services.image.url=${IMAGE_SERVICE_URL:http://localhost:8083}
```

Acceptance:

- `profile-service` module exists.
- It compiles with no business logic.
- No Eureka dependency exists.
- MongoDB and downstream URLs are environment-backed.

## Phase 2: DTO, Model, And Mapper Migration

Goal: port external JSON and Mongo document contracts before business logic.

Target packages:

- `com.javanc.profile.dto`
- `com.javanc.profile.model`
- `com.javanc.profile.mapper`

DTOs and models to create:

- `ApiResponse<T>`
- `ProfileDTO`
- `ImageDTO`
- `UserDTO`
- `BooleanDTO`
- `Contact`
- `Profile`
- `TypeProfile`

Rules:

- Preserve JSON field names exactly.
- Preserve `ProfileDTO.typeProfile` as `String`.
- Preserve `Profile.typeProfile` as enum.
- Preserve embedded `contact` object behavior and multipart form binding for `contact.address`, `contact.phone`, and `contact.email`.
- Preserve nullable fields where current responses omit values.
- Replace ModelMapper with explicit conversion that keeps enum string behavior.

Acceptance:

- JSON serialization tests prove DTO field names match current DTOs.
- Mapper tests prove `TypeProfile.JAVA` maps to `"JAVA"` and back.
- Mapper tests cover null `typeProfile` and invalid `typeProfile` behavior.

## Phase 3: MongoDB Persistence Migration

Goal: port profile persistence without schema redesign.

Target packages:

- `com.javanc.profile.model`
- `com.javanc.profile.repository`

Create:

- `Profile` document mapped to collection `profile`.
- `ProfileRepository` with id lookup, insert/save, and `findByIdIn`.
- Query methods or repository helpers for:
  - profile by `typeProfile`, limit 20
  - all profiles, limit 20
  - title regex, limit 20
  - profile by `idUser`

Rules:

- Preserve `Integer id`.
- Preserve collection name `profile`.
- Preserve fields listed in the domain contract.
- Keep manual id assignment for baseline unless a database migration is approved.
- Preserve result limits of 20 for type, title, and get-all queries.

Acceptance:

- Repository tests can persist and find a profile by id.
- Query tests verify `idUser`, `typeProfile`, title regex, and `findByIdIn`.
- Existing MongoDB documents can be reused.

## Phase 4: REST Client Migration

Goal: port downstream service calls.

Target package:

- `com.javanc.profile.client`

Create:

- `ImageClient` for multipart upload to `image-service`.
- `UserClient` only for parity with current code paths and future validation.

Rules:

- Preserve image multipart part name `image`.
- Use config-backed service URLs.
- Do not introduce Eureka, service names, or hardcoded localhost values in Java code.
- Avoid calling user-service during save/update unless this is added as an explicit behavior change.
- Handle image-service null or failed responses in a way that either preserves current behavior or documents the intentional fix.

Acceptance:

- Client tests or resource-level tests verify the request path and multipart part name.
- Service tests can stub image upload and return a URL.

## Phase 5: Profile Service Logic Migration

Goal: port save, update, lookup, and search behavior.

Target package:

- `com.javanc.profile.service`

Create:

- `ProfileApplicationService` or equivalent.
- Id generation helper preserving current random integer behavior.
- Explicit mapper use from Phase 2.

Rules:

- Preserve save response behavior and message.
- Preserve update behavior, including the current empty URL result when no image is supplied, unless a cleanup phase approves preserving the old URL.
- Preserve type search, title regex search, and get-all limit of 20.
- Preserve `findByIdUser` null behavior so controller can return `success=false`.
- Preserve `checkIdProfile` service behavior if the service method is exposed internally, while keeping the controller baseline response compatible.

Acceptance:

- Unit tests cover save with image, save without image, update with image, update without image, find by id, find by user id present/missing, find by type, find by title, get all, pending id list, and check id service behavior.

## Phase 6: REST Resource Migration

Goal: expose `/profile/**` endpoints with compatible behavior.

Target package:

- `com.javanc.profile.resource`

Create:

- `ProfileResource` with base path `/profile`.

Endpoint rules:

- Preserve all current paths and methods.
- Preserve query parameter names: `typeProfile`, `id`, `userId`, `title`, `ids`.
- Preserve multipart part name `image`.
- Preserve response wrapper shape.
- Preserve HTTP `200` for normal success and find-by-user missing behavior.
- Preserve `GET /profile/user/checkIdProfile` response data as string `"true"` during baseline unless a compatibility change is approved.

Acceptance:

- Resource tests verify the main success paths.
- Resource tests verify missing user profile returns `success=false`, message `"Profile not found"`, and `data=null`.
- Resource tests verify `checkIdProfile` returns data `"true"`.

## Phase 7: Exceptions And Error Responses

Goal: replace Spring exception handling with Quarkus equivalents.

Target package:

- `com.javanc.profile.exception`

Create:

- `ErrorCode` equivalent preserving current codes/messages/statuses.
- `ApplicationException` or `CustomException` equivalent.
- Exception mapper for custom exceptions returning `ApiResponse<String>`.
- Exception mapper for bad request and generic exceptions if needed.

Rules:

- Preserve current error HTTP statuses.
- Preserve `ApiResponse<String>` error shape with `success=false`.
- Preserve `data=""` for mapped exceptions unless intentionally changed.
- Avoid leaking stack traces.
- Avoid exposing low-level exception messages in a later hardening phase; baseline should document any deviation.

Acceptance:

- Tests verify `PROFILE_NOT_FOUND` returns HTTP `404` with `success=false`.
- Tests verify invalid enum or malformed multipart behavior is either compatible or explicitly documented.

## Phase 8: Test Plan

Goal: prove baseline compatibility.

Minimum tests:

- `POST /profile/user/save` without image creates a profile and returns `success=true`.
- `POST /profile/user/save` with image uses `image` multipart part and stores returned URL.
- `POST /profile/user/update` updates fields and returns `success=true`.
- `POST /profile/user/update` without image preserves current empty URL behavior or documents an intentional fix.
- `GET /profile/user/findProfileByType?typeProfile=JAVA` returns up to 20 profiles.
- `GET /profile/user/getAll` returns up to 20 profiles.
- `GET /profile/user/findById?id=...` returns matching profile.
- `GET /profile/user/findByUserId?userId=...` returns matching profile.
- `GET /profile/user/findByUserId?userId=missing` returns `success=false`, message `"Profile not found"`, and `data=null`.
- `GET /profile/user/findByTitle?title=...` performs regex search.
- `GET /profile/user/checkIdProfile?id=...` returns `data="true"`.
- `GET /profile/manager/getProfileByIdPendingJob?ids=1,2` returns matching profiles.

Test infrastructure:

- Prefer Quarkus tests.
- Use test profile config.
- Use an isolated MongoDB test database or Testcontainers when available.
- Stub downstream `image-service` and `user-service` clients where practical.

## Phase 9: Run Readiness For Quarkus profile-service

Goal: make the migrated Quarkus `profile-service` easy to run locally against MongoDB and existing or migrated dependencies.

Runtime facts:

- Default port remains `8085`.
- Health endpoint is `/q/health`.
- OpenAPI endpoint is `/q/openapi`.
- Profile base path remains `/profile`.
- MongoDB database remains `microservice-portfolio`.
- Image upload depends on `IMAGE_SERVICE_URL`.
- Current gateway-protected route behavior is still owned by the gateway.

Required documentation and templates:

- Add `quarkus/profile-service/README.md` with project-specific run instructions.
- Add `quarkus/profile-service/.env.example` with placeholders only:
  - `PROFILE_SERVICE_PORT=8085`
  - `MONGODB_CONNECTION_STRING=mongodb://localhost:27017`
  - `MONGODB_DATABASE=microservice-portfolio`
  - `IMAGE_SERVICE_URL=http://localhost:8083`
  - `USER_SERVICE_URL=http://localhost:8088`
  - `PROFILE_MAX_BODY_SIZE=10M`

Local run command from `quarkus/profile-service`:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path='C:\Program Files\Java\jdk-21\bin;' + $env:Path

$env:PROFILE_SERVICE_PORT='8085'
$env:MONGODB_CONNECTION_STRING='mongodb://localhost:27017'
$env:MONGODB_DATABASE='microservice-portfolio'
$env:IMAGE_SERVICE_URL='http://localhost:8083'
$env:USER_SERVICE_URL='http://localhost:8088'

.\mvnw.cmd quarkus:dev
```

Manual smoke after startup:

- `GET /q/health` returns healthy.
- `GET /profile/user/getAll` returns an `ApiResponse`.
- `POST /profile/user/save` creates a profile with form fields.
- `POST /profile/user/save` with multipart part `image` stores the returned image URL.
- `GET /profile/user/findByUserId?userId=<id>` returns the created profile.

Commit hygiene:

- Do not commit `quarkus/profile-service/.env`.
- Do not commit `quarkus/profile-service/.idea/`.
- Do not commit `quarkus/profile-service/target/`.
- Commit `.env.example` because it contains placeholders only.

Acceptance:

- A developer can run `profile-service` locally without Eureka.
- Runtime setup is explicit about MongoDB, port, user-service URL, and image-service URL.
- No real secret is added to source control.
- No business behavior changes are introduced by this phase.

## Phase 10: Gateway And Downstream Integration

Goal: verify the migrated Quarkus profile-service works with current or future gateway and dependent services.

Compatibility checks:

- Angular client can access profile endpoints through gateway `/profile/**` with bearer token.
- Gateway still protects `/profile/**`.
- `profile-service` can call migrated or Spring `image-service` `POST /image/save`.
- `manager-service` can call `/profile/user/checkIdProfile` and `/profile/user/findById`.
- `project-service` profile dependency is inspected before relying on the current likely incorrect `/user/profile/getAll` path.

Known client path issues to verify:

- `project-service` has `GET /user/profile/getAll`, while profile-service exposes `GET /profile/user/getAll`.
- `profile-service` `UserClient.checkId` has `GET /checkId`, while user-service exposes `GET /auth/checkId`.
- Angular `createProfile` may not unwrap `ApiResponse` from the save endpoint.

Acceptance:

- Angular profile list, create, update, type filter, profile by id, and profile by user id work through the gateway.
- Image upload through profile create/update works with the configured image-service URL.
- Downstream compatibility gaps are listed before migrating project-service or manager-service.

## Phase 11: Hardening After Baseline

Only perform after baseline is verified.

Candidate cleanup:

- Make `checkIdProfile` return a real existence check instead of constant `"true"`.
- Preserve existing image URL during update when no replacement image is uploaded.
- Replace random integer id generation with a safer strategy only with database migration approval.
- Add validation annotations for required fields and enum values.
- Normalize or validate `typeProfile` input more gracefully.
- Remove unused `UserClient` methods if no flow needs them.
- Fix inconsistent user-service and project-service Feign paths.
- Stop exposing low-level exception messages in generic error responses.
- Add OpenAPI examples for multipart profile create/update.
- Add gateway integration tests for `/profile/**` authorization.

## Implementation Stop Conditions

Stop and ask before proceeding if:

- Existing clients rely on `checkIdProfile` always returning `"true"`.
- The frontend requires `createProfile` to return an unwrapped `ProfileDTO`.
- Updating without an image must preserve the old image URL during baseline.
- A schema or id generation migration becomes necessary.
- Project-service compatibility requires supporting `/user/profile/getAll`.
- User id validation becomes mandatory for profile save/update.

## Final Deliverables For Actual Migration

When implementation is requested later, the final response must include:

- Files created.
- Files modified.
- Endpoints implemented.
- Multipart fields implemented.
- Downstream clients implemented.
- Compatibility differences.
- How to run `profile-service`.
- How to test it.
- Remaining risks before migrating the next service.
