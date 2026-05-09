# Manager-Service Quarkus Migration Plan

## Purpose

This file is the implementation plan for migrating the current Spring Boot `manager-service` to Quarkus with a small DDD-oriented architecture. It is documentation only. It does not create Quarkus code.

The Spring service remains the source of truth until the Quarkus replacement compiles, passes tests, and is verified against the Angular client, gateway, `user-service`, `image-service`, `profile-service`, `notification-service`, and `email-service`.

## Current Service Facts

| Item | Current value | Target value |
|---|---|---|
| Source service | `microservice/manager-service` | `quarkus/manager-service` |
| Current package | `com.baconbao.manager_service` | `com.javanc.manager` |
| Current framework | Spring Boot 3.3.2 | Quarkus 3.33 LTS |
| Java version | 21 | 21 |
| Port | 8091 | 8091 |
| Database | MongoDB `microservice-portfolio` | MongoDB `microservice-portfolio` |
| Collections | `company`, `job` | `company`, `job` |
| Entity id type | `Integer` | `Integer` |
| Main downstream calls | user, image, profile, notification, email | MicroProfile REST Clients |
| Service discovery | Eureka client | No Eureka; config-backed service URLs |
| Gateway behavior | `/manager/**` is protected by current gateway filter | Preserve gateway behavior first |

Current dependencies to replace:

- Spring Web -> Quarkus REST Jackson plus multipart support for company create.
- Spring Data MongoDB and `MongoTemplate` -> Quarkus MongoDB Panache plus MongoDB client queries where needed.
- OpenFeign -> MicroProfile REST Client.
- ModelMapper -> explicit mappers.
- Lombok -> avoid if practical in Quarkus target, unless the project standard allows it.
- Eureka client -> removed.

## Current Management Domain Contract

### Company Document

`Company` maps to MongoDB collection `company`.

Fields to preserve:

- `id: Integer`
- `name: String`
- `type: String`
- `description: String`
- `street: String`
- `email: String`
- `phone: String`
- `city: String`
- `country: String`
- `url: String`
- `idManager: Integer`
- `idHr: List<Integer>`
- `idJobs: List<Integer>`

Compatibility notes:

- Current id generation is manual random `Integer` derived from UUID most-significant bits.
- `url` is stored in the Mongo document when company creation uploads an image.
- `CompanyDTO` does not expose `url`, so current create/update responses do not clearly return the stored image URL.
- `CompanyDTO` uses field `idHR`, while the document uses `idHr`. Preserve current JSON field behavior during baseline.
- Updating a company maps `CompanyDTO` back to the document. Because the DTO does not contain `url`, update may lose the stored URL unless current ModelMapper behavior preserves it through some runtime side effect. Treat this as a compatibility risk to verify.

### Job Document

`Job` maps to MongoDB collection `job`.

Fields to preserve:

- `id: Integer`
- `title: String`
- `description: String`
- `typeJob: TypeJob`
- `size: Integer`
- `idProfiePending: List<Integer>`
- `idProfile: List<Integer>`
- `idCompany: Integer`

`TypeJob` enum values:

- `java`
- `python`
- `php`

Compatibility notes:

- Preserve lower-case enum values.
- Preserve misspelled field name `idProfiePending`.
- Current create uses `TypeJob.valueOf(jobDTO.getTypeJob())`, so invalid case or unknown values fail.
- Current application acceptance decreases `size` by 1 without checking bounds.
- No duplicate application, duplicate acceptance, or capacity validation is performed.

### DTOs

Preserve these JSON fields:

`ApiResponse<T>`:

- `success`
- `message`
- `data`

`CompanyDTO`:

- `id`
- `name`
- `type`
- `description`
- `street`
- `email`
- `phone`
- `city`
- `country`
- `idManager`
- `idHR`
- `idJobs`

`JobDTO`:

- `id`
- `title`
- `description`
- `typeJob`
- `size`
- `idProfiePending`
- `idProfile`
- `idCompany`

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
- `role`

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

`ImageDTO`:

- `id`
- `url`

`MessageDTO` used for notification and email clients:

- `message`
- `id`

## Current Endpoint Contract

Base path: `/manager`

### Company Endpoints

| Method | Path | Inputs | Current response |
|---|---|---|---|
| `POST` | `/admin/company/create` | `CompanyDTO` model attributes, optional multipart part `image` | `200 OK`, `ApiResponse<CompanyDTO>` |
| `POST` | `/manager/company/update` | `CompanyDTO` JSON body | `200 OK`, `ApiResponse<CompanyDTO>` |
| `PUT` | `/manager/sethrtocompany` | `AuthenticationRequest` JSON body, query `idCompany` | `200 OK`, `ApiResponse<CompanyDTO>` |
| `POST` | `/admin/company/delete` | query `id` | `200 OK`, `ApiResponse<String>` with data `"ok"` |
| `PUT` | `/manager/setmaanagertocompany` | `AuthenticationRequest` JSON body, query `idCompany` | `200 OK`, `ApiResponse<CompanyDTO>` |
| `GET` | `/user/company/getbyid` | query `id` | `200 OK`, `ApiResponse<CompanyDTO>` |
| `GET` | `/user/company/getcompany` | none | `200 OK`, `ApiResponse<List<CompanyDTO>>` |
| `GET` | `/user/company/getcompanybytype` | query `type` | `200 OK`, `ApiResponse<List<CompanyDTO>>` |
| `GET` | `/company/getcompanybyidmanager` | query `managerId` | `200 OK`, `ApiResponse<CompanyDTO>` |
| `GET` | `/hr/findByIdHr` | query `id` | `200 OK`, `ApiResponse<CompanyDTO>` |

