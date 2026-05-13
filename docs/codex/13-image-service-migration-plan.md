# Image-Service Quarkus Migration Plan

## Purpose

This file is the implementation plan for migrating the current Spring Boot `image-service` to Quarkus with a small DDD-oriented architecture. It is documentation only. It does not create Quarkus code.

The request mentioned "email service" but pointed to `microservice/image-service`. This plan uses the explicit source folder as the authority. A separate `email-service` plan should be created from `microservice/email-service` when needed.

The Spring service remains the source of truth until the Quarkus replacement compiles, passes tests, and is verified against the Angular client, gateway, `profile-service`, `project-service`, and `manager-service`.

## Current Service Facts

| Item | Current value | Target value |
|---|---|---|
| Source service | `microservice/image-service` | `quarkus/image-service` |
| Current package | `com.baconbao.image_service` | `com.javanc.image` |
| Current framework | Spring Boot 3.3.2 | Quarkus 3.33 LTS |
| Java version | 21 | 21 |
| Port | 8083 | 8083 |
| Database | MySQL `image` | MySQL `image` |
| Table | `image` | `image` |
| Entity id type | `Integer` | `Integer` |
| External storage | Cloudinary | Cloudinary through config-backed adapter |
| Service discovery | Eureka client | No Eureka; config-backed service URLs |
| Gateway behavior | `/image/**` has no auth filter in current gateway config | Preserve current behavior first |

Current dependencies to replace:

- Spring Web -> Quarkus REST Jackson plus multipart support.
- Spring Data JPA -> Hibernate ORM with Panache or explicit repository.
- MySQL connector -> Quarkus JDBC MySQL.
- Cloudinary Java SDK -> Cloudinary adapter behind an application port.
- ModelMapper -> explicit mapper or no mapper for the two-field DTO.
- Lombok -> avoid if practical in Quarkus target, unless the project standard allows it.
- Eureka client -> removed.

## Current Image Domain Contract

### Entity

`Image` maps to MySQL table `image`.

Fields to preserve:

- `id: Integer`
- `url: String`

Compatibility notes:

- `id` is manually generated from UUID most-significant bits and cast to a positive-ish `Integer`.
- No generated-value database strategy is used.
- No ownership, user id, filename, content type, or Cloudinary public id is currently stored.
- The service stores the URL returned by Cloudinary result key `url`.

### DTOs

Preserve these JSON fields:

`ApiResponse<T>`:

- `success`
- `message`
- `data`

`ImageDTO`:

- `id`
- `url`

## Current Endpoint Contract

Base path: `/image`

| Method | Path | Inputs | Current response |
|---|---|---|---|
| `POST` | `/save` | multipart part `image`, `required=false` but null/empty returns `400` with null body | `200 OK`, `ApiResponse<ImageDTO>` |
| `GET` | `/getAll` | none | `200 OK`, `ApiResponse<String>` with data `"ok"` |

Current response messages to preserve during baseline:

- Save: `"Get all is successfully"`
- Get all: `"Get all is successfully"`

Compatibility notes:

- The `POST /image/save` multipart field name must remain `image`.
- Missing or empty image currently returns HTTP `400 BAD_REQUEST` with a null body, not an `ApiResponse`.
- `GET /image/getAll` is a health-like compatibility endpoint and does not return stored images.
- The current gateway route does not apply the auth filter to `/image/**`; preserve that behavior first.

## Current Business Behavior

Current save:

- Rejects null or empty multipart image at controller level with HTTP `400` and null body.
- Uploads the multipart file to Cloudinary.
- Creates a temporary local file using the original filename.
- Deletes the temporary file after upload.
- Reads the Cloudinary upload response field `url`.
- Generates a random integer id manually.
- Saves an `Image` row with `id` and `url`.
- Returns an `ImageDTO` with the saved id and URL.

Current Cloudinary behavior:

- Cloudinary credentials are hardcoded in Spring source. Do not copy them into Quarkus source, docs, tests, or examples.
- Upload failures are mapped to `CloudinaryException(Error.UPLOAD_FAILED)`.
- Conversion failures are mapped to `CloudinaryException(Error.CONVERSION_FAILED)`.
- Delete helper exists but no controller endpoint currently calls it.
- `getPublicId` parses the last URL path segment and strips the extension.

