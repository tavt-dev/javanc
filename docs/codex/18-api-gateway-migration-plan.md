# API Gateway Quarkus Migration Plan

## Purpose

This file is a practical plan for migrating the current Spring Boot `api-gateway` to `quarkus/gateway-service`.

It is documentation only. It does not create implementation code.

The target gateway should be optimized for local and personal deployment. It should avoid Kubernetes, service mesh, dynamic discovery, and other cloud-native complexity that does not solve a current project problem.

## Current Service Facts

| Item | Current value | Target value |
|---|---|---|
| Source service | `microservice/api-gateway` | `quarkus/gateway-service` |
| Current package | `com.baconbao.api_gateway` | `com.javanc.gateway` |
| Current framework | Spring Boot 3.3.2 + Spring Cloud Gateway | Quarkus 3.33.x |
| Java version | 21 | 21 |
| Port | 8080 | 8080 |
| Persistence | none | none |
| Service discovery | Eureka client and `lb://` route URIs | static config-backed service URLs |
| Auth owner | Gateway calls `user-service` `/auth/isValid` | preserve remote validation first |
| Frontend origin | `http://localhost:4200` | preserve as default CORS origin |

Current Spring dependencies and patterns to replace:

- `spring-cloud-starter-gateway` for route matching and forwarding.
- `spring-boot-starter-webflux` and Reactor `Mono`.
- `spring-cloud-starter-netflix-eureka-client` and `lb://SERVICE-NAME` route URIs.
- `spring-cloud-starter-openfeign`, although the active auth path uses `WebClient`, not the Feign client.
- `AbstractGatewayFilterFactory` for `AuthenticationFilter`.
- Spring `CorsWebFilter` for CORS.
- Lombok DTO/builders.

## Current Architecture

The current gateway is a thin Spring Cloud Gateway application.

Most routing behavior lives in `microservice/api-gateway/src/main/resources/application.yml`. The Java code mainly provides:

- `AuthenticationFilter` as a named per-route Spring Cloud Gateway filter.
- `UserService` as the remote token validation caller.
- `CorsConfig` for Angular local development.
- `WebClientConfig` for Spring WebClient.
- `UserClient`, a Feign client that appears present for parity but is not used by the active `UserService.isValid` flow.

The gateway has no database and no domain persistence. It is a request router plus a coarse auth enforcement point.

## Current Route Table

Spring Cloud Gateway currently defines these routes:

| Path predicate | Route id | Current target URI | Auth filter |
|---|---|---|---|
| `/profile/**` | `profile-service` | `lb://PROFILE-SERVICE` | yes |
| `/project/**` | `project-service` | `lb://PROJECT-SERVICE` | yes |
| `/auth/**` | `user-service` | `lb://USER-SERVICE` | no |
| `/profile-hr/**` | `profile-hr-service` | `lb://PROFILE-HR-SERVICE` | no |
| `/notification/**` | `notification-service` | `lb://NOTIFICATION-SERVICE` | no |
| `/manager/**` | `manager-service` | `lb://MANAGER-SERVICE` | yes |
| `/image/**` | `image-service` | `lb://IMAGE-SERVICE` | no |

Important compatibility notes:

- There is no `StripPrefix` filter, so the full original path is forwarded. For example, `/manager/user/job/getall` reaches manager-service with the `/manager` prefix intact.
- `/email/**` is not configured in the current Spring gateway, even though `email-service` exists and manager-service calls it directly. Do not expose `/email/**` in the baseline gateway unless a separate compatibility decision approves it.
- `/profile-hr/**` is configured, but the docs do not identify a matching active service in the current Quarkus migration set. Treat it as a legacy or disabled route until a service URL is explicitly configured.

## Current Auth And Security Flow

The current gateway auth behavior is route-level, not global.

Protected route families:

- `/profile/**`
- `/project/**`
- `/manager/**`

Public route families:

- `/auth/**`
- `/profile-hr/**`
- `/notification/**`
- `/image/**`

Current filter behavior:

- If the path starts with `/auth`, the filter skips auth, although the `/auth/**` route does not attach the filter anyway.
- It reads the `Authorization` header.
- If the header is missing, it returns HTTP `401` with no JSON body.
- If the header exists, it takes `authHeader[0].substring(7)` as the token. This assumes `Bearer ` exists and can fail on malformed headers.
- It calls `POST http://localhost:8088/auth/isValid` with the raw token string as the request body.
- It expects `ApiResponse<AuthenticationResponse>`.
- If `response.data.isVaild` is true, the request continues.
- Otherwise it returns HTTP `401` with a JSON `AuthenticationResponse` body containing `statusCode=1041` and `error="Unauthenticated"`.
- Any exception during validation also returns the same JSON unauthenticated response.
- Role-based checks exist only as commented-out code. There is no active role enforcement.