Current response messages to preserve during baseline:

- Create company: `"Company created successfully"`
- Update company: `"Company updated successfully"`
- Set HR: `"Head updated successfully"`
- Delete company: `"Company deleted successfully"`
- Set manager: `"Head updated successfully"`
- Get company by id: `"Company retrieved successfully"`
- Get all companies: `"Companies retrieved successfully"`
- Get by type: `"Companies retrieved successfully by type"`
- Get by manager id: `"Companies retrieved successfully by manager id"`
- Get by HR id: `"Company retrieved successfully by HR id"`

Compatibility notes:

- `POST /admin/company/create` must keep multipart field name `image`.
- `image` is optional; if absent, the stored `url` is an empty string.
- The misspelled route `/manager/setmaanagertocompany` must be preserved.
- `deleteHRToCompany` exists in the service interface but has no controller endpoint.

### Job Endpoints

| Method | Path | Inputs | Current response |
|---|---|---|---|
| `POST` | `/hr/job/create` | `JobDTO` JSON body | `200 OK`, `ApiResponse<JobDTO>` |
| `POST` | `/hr/job/update` | `JobDTO` JSON body | `200 OK`, `ApiResponse<JobDTO>` |
| `POST` | `/hr/job/delete` | query `id` | `200 OK`, `ApiResponse<String>` with data `"Ok"` |
| `PUT` | `/user/job/apply` | query `jobDTO`, query `idProfile` | `200 OK`, `ApiResponse<JobDTO>` |
| `PUT` | `/hr/job/accept` | query `jobDTO`, query `idProfile` | `200 OK`, `ApiResponse<JobDTO>` |
| `PUT` | `/hr/job/reject` | query `jobDTO`, query `idProfile` | `200 OK`, `ApiResponse<JobDTO>` |
| `GET` | `/user/job/findbyid` | unannotated `Integer id`, clients call query `id` | `200 OK`, `ApiResponse<JobDTO>` |
| `GET` | `/user/job/getall` | none | `200 OK`, `ApiResponse<List<JobDTO>>` |
| `GET` | `/user/job/getjobbycompany` | query `id` | `200 OK`, `ApiResponse<List<JobDTO>>` |
| `GET` | `/user/job/getjobpending` | query `id` | `200 OK`, `ApiResponse<List<JobDTO>>` |
| `GET` | `/user/job/getjobaccepted` | query `id` | `200 OK`, `ApiResponse<List<JobDTO>>` |
| `GET` | `/user/job/getnewjob` | query `id` | `200 OK`, `ApiResponse<List<JobDTO>>` |

Current response messages to preserve during baseline:

- Create job: `"Job created"`
- Update job: `"Job updated"`
- Delete job: `"Job deleted"`
- Apply: `"Job applied"`
- Accept: `"Job accepted"`
- Reject: `"Job rejected"`
- Find by id: `"Job found"`
- Get all: `"Jobs found"`
- Get by company: `"Jobs found"`
- Get pending: `"Jobs pending found"`
- Get accepted: `"Jobs accepted found"`
- Get new jobs: `"New jobs found"`

Compatibility notes:

- Query parameter name `jobDTO` actually carries the job id.
- `GET /user/job/findbyid` lacks `@RequestParam` on `id`; Angular calls `?id=...`. Quarkus should intentionally support query `id` during baseline.
- Delete response data is `"Ok"` with uppercase `O`; company delete response data is `"ok"` lowercase.

## Current Business Behavior

### Company Behavior

Current create:

- Accepts form fields bound to `CompanyDTO` plus optional multipart part `image`.
- If image is present, calls image-service `POST /image/save` with multipart part `image`.
- Reads `imageClient.save(image).getData().getUrl()` without null checks.
- Generates random integer company id manually.
- Stores a MongoDB `Company` with request fields and stored `url`.
- Does not set `idManager`, `idHr`, or `idJobs` during initial create.
- Returns mapped `CompanyDTO`.

Current update:

- Accepts JSON `CompanyDTO`.
- Saves mapped `Company` by id.
- Catches `MongoWriteException` and `DataAccessException`.
- May clear fields not present in `CompanyDTO`, including image `url`.

Current delete:

- Calls `companyRepository.deleteById(id)`.
- Does not verify the company existed before returning success.

Current get all:

- Uses Mongo query with limit 50.
- Returns an empty list on `DataAccessException`.

