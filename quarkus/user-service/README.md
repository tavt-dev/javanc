# user-service

Quarkus migration target for the current Spring Boot `user-service`.

This module does not have a Spring Boot-style `public static void main` application class. Quarkus owns the runtime bootstrap. The main HTTP entrypoint for the migrated auth/user contract is:

- `src/main/java/com/javanc/user/adapter/in/rest/AuthResource.java`

## Architecture

The module is organized as a Hexagonal DDD service:

- `domain/model`: pure user aggregate, value objects, and role enum.
- `domain/port`: repository, password, token, and id generation ports.
- `application/usecase`: auth and user use cases with transaction boundaries.
- `application/command` and `application/result`: framework-free inputs and outputs.
- `adapter/in/rest`: Jakarta REST resource, wire DTOs, token resolver, and REST mapper.
- `adapter/out/persistence`: Panache/JPA adapter mapped to MySQL table `user`.
- `adapter/out/security`: BCrypt, JWT, and random integer id adapters.
- `shared/exception`: exception types and API-compatible exception mappers.

Domain and application code do not depend on REST DTOs, Panache entities, BCrypt, or JWT implementation classes.

## Requirements

- JDK 21
- Maven wrapper from this module: `mvnw.cmd`
- MySQL running locally or reachable from the configured JDBC URL
- Database target: `portfolio`
- Runtime JWT secret from environment, not source code

Default service port:

- `8088`

## Local Environment

Use `.env.example` as the local template. Do not commit `.env`.

Required runtime values:

```powershell
$env:USER_SERVICE_PORT='8088'
$env:MYSQL_USERNAME='root'
$env:MYSQL_PASSWORD='<local-mysql-password>'
$env:USER_MYSQL_JDBC_URL='jdbc:mysql://localhost:3306/portfolio?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true'
$env:USER_DB_GENERATION='update'
$env:JWT_SECRET='local-dev-secret-with-at-least-32-bytes-1234567890'
$env:JWT_EXPIRATION_MILLIS='86400000'
```

`JWT_SECRET` is intentionally blank by default in `application.properties`. Signup/signin/refresh token flows require this variable at runtime.

## API Compatibility Notes

- Auth routes remain under `/auth/**` and keep the `ApiResponse(success,message,data)` wrapper.
- `AuthenticationResponse` still serializes the legacy field `vaild`; `isVaild` is accepted as an input alias.
- User responses no longer serialize `password` or password hashes. Requests may still include `password` where the existing contract allows password updates.
- Protected user endpoints prefer `Authorization: Bearer <token>`.
- Legacy query `token` remains accepted for `/auth/getAll`, `/auth/getlistuserbyid`, `/auth/update`, `/auth/updateactive`, and `/auth/delete` during the compatibility window.
- `/auth/ourUserDetailsService` intentionally returns `501` because the Spring mapping was broken and no new contract is invented.

## Run In Dev Mode

From `quarkus/user-service`:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path='C:\Program Files\Java\jdk-21\bin;' + $env:Path

.\mvnw.cmd quarkus:dev
```

Useful URLs:

- Health: `http://localhost:8088/q/health`
- OpenAPI: `http://localhost:8088/q/openapi`
- Dev UI: `http://localhost:8088/q/dev`
- Auth base path: `http://localhost:8088/auth`

## Package And Run

```powershell
.\mvnw.cmd -DskipTests package
java -jar target\quarkus-app\quarkus-run.jar
```

The packaged app still requires the same MySQL and JWT environment variables.

## Test

Automated tests use the Quarkus test profile with H2 in MySQL mode. They do not require local MySQL or real secrets.

```powershell
.\mvnw.cmd test
.\mvnw.cmd -f ..\pom.xml test
.\mvnw.cmd -DskipTests package
```

Expected baseline:

- DTO wire compatibility tests pass.
- Persistence mapping tests pass against H2 MySQL mode.
- Auth, password, JWT, REST, exception, and security boundary tests pass.
- Package build produces `target/quarkus-app/quarkus-run.jar`.

## Manual Smoke

After `quarkus:dev` starts on port `8088`, verify:

- `GET /q/health`
- `POST /auth/signup`
- `POST /auth/signin`
- `POST /auth/isValid`
- `GET /auth/getCurrentUser` with `Authorization: Bearer <token>`

## Postman

Import these files into Postman:

- `postman/user-service.postman_collection.json`
- `postman/user-service.postman_environment.json`

Select the `Quarkus user-service local` environment before running requests.

Recommended order:

1. `System / Health`
2. `Auth Flow / Signup`
3. `Auth Flow / Signin`
4. `Auth Flow / Is Valid Token`
5. User endpoint requests
6. `User Endpoints / Delete User` last

`Signin` stores `token`, `refreshToken`, and `userId` into the selected Postman environment. `Signup` also stores `userId` when the response contains a user.

## Commit Hygiene

Do not commit:

- `.env`
- `.idea/`
- `target/`

`.env.example` is safe to commit because it contains placeholders only.