Compatibility notes:

- Preserve the misspelled response field `isVaild` because user-service and existing DTOs use that name.
- Preserve remote token validation through user-service first. Do not move to direct JWT validation in the baseline gateway.
- Preserve HTTP `401` for missing, invalid, malformed, and validation-error tokens.
- A safer Quarkus implementation may check for the `Bearer ` prefix before extracting the token, as long as the external result remains HTTP `401`.
- Avoid logging token values or full auth responses in the Quarkus gateway.

## Current CORS Behavior

`CorsConfig` allows:

- Origin: `http://localhost:4200`
- Methods: all
- Headers: all
- Credentials: true
- Path scope: `/**`

The Quarkus gateway should keep this default for local Angular development and make the allowed origins environment-backed.

## Current Config And Local Deployment Flow

Current local Spring flow depends on Eureka:

1. Start `microservice/discovery-server` on port `8671`.
2. Start service applications so they register with Eureka:
   - `user-service` on `8088`
   - `image-service` on `8083`
   - `notification-service` on `8084`
   - `profile-service` on `8085`
   - `project-service` on `8086`
   - `email-service` on `8087`
   - `manager-service` on `8091`
3. Start `api-gateway` on `8080`.
4. Angular calls the gateway at `http://localhost:8080`.

There is no current Docker Compose file in the repository. The Quarkus modules already use environment-backed service URLs, which is a better fit for local deployment than recreating Eureka.

One important current inconsistency:

- Route forwarding uses Eureka `lb://USER-SERVICE`.
- Auth validation bypasses Eureka and calls `http://localhost:8088/auth/isValid` directly.

This makes static Quarkus service URLs a natural migration target.

## Target Architecture

Use a simple Quarkus gateway with static route configuration.

Recommended runtime model:

- One Quarkus process on port `8080`.
- No database.
- No Eureka.
- No Consul.
- No Kubernetes service discovery.
- No service mesh.
- No centralized config server.
- No gateway-side session storage.

Recommended Quarkus extensions:

- `quarkus-rest-jackson`
- `quarkus-rest-client-jackson`
- `quarkus-vertx` or Vert.x WebClient support for generic request forwarding
- `quarkus-hibernate-validator`
- `quarkus-smallrye-health`
- `quarkus-smallrye-openapi`

Do not add `quarkus-smallrye-jwt` to the baseline unless the migration explicitly changes from remote user-service validation to local JWT verification. Direct JWT verification can be a later optimization after user-service token format and secrets are stable.

## DDD-Light Package Structure

The gateway has no rich business domain, so use a small clean architecture shape instead of heavy DDD.

Recommended package layout:

```text
com.javanc.gateway
  domain/
    model/          GatewayRoute, RoutePolicy, AuthDecision
  application/
    service/        RouteMatcher, GatewayAuthService
    port/           TokenValidationPort, RequestForwardingPort
  infrastructure/
    client/         UserTokenValidationClient, VertxProxyClient
    config/         GatewayRouteConfig, CorsConfig
  interfaces/
    http/           GatewayHandler, GatewayExceptionMapper
```

Boundary rules:

- Route matching is application logic.
- Auth policy is route metadata, not hardcoded inside a random HTTP handler.
- User-service validation is infrastructure behind `TokenValidationPort`.
- Request forwarding is infrastructure behind `RequestForwardingPort`.
- Keep the model small. Do not create aggregates, repositories, or domain events for a gateway that only routes requests.

## Local Service Discovery Strategy

Replace Eureka with a static route table backed by environment variables.

Default localhost routing:

| Route family | Default URL | Baseline enabled |
|---|---|---|
| `/auth/**` | `http://localhost:8088` | yes |
| `/profile/**` | `http://localhost:8085` | yes |
| `/project/**` | `http://localhost:8086` | yes |
| `/notification/**` | `http://localhost:8084` | yes |
| `/manager/**` | `http://localhost:8091` | yes |
| `/image/**` | `http://localhost:8083` | yes |
| `/profile-hr/**` | no default recommendation | disabled unless configured |
| `/email/**` | `http://localhost:8087` | no, optional after baseline |