Current get by type:

- Uses Mongo regex query against field `type`.
- Limits results to 20.
- Returns an empty list on `DataAccessException`.

Current set HR:

- Mutates incoming `AuthenticationRequest.role` to `"hr"`.
- Calls user-service `POST /auth/signup`.
- Reads `response.data.user.id` without null checks.
- Loads company by `idCompany`.
- Initializes `idHR` list if null.
- Appends the new user id.
- Updates the company.

Current set manager:

- Mutates incoming `AuthenticationRequest.role` to `"manager"`.
- Calls user-service `POST /auth/signup`.
- Reads `response.data.user.id` without null checks.
- Loads company by id.
- Sets `idManager` to the new user id.
- Saves the company.

Current find by manager and HR:

- `getCompanyByIdManager` queries Mongo field `idManager`.
- `findByIdHr` queries Mongo field `idHr`.
- Both throw `COMPANY_NOT_FOUND` when no document is found.

### Job Behavior

Current create:

- Generates random integer job id manually.
- Converts `JobDTO.typeJob` with `TypeJob.valueOf(...)`.
- Saves title, description, type, size, pending profile ids, accepted profile ids, and company id.

Current update:

- Saves mapped `JobDTO` as a `Job`.
- Does not preserve missing fields unless they are present in the DTO.

Current get all and search:

- `getAllJobs` returns at most 20 jobs.
- `getJobByCompany` queries `idCompany`.
- `getJobByPrfilePending` queries array field `idProfiePending`.
- `getJobByProfileAccepted` queries array field `idProfile`.
- `getNewJob` queries jobs where `idProfiePending` does not contain the profile id and `idProfile` does not contain the profile id.

Current apply:

- Loads job by id.
- Initializes `idProfiePending` if null.
- Calls profile-service `GET /profile/user/findById?id=...` but ignores the response body.
- Adds the profile id to `idProfiePending`.
- Saves the job.
- Does not check duplicates.

Current accept:

- Loads job by id.
- Removes profile id from `idProfiePending` if the pending list exists.
- Initializes `idProfile` if null.
- Decrements `size` by 1.
- Adds profile id to `idProfile`.
- Updates the job once.
- Calls profile-service `GET /profile/user/findById?id=...`.
- Builds `MessageDTO` with:
  - `message = "accept job successful by" + jobDTO.getTypeJob()`
  - `id = profile.data.idUser`
- Updates the job a second time.
- Calls notification-service `POST /notification/create`.
- Calls email-service `POST /email/create`.
- Returns the second updated job.

Current reject:

- Loads job by id.
- Reads `idProfiePending` without null check.
- Removes the profile id.
- Saves the job.

Current delete:

- Loads job by id and throws `JOB_NOT_FOUND` if absent.
- Deletes the job.
- Returns the deleted job internally, while the controller returns string `"Ok"`.

## Current REST Client Contracts

### User Client

Spring Feign client: `microservice/manager-service/.../openfeign/UserClient.java`

Current calls:

- `POST /auth/signup`, body `AuthenticationRequest`, response `ApiResponse<AuthenticationResponse>`.
- `GET /auth/getCurrentUser`, response `ApiResponse<UserDTO>`.
- `GET /findbyid`, query `id`, response `ApiResponse<UserDTO>`.

Compatibility issue:

- `GET /findbyid` omits `/auth`, while user-service exposes `/auth/findbyid`.
- The current manager-service implementation does not appear to call `findById`.

Quarkus target:

- Use MicroProfile REST Client with `services.user.url=${USER_SERVICE_URL:http://localhost:8088}`.
- Preserve `POST /auth/signup` for HR and manager creation.
- Do not add new current-user or find-by-id behavior unless a current flow needs it.
- If `findById` is ported, document whether it keeps the broken `/findbyid` path for compatibility or intentionally uses `/auth/findbyid`.

### Image Client

Current call:

- `POST /image/save`, multipart part `image`, response `ApiResponse<ImageDTO>`.

Quarkus target:

- Use MicroProfile REST Client with `services.image.url=${IMAGE_SERVICE_URL:http://localhost:8083}`.
- Preserve multipart part name `image`.
- Only company create currently calls image-service.

### Profile Client

Current calls:

- `GET /profile/user/checkIdProfile`, query `id`, response `ApiResponse<String>`.
- `GET /profile/user/findById`, query `id`, response `ApiResponse<ProfileDTO>`.

Compatibility notes:

- `checkIdProfile` is present but not used by active job code.
- `findById` is used during apply and accept.
- Apply calls profile-service only as an existence check and ignores the response body.
- Accept uses `ProfileDTO.idUser` to send notification and email.

### Notification Client

Current call:

- `POST /notification/create`, body `MessageDTO`, response `ApiResponse<String>`.

Current use:

- Called only during job acceptance after the second job update.

### Email Client

Current call:

- `POST /email/create`, body `MessageDTO`, response `ApiResponse<String>`.

Current use:

- Called only during job acceptance after notification creation.

## Current Consumers To Verify

Angular client:

- Calls gateway base URL `http://localhost:8080/manager/`.
- Sends bearer token for manager routes.
- Uses company endpoints:
  - `POST /manager/admin/company/create`
  - `POST /manager/manager/company/update`
  - `POST /manager/admin/company/delete?id=...`
  - `GET /manager/user/company/getbyid?id=...`
  - `GET /manager/company/getcompanybyidmanager?managerId=...`
  - `PUT /manager/manager/sethrtocompany?idCompany=...`
  - `PUT /manager/manager/setmaanagertocompany?idCompany=...`
  - `GET /manager/user/company/getcompany`
  - `GET /manager/user/company/getcompanybytype?type=...`
- Uses job endpoints:
  - `POST /manager/hr/job/create`
  - `POST /manager/hr/job/update`
  - `POST /manager/hr/job/delete?id=...`
  - `PUT /manager/user/job/apply?jobDTO=...&idProfile=...`
  - `GET /manager/user/job/findbyid?id=...`
  - `GET /manager/user/job/getall`
  - `GET /manager/user/job/getjobbycompany?id=...`
  - `GET /manager/user/job/getjobpending?id=...`
  - `GET /manager/user/job/getjobaccepted?id=...`
  - `GET /manager/user/job/getnewjob?id=...`
  - `PUT /manager/hr/job/accept?jobDTO=...&idProfile=...`
  - `PUT /manager/hr/job/reject?jobDTO=...&idProfile=...`

Gateway:

- Current route `/manager/**` is protected by `AuthenticationFilter`.
- Baseline manager-service should not implement its own JWT validation unless the gateway migration plan requires it.

Downstream services:

- `user-service` must be available for setting HR and manager users.
- `image-service` must be available for company image upload.
- `profile-service` must be available for apply and accept flows.
- `notification-service` and `email-service` must be available for accept flow side effects.

## Current Risks And Cleanup Candidates

Do not silently fix these during baseline unless the phase explicitly allows it:

- `MongoConfig` hardcodes the MongoDB connection string while `application.properties` also defines it.
- Random integer id generation can collide.
- `CompanyDTO` lacks `url`, while `Company` stores `url`.
- Company update may clear image URL and other fields not present in the DTO.
- Angular maps `companyDTO.image`, but the backend DTO does not expose `image`.
- Route `/manager/setmaanagertocompany` is misspelled.
- Field `idProfiePending` is misspelled and must be preserved during baseline.
- `GET /manager/user/job/findbyid` lacks `@RequestParam` in Spring code.
- `UserClient.findById` path omits `/auth`.
- `TypeJob` values are lowercase and `valueOf` is case-sensitive.
- Set HR and set manager create users through signup without checking response validity.
- Set HR can add duplicate HR ids.
- Apply can add duplicate pending profile ids.
- Accept can add duplicate accepted profile ids and decrement job size below zero.
- Accept updates the job twice.
- Accept sends notification/email after database update; failures can leave job accepted without side effects.
- Reject can throw a null pointer when `idProfiePending` is null.
- Generic exception handler exposes raw exception messages in `ApiResponse.message`.
- Logs and `System.out.println` print DTO/document details; avoid sensitive payload logging in Quarkus.

## Target DDD Architecture

Use a lightweight DDD structure. The management domain has two main aggregates: company and job.

Target package root:

```text
com.javanc.manager
```

Recommended package layout:

```text
domain/
  model/          Company, Job, TypeJob
  repository/     CompanyRepository, JobRepository ports
  service/         ManagerIdGenerator or domain helpers
application/
  dto/             ApiResponse, CompanyDTO, JobDTO, downstream DTOs
  mapper/          CompanyMapper, JobMapper
  port/            UserAccountPort, ImageStoragePort, ProfileLookupPort, NotificationPort, EmailPort
  service/         CompanyApplicationService, JobApplicationService
infrastructure/
  persistence/     Mongo company/job entities or Panache repositories/adapters
  client/          UserClient, ImageClient, ProfileClient, NotificationClient, EmailClient and adapters
  config/          Mongo/client config mappings
interfaces/
  rest/
    resource/      CompanyResource, JobResource
    form/          CompanyMultipartForm
  rest/exception/  ExceptionMapper classes
```

DDD boundary rules:

- Application services own use cases: create/update company, assign HR/manager, create/update/apply/accept/reject jobs.
- Domain models represent Mongo document state that exists today; do not redesign schema during baseline.
- MongoDB repositories are infrastructure behind domain/application ports.
- Downstream HTTP calls are infrastructure behind application ports.
- REST resources adapt HTTP requests to application services and preserve current endpoint compatibility.
- Keep the DDD split practical. Do not introduce events, process managers, outbox tables, role policies, or new validation rules during baseline unless explicitly approved.

Suggested ports:

