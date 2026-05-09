# profile-service

Quarkus migration target for the current Spring Boot `profile-service`.

This module does not have a Spring Boot-style `public static void main` application class. Quarkus owns the runtime bootstrap. The main HTTP entrypoint for the migrated profile contract is:

- `src/main/java/com/javanc/profile/interfaces/rest/resource/ProfileResource.java`

## Architecture

The module is organized with a small DDD-style boundary:

- `domain/model`: Mongo document and value objects such as `Profile`, `Contact`, and `TypeProfile`.
- `domain/repository`: repository contract used by application code.
- `application/service`: profile use cases.
- `application/port`: outbound ports for image storage and user lookup.
- `application/mapper`: explicit DTO/domain mapping.
- `infrastructure/persistence`: MongoDB Panache repository adapter.
- `infrastructure/client`: MicroProfile REST clients and outbound adapters.
- `interfaces/rest`: HTTP resource, multipart form model, response DTOs, and exception mappers.

## Requirements

- JDK 21
- Maven wrapper from this module: `mvnw.cmd`
- MongoDB running locally or reachable from the configured connection string
- Optional reachable `image-service` for profile image upload

Default service port:

- `8085`

## Local Environment

Use `.env.example` as the local template. Do not commit `.env`.

Required runtime values:

```powershell
$env:PROFILE_SERVICE_PORT='8085'
$env:MONGODB_CONNECTION_STRING='mongodb://localhost:27017'
$env:MONGODB_DATABASE='microservice-portfolio'
$env:IMAGE_SERVICE_URL='http://localhost:8083'
$env:USER_SERVICE_URL='http://localhost:8088'
$env:PROFILE_MAX_BODY_SIZE='10M'
```

## Run In Dev Mode

From `quarkus/profile-service`:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path='C:\Program Files\Java\jdk-21\bin;' + $env:Path

.\mvnw.cmd quarkus:dev
```

Useful URLs:

- Health: `http://localhost:8085/q/health`
- OpenAPI: `http://localhost:8085/q/openapi`
- Dev UI: `http://localhost:8085/q/dev`
- Profile base path: `http://localhost:8085/profile`

## Package And Run

```powershell
.\mvnw.cmd -DskipTests package
java -jar target\quarkus-app\quarkus-run.jar
```

The packaged app still requires the same MongoDB and downstream service URL environment variables.

## Test

```powershell
.\mvnw.cmd test
.\mvnw.cmd -f ..\pom.xml test
.\mvnw.cmd -DskipTests package
```

## Manual Smoke

After `quarkus:dev` starts on port `8085`, verify:

- `GET /q/health`
- `GET /profile/user/getAll`
- `POST /profile/user/save` with multipart form fields
- `POST /profile/user/update` with multipart form fields
- `GET /profile/user/findByUserId?userId=<id>`

## Postman

Import these files into Postman:

- `postman/profile-service.postman_collection.json`
- `postman/profile-service.postman_environment.json`

Select the `Quarkus profile-service local` environment before running requests. Set `authToken` if requests go through the gateway or another protected route. Direct local service calls to `http://localhost:8085` do not validate JWT in the profile service.

## Commit Hygiene

Do not commit:

- `.env`
- `.idea/`
- `target/`

`.env.example` is safe to commit because it contains placeholders only.