Recommended environment variables:

| Variable | Default |
|---|---|
| `GATEWAY_SERVICE_PORT` | `8080` |
| `USER_SERVICE_URL` | `http://localhost:8088` |
| `PROFILE_SERVICE_URL` | `http://localhost:8085` |
| `PROJECT_SERVICE_URL` | `http://localhost:8086` |
| `NOTIFICATION_SERVICE_URL` | `http://localhost:8084` |
| `MANAGER_SERVICE_URL` | `http://localhost:8091` |
| `IMAGE_SERVICE_URL` | `http://localhost:8083` |
| `EMAIL_SERVICE_URL` | `http://localhost:8087` |
| `PROFILE_HR_SERVICE_URL` | empty |
| `GATEWAY_CORS_ORIGINS` | `http://localhost:4200` |
| `GATEWAY_AUTH_PROTECTED_PREFIXES` | `/profile,/project,/manager` |
| `GATEWAY_REQUEST_TIMEOUT_MILLIS` | `10000` |
| `GATEWAY_AUTH_TIMEOUT_MILLIS` | `5000` |

Routing rules:

- Match by path prefix.
- Prefer the longest matching prefix if future route families overlap.
- Preserve the full incoming path and query string.
- Preserve HTTP method, request body, content type, and authorization header.
- Copy normal response status, headers, and body back to the caller.
- Avoid copying hop-by-hop headers such as `Connection`, `Transfer-Encoding`, `Keep-Alive`, and `Upgrade`.
- Return a clear `502` or `503` if a configured downstream service is unavailable.

## Auth Strategy In Quarkus

Baseline recommendation:

- Keep the gateway as the auth enforcement point for the same protected prefixes.
- Keep `/auth/**`, `/notification/**`, and `/image/**` public to preserve Spring behavior.
- Call user-service `POST /auth/isValid` with the raw token string body.
- Use `USER_SERVICE_URL` instead of hardcoded `localhost`.
- Treat any validation failure, missing body, timeout, or malformed response as unauthorized.
- Keep role enforcement out of baseline because Spring does not enforce roles.

Suggested auth components:

- `GatewayAuthService`: extracts bearer token and asks the validation port.
- `TokenValidationPort`: application port returning an auth decision.
- `UserTokenValidationClient`: REST client to user-service.
- `RoutePolicy`: marks a route as public or protected.

Intentional safety improvements that should be documented during implementation:

- Validate that `Authorization` starts with `Bearer ` before substring extraction.
- Put a short timeout on the auth validation call.
- Do not log tokens or full auth DTOs.
- Return consistent `401` responses if the frontend tolerates a body for missing-token cases.

## Config Management

Use Quarkus `application.properties` plus environment variables.

Keep configuration local and explicit:

- Port in `GATEWAY_SERVICE_PORT`.
- CORS origins in `GATEWAY_CORS_ORIGINS`.
- Service URLs in `*_SERVICE_URL`.
- Protected prefixes in `GATEWAY_AUTH_PROTECTED_PREFIXES`.
- Timeouts in gateway-specific variables.

Avoid:

- Spring Cloud Config replacement.
- Kubernetes ConfigMaps and Secrets as a baseline requirement.
- Runtime service registration.
- Dynamic route refresh.
- External API gateway products.

For personal deployment, a checked-in `.env.example` is useful, but real `.env` files and secrets must stay uncommitted.

## Docker Compose Considerations

Docker Compose can help local/personal deployment, but it should stay simple.

Recommended Compose approach:

- Do not include a discovery-server container.
- Put each service on the same Compose network.
- Set gateway service URLs to Compose service names:
  - `USER_SERVICE_URL=http://user-service:8088`
  - `PROFILE_SERVICE_URL=http://profile-service:8085`
  - `PROJECT_SERVICE_URL=http://project-service:8086`
  - `NOTIFICATION_SERVICE_URL=http://notification-service:8084`
  - `MANAGER_SERVICE_URL=http://manager-service:8091`
  - `IMAGE_SERVICE_URL=http://image-service:8083`
  - `EMAIL_SERVICE_URL=http://email-service:8087`
- Expose only gateway port `8080` for normal browser usage.
- Expose database ports only when local database tools need direct access.
- Use health checks for databases and services where practical.
- Use `depends_on` for startup order, but still make the gateway tolerate downstream startup delays.
- Consider Compose profiles, for example `infra`, `core`, and `all`, so a developer can run only what they need.