- `CompanyRepositoryPort.save/find/delete/query`.
- `JobRepositoryPort.save/find/delete/query`.
- `ImageStoragePort.uploadCompanyImage`.
- `UserAccountPort.createHr/createManager`.
- `ProfileLookupPort.findProfileById`.
- `NotificationPort.notifyUser`.
- `EmailPort.emailUser`.

## Phase 0: Source Inventory And Contract Freeze

Goal: capture current behavior before writing Quarkus code.

Tasks:

- Inspect all files under `microservice/manager-service/src/main/java/com/baconbao/manager_service`.
- Freeze endpoint paths, HTTP methods, query names, request bodies, multipart fields, response wrappers, and messages listed in this document.
- Freeze MongoDB contract: database `microservice-portfolio`, collections `company` and `job`, id type `Integer`.
- Freeze enum contract: `java`, `python`, `php`.
- Freeze downstream contracts for user, image, profile, notification, and email clients.
- Verify Angular behavior for company create multipart fields and job query params.
- Decide per known risk whether baseline preserves it or documents a safe intentional fix.

Deliverables:

- Updated docs only if new facts are discovered.
- No Java code.
- No Quarkus scaffold.

Acceptance:

- Future implementer can list exact files to create and modify.
- No unresolved endpoint, DTO field, Mongo field, multipart field, or downstream path ambiguity remains for baseline migration.

## Phase 1: Quarkus Module Scaffold

Goal: create the minimum Quarkus module for `manager-service` only.

Target files when implementation begins:

- `quarkus/manager-service/pom.xml`.
- `quarkus/manager-service/src/main/resources/application.properties`.
- Initial package root: `quarkus/manager-service/src/main/java/com/javanc/manager`.
- Initial test package root: `quarkus/manager-service/src/test/java/com/javanc/manager`.

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
quarkus.application.name=manager-service
quarkus.http.port=${MANAGER_SERVICE_PORT:8091}

