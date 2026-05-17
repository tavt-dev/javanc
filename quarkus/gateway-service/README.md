# Gateway Service

Quarkus replacement for `microservice/api-gateway`.

The gateway uses static service URLs instead of Eureka. `user-service` remains the owner of token introspection through `POST /auth/introspect`.

Rate limiting is handled in the gateway before forwarding:

- public auth, read, write, and upload traffic use IP-scoped Redis token buckets;
- protected routes also receive user-scoped limits after token introspection;
- `RATE_LIMIT_MODE=shadow` observes over-limit traffic without blocking it;
- `RATE_LIMIT_MODE=enforce` returns `429` with `RateLimit-*` headers;
- `GATEWAY_RATE_LIMIT_TRUSTED_PROXY_CIDRS` must be set before forwarded client IP headers are trusted.

## Routes

| Path | Target env var | Auth |
|---|---|---|
| `/auth/**` | `USER_SERVICE_URL` | public |
| `/users/**` | `USER_SERVICE_URL` | bearer token required |
| `/profiles/**` | `PROFILE_SERVICE_URL` | bearer token required |
| `/project/**` | `PROJECT_SERVICE_URL` | bearer token required |
| `/notification/**` | `NOTIFICATION_SERVICE_URL` | public |
| `/manager/**` | `MANAGER_SERVICE_URL` | bearer token required |
| `/image/**` | `IMAGE_SERVICE_URL` | public |

`/email/**` is intentionally not exposed in the baseline gateway because the Spring gateway did not route it.

## Local Run

```powershell
$env:GATEWAY_SERVICE_PORT='8080'
$env:USER_SERVICE_URL='http://localhost:8088'
$env:PROFILE_SERVICE_URL='http://localhost:8085'
$env:PROJECT_SERVICE_URL='http://localhost:8086'
$env:NOTIFICATION_SERVICE_URL='http://localhost:8084'
$env:MANAGER_SERVICE_URL='http://localhost:8091'
$env:IMAGE_SERVICE_URL='http://localhost:8083'
$env:GATEWAY_CORS_ORIGINS='http://localhost:4200,http://127.0.0.1:4200,http://localhost:3000,http://127.0.0.1:3000'

.\mvnw.cmd quarkus:dev
```

## Smoke Checks

- `GET /q/health`
- `POST /auth/login`
- `GET /users/me` with `Authorization: Bearer <accessToken>`
- `GET /image/getAll`
- `GET /notification/getAll`
- `GET /profiles` with `Authorization: Bearer <accessToken>`
- `GET /manager/user/job/getall` with `Authorization: Bearer <accessToken>`

No discovery server is required.
