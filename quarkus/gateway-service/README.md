# Gateway Service

Quarkus replacement for `microservice/api-gateway`.

The gateway uses static service URLs instead of Eureka. `user-service` remains the owner of token introspection through `POST /auth/introspect`.

## Routes

| Path | Target env var | Auth |
|---|---|---|
| `/auth/**` | `USER_SERVICE_URL` | public |
| `/users/**` | `USER_SERVICE_URL` | bearer token required |
| `/profile/**` | `PROFILE_SERVICE_URL` | bearer token required |
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
- `GET /profile/user/getAll` with `Authorization: Bearer <accessToken>`
- `GET /manager/user/job/getall` with `Authorization: Bearer <accessToken>`

No discovery server is required.
