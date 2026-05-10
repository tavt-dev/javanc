# user-service

Production-ready Quarkus user and authentication service for the `quarkus/` backend.

The service owns:

- Authentication: `/auth/**`
- User management: `/users/**`
- Admin account provisioning: `/users/admin/accounts`
- JWT access/refresh token issuance and introspection
- Email OTP verification for public self-registration
- User persistence in MySQL table `user`

Legacy Spring-style endpoints such as `/auth/signup`, `/auth/signin`, `/auth/isValid`, `/auth/findbyid`, `/auth/checkId`, and query-token access are intentionally removed.

## Architecture

- `domain/model`: user aggregate, value objects, role and token type enums.
- `domain/model/UserAuthorizationPolicy`: domain authorization policy for self/admin and account management rules.
- `domain/port`: repository, password, token, OTP and notification ports.
- `application/usecase`: auth and user-management rules with transaction boundaries.
- `application/command` and `application/result`: framework-free application inputs and outputs.
- `adapter/in/rest`: Jakarta REST resources, request DTOs, response mapping and token resolution.
- `adapter/out/persistence`: Panache/JPA adapter mapped to MySQL.
- `adapter/out/security`: BCrypt, JWT and OTP hashing/generation implementation.
- `adapter/out/email`: REST client adapter for `email-service` verification mail.
- `shared/exception`: application exceptions and API response mappers.

## Requirements

- JDK 21
- Maven
- MySQL reachable from `USER_MYSQL_JDBC_URL`
- Database target: `portfolio`
- Strong `JWT_SECRET` supplied by environment

Default port: `8088`.

## Environment

```powershell
$env:USER_SERVICE_PORT='8088'
$env:MYSQL_USERNAME='root'
$env:MYSQL_PASSWORD='<local-mysql-password>'
$env:USER_MYSQL_JDBC_URL='jdbc:mysql://localhost:3306/portfolio?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true'
$env:USER_DB_SCHEMA_STRATEGY='validate'
$env:USER_DB_MIGRATE='true'
$env:JWT_SECRET='local-dev-secret-with-at-least-32-bytes-1234567890'
$env:JWT_ISSUER='javanc-user-service'
$env:JWT_ACCESS_EXPIRATION_SECONDS='3600'
$env:JWT_REFRESH_EXPIRATION_SECONDS='604800'
$env:OTP_VERIFICATION_LENGTH='6'
$env:OTP_VERIFICATION_TTL_SECONDS='600'
$env:OTP_VERIFICATION_MAX_ATTEMPTS='5'
$env:OTP_VERIFICATION_RESEND_COOLDOWN_SECONDS='60'
$env:OTP_HASH_SECRET='local-dev-otp-secret-with-at-least-32-bytes'
$env:EMAIL_SERVICE_URL='http://localhost:8087'
$env:USER_ADMIN_BOOTSTRAP_ENABLED='true'
$env:USER_ADMIN_EMAIL='admin@example.com'
$env:USER_ADMIN_PASSWORD='Password1!'
$env:USER_ADMIN_NAME='System Admin'
```

Flyway runs at startup by default. Use SQL migrations under `src/main/resources/db/migration`.
Admin bootstrap is disabled by default and should only be enabled for the first deployment or local setup. It creates the first `admin` account only when no admin exists.

## API Contract

All normal responses use:

```json
{
  "success": true,
  "message": "string",
  "data": {}
}
```

Errors use the correct HTTP status and:

```json
{
  "success": false,
  "message": "string",
  "data": null
}
```

### Auth

- `POST /auth/register`
  - Body: `{ "name", "email", "password" }`
  - Always creates role `user`
  - Rejects public `role` and `employeeId`
  - Creates status `PENDING_VERIFICATION`
  - Sends verification OTP through `email-service`
  - Returns: `{ "email", "status", "expiresInSeconds" }`
- `POST /auth/verify-email`
  - Body: `{ "email", "otp" }`
  - Activates the pending account and returns `AuthSession`
- `POST /auth/resend-verification-otp`
  - Body: `{ "email" }`
  - Returns a neutral success message unless resend cooldown is still active
- `POST /auth/login`
  - Body: `{ "email", "password" }`
  - Returns: `AuthSession`
  - Pending accounts return `403 Email verification required`
- `POST /auth/refresh`
  - Body: `{ "refreshToken" }`
  - Returns: `AuthSession`
- `POST /auth/introspect`
  - Body: `{ "token" }`
  - Returns: `{ "active", "subject", "userId", "role", "expiresAt" }`
- `POST /auth/logout`
  - Header: `Authorization: Bearer <accessToken>`

`AuthSession` shape:

```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "tokenType": "Bearer",
  "expiresInSeconds": 3600,
  "user": {}
}
```

### Users

All `/users/**` endpoints require `Authorization: Bearer <accessToken>`.

- `GET /users/me`: any active authenticated user.
- `GET /users/{id}`: self or `admin`.
- `GET /users?ids=1&ids=2`: `admin`.
- `GET /users`: `admin`.
- `PATCH /users/{id}`: self or `admin` can update profile fields only.
- `PATCH /users/{id}/role`: `admin`, body `{ "role": "admin|user|hr|manager" }`.
- `PATCH /users/{id}/status`: `admin`, body `{ "active": false }` or `{ "status": "PENDING_VERIFICATION|ACTIVE|DISABLED|DELETED|LOCKED" }`.
- `POST /users/admin/accounts`: `admin`, creates internal `admin|user|hr|manager` accounts.
- `DELETE /users/{id}`: `admin`, soft-deletes the user with status `DELETED`.

User responses never include password or password hash.

## Security Rules

- Access token claims: `sub=email`, `userId`, `role`, `typ=access`, `iss`, `iat`, `exp`.
- Refresh token claims: same claims with `typ=refresh`.
- `/auth/refresh` accepts only refresh tokens.
- Login, refresh, introspection and protected user operations reject inactive users.
- Public registration users cannot login or use protected APIs until email OTP verification changes status to `ACTIVE`.
- Public registration cannot create `admin`, `hr`, or `manager`; only admin account APIs can assign those roles.
- Duplicate email returns `409 Conflict`.
- Bad credentials return `401 Unauthorized` without revealing whether the email exists.

## Run

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

## Test And Package

Automated tests use H2 in MySQL mode and do not require local MySQL.

```powershell
.\mvnw.cmd test
.\mvnw.cmd -DskipTests package
```

From the parent reactor:

```powershell
cd ..
mvn test
mvn -DskipTests package
```

## Manual Smoke

1. `GET /q/health`
2. `POST /auth/register`
3. Read OTP from local mail inbox or mocked mailer log.
4. `POST /auth/verify-email`
5. `POST /auth/login`
6. `POST /auth/introspect`
7. `POST /auth/refresh`
8. `GET /users/me` with `Authorization: Bearer <accessToken>`
9. Login with bootstrapped admin.
10. Admin-only checks: `POST /users/admin/accounts`, `PATCH /users/{id}/role`, `PATCH /users/{id}/status`, `DELETE /users/{id}`.

Protected endpoints do not accept `?token=`.

## Postman

Import:

- `postman/user-service.postman_collection.json`
- `postman/user-service.postman_environment.json`

Select `Quarkus user-service local`. Run `Auth / Register`, verify the OTP with `Auth / Verify Email`, or run `Auth / Login` after verification to store `accessToken`, `refreshToken`, and `userId`.