Current exception behavior:

- `BadRequestException` maps to HTTP `400` with `ApiResponse<String>` and `data=""`.
- `CustomException` maps to the status from its `Error`.
- Generic exceptions map to HTTP `500` with `ApiResponse<String>` and `data=""`.
- The explicit missing-image branch bypasses the exception handler and returns a null response body.

## Target DDD Architecture

Use a lightweight DDD structure. The image domain is intentionally small, so the goal is clear boundaries rather than ceremony.

Target package root:

```text
com.javanc.image
```

Recommended package layout:

```text
domain/
  model/          ImageAsset or Image
  repository/     ImageRepository port
  service/         ImageIdGenerator
application/
  ImageApplicationService
  dto/             ApiResponse, ImageDTO
  mapper/          ImageMapper
infrastructure/
  persistence/     JpaImageEntity, Panache repository adapter
  storage/         CloudinaryImageStorageAdapter
  config/          CloudinaryConfig
interfaces/
  rest/            ImageResource, multipart form types
exception/
  ErrorCode, ImageException, CloudinaryException, exception mappers
```

DDD boundary rules:

- The application service owns the use case: upload image, store metadata, return DTO.
- The domain model contains only business state that exists today: id and URL.
- Cloudinary is infrastructure, not domain logic.
- JPA/Panache is infrastructure, not domain logic.
- The REST resource adapts HTTP/multipart to the application service and preserves current API compatibility.
- Keep the DDD split small; do not add aggregates, events, ownership policies, or validation rules that do not exist in the current behavior.

Suggested ports:

- `ImageStoragePort.upload(UploadedImageFile file): StoredImage`
- `ImageRepositoryPort.save(Image image): Image`
- `ImageIdGenerator.nextId(): Integer`

Suggested adapter behavior:

- `CloudinaryImageStorageAdapter` implements image upload and returns the URL.
- `JpaImageRepositoryAdapter` persists to table `image`.
- Multipart file conversion must use a safe temporary file location instead of the process working directory.

## Phase 0: Source Inventory And Contract Freeze

Goal: capture current behavior before writing Quarkus code.

Tasks:

- Inspect all files under `microservice/image-service/src/main/java/com/baconbao/image_service`.
- Freeze endpoint paths, HTTP methods, multipart field names, response wrappers, and status behavior listed in this document.
- Freeze database contract: MySQL `image`, table `image`, id `Integer`, fields `id` and `url`.
- Freeze Cloudinary behavior: upload image, persist returned URL, no public id persistence.
- Decide per known risk whether baseline preserves it or documents a safe intentional fix.

Deliverables:

- Updated docs only if new facts are discovered.
- No Java code.
- No Quarkus scaffold.

Acceptance:

- Future implementer can list exact files to create and modify.
- No unresolved endpoint, DTO field, database, or multipart ambiguity remains for baseline migration.

## Phase 1: Quarkus Module Scaffold

Goal: create the minimum Quarkus module for `image-service` only.

Target files when implementation begins:

- `quarkus/image-service/pom.xml`.
- `quarkus/image-service/src/main/resources/application.properties`.
- Initial package root: `quarkus/image-service/src/main/java/com/javanc/image`.
- Initial test package root: `quarkus/image-service/src/test/java/com/javanc/image`.

Required Quarkus extensions:

- `quarkus-rest-jackson`
- `quarkus-hibernate-validator`
- `quarkus-hibernate-orm-panache`
- `quarkus-jdbc-mysql`
- `quarkus-smallrye-health`
- `quarkus-smallrye-openapi`
- multipart support compatible with the chosen Quarkus REST stack
- test dependencies used by Quarkus defaults

External library:

- Cloudinary Java SDK, added only to `image-service`.

Config defaults:

```properties
quarkus.application.name=image-service
quarkus.http.port=${IMAGE_SERVICE_PORT:8083}
quarkus.datasource.db-kind=mysql
quarkus.datasource.username=${MYSQL_USERNAME:root}
quarkus.datasource.password=${MYSQL_PASSWORD:}
quarkus.datasource.jdbc.url=${IMAGE_MYSQL_JDBC_URL:jdbc:mysql://localhost:3306/image?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true}
quarkus.hibernate-orm.database.generation=${IMAGE_DB_GENERATION:update}
quarkus.hibernate-orm.log.sql=${IMAGE_DB_LOG_SQL:false}
quarkus.http.body.uploads-directory=${IMAGE_UPLOADS_DIR:target/uploads}
quarkus.http.limits.max-body-size=${IMAGE_MAX_BODY_SIZE:10M}
cloudinary.cloud-name=${CLOUDINARY_CLOUD_NAME:}
cloudinary.api-key=${CLOUDINARY_API_KEY:}
cloudinary.api-secret=${CLOUDINARY_API_SECRET:}
```

Alternative Cloudinary config is acceptable if the team standardizes on `CLOUDINARY_URL`, but do not include real credentials.

Acceptance:

- `image-service` module exists.
- It compiles with no business logic.
- No Eureka dependency exists.
- MySQL and Cloudinary settings are environment-backed.
- No real secret exists in config.

## Phase 2: DTO, Domain Model, And Mapper Migration

Goal: port external JSON contracts and the minimal domain model.

Target packages:

- `com.javanc.image.application.dto`
- `com.javanc.image.domain.model`
- `com.javanc.image.application.mapper`

Create:

- `ApiResponse<T>`
- `ImageDTO`
- `Image` or `ImageAsset` domain model
- `ImageMapper`

Rules:

- Preserve JSON field names exactly.
- Preserve `ImageDTO.id` as `Integer`.
- Preserve `ImageDTO.url` as `String`.
- Keep mapper explicit; ModelMapper is unnecessary for this service.

Acceptance:

- JSON serialization tests prove `ApiResponse` fields are `success`, `message`, and `data`.
- JSON serialization tests prove `ImageDTO` fields are `id` and `url`.
- Mapper tests prove domain/entity/DTO mapping preserves id and URL.

## Phase 3: Persistence Migration

Goal: port image metadata persistence without schema redesign.

Target packages:

- `com.javanc.image.infrastructure.persistence`
- `com.javanc.image.domain.repository`

Create:

- JPA entity mapped to table `image`.
- Repository port for the application/domain layer.
- Panache repository or explicit repository adapter.

Rules:

- Preserve `Integer id`.
- Preserve table name `image`.
- Preserve fields `id` and `url`.
- Keep manual id assignment for baseline unless a database migration is approved.
- Do not add new columns such as public id, owner id, content type, or created date during baseline.

Acceptance:

- Repository tests can persist and find an image by id.
- Existing database table can be reused.
- No schema migration tool is introduced during the first pass.

## Phase 4: Cloudinary Infrastructure Migration

Goal: move Cloudinary integration behind an infrastructure adapter with environment-backed credentials.

Target packages:

- `com.javanc.image.infrastructure.storage`
- `com.javanc.image.infrastructure.config`
- `com.javanc.image.domain.service`

Create:

- `ImageStoragePort`.
- `CloudinaryImageStorageAdapter`.
- `CloudinaryConfig` or config mapping.
- Safe temporary-file helper if required by the Cloudinary SDK.

Rules:

- Do not copy hardcoded Spring credentials.
- Preserve upload behavior and returned URL compatibility.
- Prefer a safe generated temp file under Quarkus upload/temp directories instead of writing the original filename into the current working directory.
- Ensure temporary files are deleted in both success and failure paths.
- Keep delete support internal only unless an existing endpoint needs it.

Acceptance:

- Unit tests can stub `ImageStoragePort`.
- Adapter tests, if added, do not require production credentials.
- Configuration fails clearly when Cloudinary credentials are missing in runtime profiles that need real uploads.

## Phase 5: Application Service Migration

Goal: port the image upload use case.

Target package:

- `com.javanc.image.application`

Create:

- `ImageApplicationService`.
- `ImageIdGenerator` preserving current random integer behavior.

Rules:

- Preserve the business flow: upload file, read URL, generate id, persist metadata, return `ImageDTO`.
- Preserve current manual id generation unless a database migration is approved.
- Do not introduce ownership validation or auth checks during baseline.
- Do not return stored image lists from `GET /image/getAll`; preserve current `"ok"` compatibility endpoint.

Acceptance:

- Unit tests cover successful save.
- Unit tests cover upload failure mapped to the expected exception.
- Unit tests cover repository failure mapped to an error response or documented generic failure behavior.

## Phase 6: REST Resource Migration

Goal: expose `/image/**` endpoints with compatible behavior.

Target package:

- `com.javanc.image.interfaces.rest`

Create:

- `ImageResource` with base path `/image`.
- Multipart form type for part name `image`.

Endpoint rules:

- Preserve `POST /image/save`.
- Preserve multipart field name `image`.
- Preserve missing or empty image behavior: HTTP `400` with null body during baseline unless an intentional compatibility change is approved.
- Preserve successful response wrapper and message.
- Preserve `GET /image/getAll` returning `ApiResponse<String>` with data `"ok"`.
- Preserve public route behavior; do not add service-level JWT checks during baseline.

Acceptance:

- Resource tests verify multipart upload success.
- Resource tests verify missing image returns HTTP `400`.
- Resource tests verify empty image returns HTTP `400`.
- Resource tests verify `GET /image/getAll` response shape and message.

## Phase 7: Exceptions And Error Responses

Goal: replace Spring exception handling with Quarkus exception mappers.

Target package:

- `com.javanc.image.exception`

Create:

- `ErrorCode` equivalent preserving current error codes/messages/statuses where relevant.
- `BadRequestException`.
- `ImageException` or `CustomException` equivalent.
- `CloudinaryException`.
- Exception mappers returning `ApiResponse<String>` with `success=false` and `data=""`.

Rules:

- Preserve current error HTTP statuses.
- Preserve mapped exception response shape.
- Preserve the explicit missing-image null-body response unless intentionally changed.
- Avoid exposing stack traces.
- Avoid logging Cloudinary secrets or raw request content.

Acceptance:

- Tests verify mapped Cloudinary upload failure returns HTTP `500` with `success=false`.
- Tests verify custom image errors preserve status and wrapper shape.
- Tests document any intentional difference from the Spring null-body bad request behavior.

## Phase 8: Test Plan

Goal: prove baseline compatibility.

Minimum tests:

- `POST /image/save` with multipart part `image` returns HTTP `200`.
- Successful upload returns `ApiResponse<ImageDTO>` with `success=true`, message `"Get all is successfully"`, and data fields `id` and `url`.
- `POST /image/save` without part `image` returns HTTP `400`.
- `POST /image/save` with an empty file returns HTTP `400`.
- Upload failure maps to the expected error response.
- Repository save failure maps to generic or documented error behavior.
- `GET /image/getAll` returns HTTP `200`, message `"Get all is successfully"`, and data `"ok"`.
- Repository test persists and fetches an image row with `Integer` id.

Test infrastructure:

- Prefer Quarkus tests.
- Use a test profile config.
- Stub `ImageStoragePort` for resource and application tests.
- Use an isolated test database or Testcontainers when available.
- Do not require production Cloudinary credentials.

## Phase 9: Run Readiness For Quarkus image-service

Goal: make the migrated Quarkus `image-service` easy to run locally against MySQL and Cloudinary.

Runtime facts:

- Default port remains `8083`.
- Health endpoint is `/q/health`.
- OpenAPI endpoint is `/q/openapi`.
- Image base path remains `/image`.
- MySQL database remains `image`.
- Cloudinary credentials must be supplied through environment variables.

Required documentation and templates:

- Add `quarkus/image-service/README.md` with project-specific run instructions.
- Add `quarkus/image-service/.env.example` with placeholders only:
  - `IMAGE_SERVICE_PORT=8083`
  - `MYSQL_USERNAME=root`
  - `MYSQL_PASSWORD=change-me`
  - `IMAGE_MYSQL_JDBC_URL=jdbc:mysql://localhost:3306/image?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true`
  - `IMAGE_DB_GENERATION=update`
  - `IMAGE_MAX_BODY_SIZE=10M`
  - `CLOUDINARY_CLOUD_NAME=change-me`
  - `CLOUDINARY_API_KEY=change-me`
  - `CLOUDINARY_API_SECRET=change-me`