Keep Compose resource usage low:

- Run JVM mode first. Native images are optional optimization, not a baseline requirement.
- Avoid running both Spring and Quarkus versions of the same service unless testing migration compatibility.
- Do not run Eureka.
- Do not add Kafka unless a service flow actually requires it.

## Migration Phases

### Phase 0: Contract Freeze

Goal: document current behavior before code changes.

Tasks:

- Freeze the route table from `application.yml`.
- Freeze protected and public route families.
- Freeze auth validation path: `POST /auth/isValid`.
- Freeze token request body shape: raw string token.
- Freeze expected validation response field: `data.isVaild`.
- Freeze CORS behavior for Angular local development.
- Confirm whether `/profile-hr/**` should remain disabled, removed, or configured.
- Confirm whether `/email/**` should remain absent during baseline.

Acceptance:

- No route, auth, or CORS ambiguity remains before implementation.
- Any intentional deviation from Spring behavior is called out in the implementation notes.

### Phase 1: Quarkus Module Scaffold

Goal: create the minimum `gateway-service` module later, when implementation is requested.

Target files:

- `quarkus/gateway-service/pom.xml`
- `quarkus/gateway-service/src/main/resources/application.properties`
- `quarkus/gateway-service/src/main/java/com/javanc/gateway`
- `quarkus/gateway-service/src/test/java/com/javanc/gateway`
- Add `gateway-service` to `quarkus/pom.xml`.

Acceptance:

- Module compiles.
- It has no Eureka dependency.
- It has no persistence dependencies.
- It starts on port `8080`.
- Health endpoint is available at `/q/health`.

### Phase 2: Route Configuration

Goal: replace Spring Cloud Gateway YAML routes with Quarkus-friendly route configuration.

Tasks:

- Define route entries for `/auth`, `/profile`, `/project`, `/notification`, `/manager`, and `/image`.
- Mark `/profile`, `/project`, and `/manager` as protected.
- Mark `/auth`, `/notification`, and `/image` as public.
- Keep `/profile-hr` disabled unless configured.
- Keep `/email` out of baseline routing unless approved.
- Read all downstream URLs from environment-backed config.

Acceptance:

- Route matching tests cover every current route family.
- Tests verify full path and query are preserved.
- Disabled routes have deterministic behavior.

### Phase 3: Proxy Forwarding

Goal: implement the gateway's core forwarding behavior.

Tasks:

- Forward method, path, query string, request body, and relevant headers.
- Preserve downstream response status and body.
- Preserve JSON and multipart request handling.
- Preserve large body limits needed by image and manager multipart flows.
- Add request and response timeout settings.
- Map downstream connection failures to `502` or `503`.

Acceptance:

- Stub-service tests prove `GET`, `POST`, `PUT`, and multipart requests are forwarded correctly.
- Tests prove query parameters such as `id`, `jobDTO`, `idProfile`, and `managerId` survive forwarding.
- Tests prove `/manager/admin/company/create` can pass multipart data through the gateway.

### Phase 4: Auth Filter Migration

Goal: port route-level authentication.

Tasks:

- Apply auth only to protected route policies.
- Extract bearer token safely.
- Call user-service validation through `USER_SERVICE_URL`.
- Preserve `401` behavior for missing and invalid tokens.
- Preserve `isVaild` response field compatibility.
- Do not enforce roles during baseline.

Acceptance:

- `/profile/**`, `/project/**`, and `/manager/**` reject missing or invalid tokens.
- Protected routes forward when user-service returns `data.isVaild=true`.
- `/auth/**`, `/notification/**`, and `/image/**` forward without token validation.
- User-service validation timeout returns `401`, not an unhandled error.

### Phase 5: CORS And Local Browser Compatibility

Goal: preserve Angular local development behavior.

Tasks:

- Allow `http://localhost:4200` by default.
- Allow all methods and headers by default.
- Allow credentials.
- Make allowed origins configurable for personal deployments.
- Verify preflight requests do not call downstream services unnecessarily.

Acceptance:

- Browser preflight from Angular local dev succeeds.
- Protected route preflight does not require a bearer token.
- Actual protected route calls still require auth.

### Phase 6: Local Run Readiness

Goal: make the gateway easy to run locally without cloud infrastructure.