quarkus.mongodb.connection-string=${MONGODB_CONNECTION_STRING:mongodb://localhost:27017}
quarkus.mongodb.database=${MONGODB_DATABASE:microservice-portfolio}
quarkus.http.body.uploads-directory=${MANAGER_UPLOADS_DIR:target/uploads}
quarkus.http.limits.max-body-size=${MANAGER_MAX_BODY_SIZE:10M}

services.user.url=${USER_SERVICE_URL:http://localhost:8088}
services.image.url=${IMAGE_SERVICE_URL:http://localhost:8083}
services.profile.url=${PROFILE_SERVICE_URL:http://localhost:8085}
services.notification.url=${NOTIFICATION_SERVICE_URL:http://localhost:8084}
services.email.url=${EMAIL_SERVICE_URL:http://localhost:8087}
```

Acceptance:

- `manager-service` module exists.
- It compiles with no business logic.
- No Eureka dependency exists.
- MongoDB and downstream URLs are environment-backed.
- No real secret exists in config.

## Phase 2: DTO, Domain Model, And Mapper Migration

Goal: port external JSON and Mongo document contracts before business logic.

Target packages:

- `com.javanc.manager.application.dto`
- `com.javanc.manager.domain.model`
- `com.javanc.manager.application.mapper`

Create:

- `ApiResponse<T>`
- `CompanyDTO`
- `JobDTO`
- `AuthenticationRequest`
- `AuthenticationResponse`
- `UserDTO`
- `ProfileDTO`
- `ImageDTO`
- `MessageDTO`
- `BooleanDTO` only if a current client path still needs it
- `Company`
- `Job`
- `Contact`
- `TypeJob`
- `CompanyMapper`
- `JobMapper`

Rules:

- Preserve JSON field names exactly.
- Preserve `CompanyDTO.idHR` field name.
- Preserve `JobDTO.idProfiePending` field name.
- Preserve lower-case `TypeJob` enum values.
- Preserve nullable list behavior.
- Replace ModelMapper with explicit mappers so `idHr` to `idHR` and `typeJob` enum/string behavior is controlled.
- Do not add `url` to `CompanyDTO` during baseline unless compatibility testing approves it.

Acceptance:

- JSON serialization tests prove DTO field names match current DTOs.
- Mapper tests prove `Company.idHr` maps to `CompanyDTO.idHR`.
- Mapper tests prove `Job.typeJob=java` maps to `JobDTO.typeJob="java"` and back.
- Mapper tests document null list behavior for HR ids, pending profile ids, and accepted profile ids.

## Phase 3: MongoDB Persistence Migration

Goal: port company and job persistence without schema redesign.

Target packages:

- `com.javanc.manager.domain.repository`
- `com.javanc.manager.infrastructure.persistence`

Create:

- Mongo document mapping for `company`.
- Mongo document mapping for `job`.
- Company repository port and Mongo adapter.
- Job repository port and Mongo adapter.
- Query helpers for current MongoTemplate queries.

Company query rules:

- Find by id.
- Delete by id without requiring an existence check during baseline.
- Get all companies with limit 50.
- Find company by regex `type`, limit 20.
- Find one company by `idManager`.
- Find one company by `idHr`.

Job query rules:

- Find by id.
- Delete existing job.
- Get all jobs with limit 20.
- Find jobs by `idCompany`.
- Find jobs where `idProfiePending` contains profile id.
- Find jobs where `idProfile` contains profile id.
- Find jobs where neither `idProfiePending` nor `idProfile` contains profile id.

Acceptance:

- Repository tests can persist and find company and job documents by `Integer` id.
- Query tests cover manager id, HR id, company type regex, company limit, job by company, pending, accepted, and new-job queries.
- Existing MongoDB documents can be reused.
- No schema migration tool is introduced during the first pass.

## Phase 4: Downstream REST Client Migration

Goal: port all dependent service calls behind application ports.

Target packages:

- `com.javanc.manager.application.port`
- `com.javanc.manager.infrastructure.client`

Create ports and adapters:

- `UserAccountPort` for `POST /auth/signup`.
- `ImageStoragePort` for `POST /image/save`.
- `ProfileLookupPort` for `GET /profile/user/findById`.
- `NotificationPort` for `POST /notification/create`.
- `EmailPort` for `POST /email/create`.

Rules:

- Use config-backed service URLs.
- Preserve multipart part name `image` for image-service.
- Preserve `MessageDTO` fields `message` and `id`.
- Preserve notification/email send order during baseline.
- Do not introduce Eureka, service names, or hardcoded localhost values in Java code.
- Do not add new downstream calls unless the Spring behavior already performs them.
- Document the unresolved `UserClient.findById` path if it is ported.

Acceptance:

- Client tests or adapter tests verify paths, methods, query params, and multipart part names.
- Application service tests can stub every downstream port.
- No hardcoded localhost exists in Java source.

## Phase 5: Company Application Service Migration

Goal: port company use cases.

Target package:

- `com.javanc.manager.application.service`

Create:

- `CompanyApplicationService`.
- Id generation helper preserving current random integer behavior.

Rules:

- Preserve create behavior, including optional image and empty URL fallback.
- Preserve update behavior, including full document save from incoming DTO.
- Preserve delete behavior, including success on delete-by-id without a pre-check.
- Preserve get-all limit 50.
- Preserve type search regex and limit 20.
- Preserve set-HR behavior: force role `"hr"`, call user signup, append returned user id.
- Preserve set-manager behavior: force role `"manager"`, call user signup, set `idManager`.
- Preserve find-by-manager and find-by-HR behavior.
- Do not add role validation, duplicate HR prevention, or ownership checks during baseline.

Acceptance:

- Unit tests cover create with image, create without image, update, delete, get all, get by type, set HR, set manager, find by id, find by manager id, and find by HR id.
- Tests document image URL behavior and whether update preserves or clears URL.
- Tests cover downstream user signup response handling.

## Phase 6: Job Application Service Migration

Goal: port job use cases.

Target package:

- `com.javanc.manager.application.service`

Create:

- `JobApplicationService`.
- Shared id generation helper if not created in Phase 5.

Rules:

- Preserve create behavior and `TypeJob.valueOf` semantics.
- Preserve update behavior as a full save.
- Preserve get-all limit 20.
- Preserve all query behaviors.
- Preserve apply behavior: profile lookup, append profile id to pending list, update job.
- Preserve accept behavior:
  - remove profile id from pending list if list exists
  - initialize accepted list if null
  - decrement size
  - append profile id
  - update job
  - fetch profile
  - build message text exactly as `"accept job successful by" + typeJob`
  - update job again
  - call notification
  - call email
  - return second updated job
- Preserve reject behavior and document null pending-list failure behavior.
- Preserve delete behavior: load job, delete it, controller returns `"Ok"`.
- Do not add duplicate prevention, capacity checks, outbox, retries, or transaction redesign during baseline.

Acceptance:

- Unit tests cover create, invalid type behavior, update, delete existing, delete missing, apply, accept, reject, get all, get by company, pending, accepted, and new jobs.
- Tests verify accept calls notification and email after update.
- Tests verify message text and recipient id come from profile `idUser`.
- Tests document what happens when notification or email fails after job update.

## Phase 7: REST Resource Migration

Goal: expose `/manager/**` endpoints with compatible behavior.

Target packages:

- `com.javanc.manager.interfaces.rest.resource`
- `com.javanc.manager.interfaces.rest.form`

Create:

- `CompanyResource` with base path `/manager`.
- `JobResource` with base path `/manager`.
- `CompanyMultipartForm` or equivalent for company create.

Endpoint rules:

- Preserve all current paths and methods.
- Preserve query parameter names: `id`, `type`, `idCompany`, `managerId`, `jobDTO`, `idProfile`.
- Preserve multipart part name `image`.
- Preserve JSON request bodies for update, set HR, set manager, create job, and update job.
- Preserve response wrapper shape and messages.
- Preserve route typo `/manager/setmaanagertocompany`.
- Intentionally support `GET /manager/user/job/findbyid?id=...` despite missing Spring `@RequestParam`.
- Do not add service-level JWT checks during baseline; keep gateway as the compatibility owner.

Acceptance:

- Resource tests verify each company endpoint success response shape.
- Resource tests verify each job endpoint success response shape.
- Resource tests verify multipart company create uses part name `image`.
- Resource tests verify error mappers return compatible `ApiResponse<String>` where practical.

## Phase 8: Exceptions And Error Responses

Goal: replace Spring exception handling with Quarkus exception mappers.

Target package:

- `com.javanc.manager.interfaces.rest.exception`

Create:

- `ErrorCode` equivalent preserving current codes/messages/statuses.
- `ApplicationException` or `CustomException` equivalent.
- `BadRequestException`.
- Exception mappers returning `ApiResponse<String>` with `success=false` and `data=""`.

Rules:

- Preserve current error HTTP statuses for known custom errors.
- Preserve `ApiResponse<String>` error shape.
- Preserve `data=""` for mapped exceptions.
- Avoid exposing stack traces.
- Decide whether generic exception messages are preserved exactly or sanitized. Baseline recommendation: keep response shape, but document any safer message change.

Acceptance:

- Tests verify `COMPANY_NOT_FOUND` returns HTTP `404` with `success=false`.
- Tests verify `JOB_NOT_FOUND` returns HTTP `404` with `success=false`.
- Tests verify Mongo/database errors map to configured statuses where practical.
- Tests document invalid enum and null-list failure behavior.

## Phase 9: Test Plan

Goal: prove baseline compatibility for the highest-dependency service.

Minimum company tests:

- `POST /manager/admin/company/create` without image returns success wrapper.
- `POST /manager/admin/company/create` with multipart part `image` calls image-service and stores URL.
- `POST /manager/manager/company/update` returns success wrapper.
- `POST /manager/admin/company/delete?id=...` returns data `"ok"`.
- `PUT /manager/manager/sethrtocompany?idCompany=...` creates HR user and appends id to `idHR`.
- `PUT /manager/manager/setmaanagertocompany?idCompany=...` creates manager user and sets `idManager`.
- `GET /manager/user/company/getbyid?id=...` returns company.
- `GET /manager/user/company/getcompany` returns at most 50 companies.
- `GET /manager/user/company/getcompanybytype?type=...` performs regex search and returns at most 20 companies.
- `GET /manager/company/getcompanybyidmanager?managerId=...` returns company.
- `GET /manager/hr/findByIdHr?id=...` returns company.

Minimum job tests:

- `POST /manager/hr/job/create` returns success wrapper.
- Job create preserves lower-case `typeJob` values.
- `POST /manager/hr/job/update` returns success wrapper.
- `POST /manager/hr/job/delete?id=...` returns data `"Ok"`.
- `PUT /manager/user/job/apply?jobDTO=...&idProfile=...` appends pending profile id.
- `PUT /manager/hr/job/accept?jobDTO=...&idProfile=...` moves profile id to accepted list, decrements size, sends notification and email.
- `PUT /manager/hr/job/reject?jobDTO=...&idProfile=...` removes pending profile id.
- `GET /manager/user/job/findbyid?id=...` returns job.
- `GET /manager/user/job/getall` returns at most 20 jobs.
- `GET /manager/user/job/getjobbycompany?id=...` returns jobs by company.
- `GET /manager/user/job/getjobpending?id=...` returns pending jobs.
- `GET /manager/user/job/getjobaccepted?id=...` returns accepted jobs.
- `GET /manager/user/job/getnewjob?id=...` excludes pending and accepted jobs for the profile id.

Test infrastructure:

- Prefer Quarkus tests.
- Use a test profile config.
- Use an isolated MongoDB test database or Testcontainers when available.
- Stub downstream user, image, profile, notification, and email ports for application/resource tests.
- Do not require live downstream services in unit tests.

## Phase 10: Run Readiness For Quarkus manager-service

Goal: make the migrated Quarkus `manager-service` easy to run locally against MongoDB and migrated or Spring dependencies.

Runtime facts:

- Default port remains `8091`.
- Health endpoint is `/q/health`.
- OpenAPI endpoint is `/q/openapi`.
- Manager base path remains `/manager`.
- MongoDB database remains `microservice-portfolio`.
- Company and job collections remain `company` and `job`.
- Current gateway-protected route behavior is still owned by the gateway.

Required documentation and templates:

- Add `quarkus/manager-service/README.md` with project-specific run instructions.
- Add `quarkus/manager-service/.env.example` with placeholders only:
  - `MANAGER_SERVICE_PORT=8091`
  - `MONGODB_CONNECTION_STRING=mongodb://localhost:27017`
  - `MONGODB_DATABASE=microservice-portfolio`
  - `USER_SERVICE_URL=http://localhost:8088`
  - `IMAGE_SERVICE_URL=http://localhost:8083`
  - `PROFILE_SERVICE_URL=http://localhost:8085`
  - `NOTIFICATION_SERVICE_URL=http://localhost:8084`
  - `EMAIL_SERVICE_URL=http://localhost:8087`
  - `MANAGER_MAX_BODY_SIZE=10M`

Local run command from `quarkus/manager-service`:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path='C:\Program Files\Java\jdk-21\bin;' + $env:Path

$env:MANAGER_SERVICE_PORT='8091'
$env:MONGODB_CONNECTION_STRING='mongodb://localhost:27017'
$env:MONGODB_DATABASE='microservice-portfolio'
$env:USER_SERVICE_URL='http://localhost:8088'
$env:IMAGE_SERVICE_URL='http://localhost:8083'
$env:PROFILE_SERVICE_URL='http://localhost:8085'
$env:NOTIFICATION_SERVICE_URL='http://localhost:8084'
$env:EMAIL_SERVICE_URL='http://localhost:8087'

.\mvnw.cmd quarkus:dev
```

Manual smoke after startup:

- `GET /q/health` returns healthy.
- `GET /manager/user/company/getcompany` returns an `ApiResponse`.
- `POST /manager/admin/company/create` creates a company with form fields.
- `POST /manager/hr/job/create` creates a job.
- `PUT /manager/user/job/apply` moves a profile into the pending list.
- `PUT /manager/hr/job/accept` moves a profile into the accepted list and calls notification/email services.

Commit hygiene:

- Do not commit `quarkus/manager-service/.env`.
- Do not commit `quarkus/manager-service/.idea/`.
- Do not commit `quarkus/manager-service/target/`.
- Commit `.env.example` because it contains placeholders only.

Acceptance:

- A developer can run `manager-service` locally without Eureka.
- Runtime setup is explicit about MongoDB, port, multipart size, and downstream service URLs.
- No real secret is added to source control.
- No business behavior changes are introduced by this phase.

## Phase 11: Gateway And Downstream Integration

Goal: verify the migrated Quarkus manager-service works with current or future gateway and dependent services.

Compatibility checks:

- Angular manager pages can access `/manager/**` through gateway with bearer token.
- Gateway still protects `/manager/**`.
- Company create can call migrated or Spring image-service.
- Set HR/manager can call migrated or Spring user-service.
- Job apply/accept can call migrated or Spring profile-service.
- Job accept can call migrated or Spring notification-service and email-service.
- Response wrappers still satisfy Angular `Apiresponse<T>` mapping.

Known integration points:

- `client/src/app/service/company-service.service.ts` expects `idHR`, `idJobs`, and an `image` field even though backend DTO does not expose `image`.
- `client/src/app/service/job-service.service.ts` uses query `jobDTO` for job id.
- `profile-service` `checkIdProfile` always returns `"true"` during baseline, but manager currently does not call it in active code.
- `email-service` and `notification-service` side effects happen after job persistence.

Acceptance:

- Angular company list, create, update, set HR, set manager, and company search flows work through the gateway.
- Angular job create, update, apply, accept, reject, and list flows work through the gateway.
- Downstream compatibility gaps are listed before gateway migration.

## Phase 12: Hardening After Baseline

Only perform after baseline is verified.

Candidate cleanup:

- Add validation annotations for required company and job fields.
- Add `url` or a clearly named image field to `CompanyDTO` only after frontend compatibility is reviewed.
- Preserve company image URL during update.
- Replace random integer ids with a safer strategy only with database migration approval.
- Prevent duplicate HR, pending profile, and accepted profile ids.
- Prevent job size from going below zero.
- Make apply/accept/reject idempotent where product flow needs it.
- Replace accept double-update with a single save plus reliable side effects.
- Add transactional/outbox-style handling for notification/email side effects if reliability matters.
- Fix route typo `/manager/setmaanagertocompany` by adding a new route only after existing clients move.
- Fix `idProfiePending` spelling only with an approved schema/API migration.
- Normalize `TypeJob` input or add a controlled validation error for invalid case.
- Remove unused `UserClient.findById`, `getCurrentUser`, `BooleanDTO`, and `deleteHRToCompany` if no flow needs them.
- Stop exposing low-level exception messages in generic error responses.
- Add role-based authorization once gateway and user roles are stable.

## Implementation Stop Conditions

Stop and ask before proceeding if:

- Existing clients need `CompanyDTO.url` or `image` added during baseline.
- Updating a company must preserve existing image URL during baseline.
- The misspelled route `/manager/setmaanagertocompany` should be replaced instead of preserved.
- The misspelled field `idProfiePending` should be renamed.
- `TypeJob` casing should be changed from lower-case values.
- Accept flow needs reliable notification/email behavior before baseline compatibility.
- User signup response shape differs from current `AuthenticationResponse.user.id`.
- A schema or id generation migration becomes necessary.

## Final Deliverables For Actual Migration

When implementation is requested later, the final response must include:

- Files created.
- Files modified.
- Endpoints implemented.
- Multipart fields implemented.
- DDD packages and boundaries implemented.
- Mongo collections and fields implemented.
- Downstream clients implemented.
- Compatibility differences.
- How to run `manager-service`.
- How to test it.
- Remaining risks before migrating `gateway-service`.