Local run command from `quarkus/image-service`:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path='C:\Program Files\Java\jdk-21\bin;' + $env:Path

$env:IMAGE_SERVICE_PORT='8083'
$env:MYSQL_USERNAME='root'
$env:MYSQL_PASSWORD='<local-mysql-password>'
$env:IMAGE_MYSQL_JDBC_URL='jdbc:mysql://localhost:3306/image?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true'
$env:CLOUDINARY_CLOUD_NAME='<local-cloudinary-cloud-name>'
$env:CLOUDINARY_API_KEY='<local-cloudinary-api-key>'
$env:CLOUDINARY_API_SECRET='<local-cloudinary-api-secret>'

.\mvnw.cmd quarkus:dev
```

Manual smoke after startup:

- `GET /q/health` returns healthy.
- `GET /image/getAll` returns an `ApiResponse` with data `"ok"`.
- `POST /image/save` with multipart part `image` uploads to Cloudinary and stores a row in MySQL.
- The returned `data.url` can be opened in a browser.

Commit hygiene:

- Do not commit `quarkus/image-service/.env`.
- Do not commit `quarkus/image-service/.idea/`.
- Do not commit `quarkus/image-service/target/`.
- Commit `.env.example` because it contains placeholders only.

Acceptance:

- A developer can run `image-service` locally without Eureka.
- Runtime setup is explicit about MySQL, port, multipart size, and Cloudinary credentials.
- No real secret is added to source control.
- No business behavior changes are introduced by this phase.

## Phase 10: Gateway And Downstream Integration

Goal: verify the migrated Quarkus image-service works with current or future gateway and dependent services.

Compatibility checks:

- Gateway forwards `/image/**` to the migrated service without adding auth behavior during baseline.
- `profile-service` can call `POST /image/save` with multipart part `image`.
- `project-service` can call image upload flows that currently depend on image-service.
- `manager-service` can call image upload flows for company images.
- Angular image-dependent flows still receive `ApiResponse<ImageDTO>` with `id` and `url`.

Known client path issues to verify:

- `profile-service` expects `POST /image/save`, multipart part `image`, response `ApiResponse<ImageDTO>`.
- `project-service` contains an odd GET endpoint using a multipart image part; inspect before relying on it.
- `manager-service` uses image upload indirectly for company creation; verify exact multipart shape before manager migration.

Acceptance:

- Profile create/update with image works using the migrated image-service.
- Company create with image works once manager-service is tested against it.
- Downstream compatibility gaps are listed before migrating project-service or manager-service.

## Phase 11: Hardening After Baseline

Only perform after baseline is verified.

Candidate cleanup:

- Store Cloudinary public id so images can be deleted or replaced safely.
- Use `secure_url` instead of `url` if frontend and downstream compatibility allows it.
- Add file type and size validation beyond framework-level multipart limits.
- Replace manual random integer id generation with a safer strategy only with database migration approval.
- Return an `ApiResponse` for missing image instead of a null body if clients can accept the change.
- Add ownership or authorization checks after gateway security behavior is decided.
- Add delete endpoint only if a product flow requires it.
- Stop exposing low-level exception messages in generic error responses.
- Add OpenAPI examples for multipart upload.

## Implementation Stop Conditions

Stop and ask before proceeding if:

- Existing clients require the missing-image response body to remain null.
- The team wants to redesign the image table with public id, owner id, filename, or created date.
- Cloudinary configuration must use `CLOUDINARY_URL` instead of separate variables.
- Gateway security for `/image/**` should be tightened during migration instead of after baseline.
- A schema or id generation migration becomes necessary.

## Final Deliverables For Actual Migration

When implementation is requested later, the final response must include:

- Files created.
- Files modified.
- Endpoints implemented.
- Multipart fields implemented.
- DDD packages and boundaries implemented.
- Cloudinary configuration variables.
- Compatibility differences.
- How to run `image-service`.
- How to test it.
- Remaining risks before migrating dependent services.