Required files when implementing:

- `quarkus/gateway-service/README.md`
- `quarkus/gateway-service/.env.example`

Minimum `.env.example` values:

- `GATEWAY_SERVICE_PORT=8080`
- `USER_SERVICE_URL=http://localhost:8088`
- `PROFILE_SERVICE_URL=http://localhost:8085`
- `PROJECT_SERVICE_URL=http://localhost:8086`
- `NOTIFICATION_SERVICE_URL=http://localhost:8084`
- `MANAGER_SERVICE_URL=http://localhost:8091`
- `IMAGE_SERVICE_URL=http://localhost:8083`
- `EMAIL_SERVICE_URL=http://localhost:8087`
- `PROFILE_HR_SERVICE_URL=`
- `GATEWAY_CORS_ORIGINS=http://localhost:4200`
- `GATEWAY_AUTH_PROTECTED_PREFIXES=/profile,/project,/manager`

Acceptance:

- A developer can run the gateway with Quarkus dev mode.
- The gateway can route to either Spring or Quarkus versions of downstream services by changing environment variables.
- No discovery-server is needed.
- No real secret is committed.

### Phase 7: Docker Compose Integration

Goal: add optional personal deployment support after the Quarkus gateway works locally.

Tasks:

- Add or update a root-level Compose file only when the service set is stable.
- Use service-name URLs inside the Compose network.
- Start MySQL and MongoDB only if the selected services need them.
- Keep gateway as the only normal public backend entrypoint.
- Add health checks gradually.

Acceptance:

- `gateway-service` can reach all enabled services by Compose service names.
- Angular can call only `http://localhost:8080`.
- Eureka is not part of the Compose stack.

### Phase 8: Test Plan

Minimum tests:

- Route matching for all current Spring route families.
- Public route forwarding without auth.
- Protected route missing token returns `401`.
- Protected route invalid token returns `401`.
- Protected route valid token forwards request.
- User-service validation path is `POST /auth/isValid` with raw token body.
- CORS preflight succeeds for `http://localhost:4200`.
- Query strings are preserved.
- Multipart request forwarding works for image/company flows.
- Downstream unavailable maps to `502` or `503`.
- `/email/**` is not routed in baseline unless explicitly enabled.

Manual smoke tests:

- `GET /q/health`
- `POST /auth/signin` through gateway.
- `GET /profile/user/getAll` through gateway with token.
- `GET /image/getAll` through gateway without token.
- `GET /notification/getAll` through gateway without token.
- `GET /manager/user/job/getall` through gateway with token.

## Hardening After Baseline

Only consider these after the baseline gateway is verified:

- Direct JWT verification in the gateway using `quarkus-smallrye-jwt`.
- Role-based route policies for admin, manager, HR, and user paths.
- Rate limiting for auth and upload endpoints.
- Request correlation ids.
- Structured access logs without tokens or secrets.
- Optional `/email/**` exposure if the frontend or local tooling needs it.
- Removal or replacement of `/profile-hr/**` if no service owns it.
- Better unauthorized response consistency.
- Gateway-level OpenAPI aggregation only if it stays simple.

## Avoided Complexity

Do not introduce these during the baseline migration:

- Kubernetes ingress.
- Service mesh.
- Eureka replacement through Consul or ZooKeeper.
- Spring Cloud Config equivalent.
- Dynamic route registry.
- Distributed tracing stack.
- Centralized identity provider.
- Gateway database.
- Message queues for request routing.

These tools can be useful in larger deployments, but they add operational cost without helping this local-first migration.

## Implementation Stop Conditions

Stop and ask before implementation continues if:

- `/email/**` must be exposed through the gateway during baseline.
- `/profile-hr/**` has an active service and a required local port.
- Role enforcement must be added during migration instead of after baseline.
- The gateway must validate JWTs locally instead of calling user-service.
- Frontend code depends on the exact empty-body `401` for missing tokens.
- Multipart upload through the gateway cannot be made reliable with the selected Quarkus forwarding approach.
- Docker Compose is required before single-service local dev works.

## Final Deliverables For Actual Migration

When implementation is requested later, the final response should include:

- Files created.
- Files modified.
- Routes implemented.
- Public and protected route families.
- Auth validation behavior.
- Local environment variables.
- Docker Compose changes, if any.
- How to run `gateway-service`.
- How to smoke test route forwarding and auth.
- Any intentional differences from the Spring gateway.
