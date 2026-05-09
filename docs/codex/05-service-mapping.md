# Service Mapping

## Current To Target Map

| Spring source | Quarkus target | Port | Persistence | Dependency level |
|---|---|---:|---|---|
| `microservice/user-service` | `quarkus/user-service` | 8088 | MySQL `portfolio` | Foundation |
| `microservice/image-service` | `quarkus/image-service` | 8083 | MySQL `image` | Low |
| `microservice/profile-service` | `quarkus/profile-service` | 8085 | MongoDB `microservice-portfolio` | Medium |
| `microservice/notification-service` | `quarkus/notification-service` | 8084 | MySQL `notification1` | Medium |
| `microservice/project-service` | `quarkus/project-service` | 8086 | MySQL `project1` | Medium |
| `microservice/email-service` | `quarkus/email-service` | 8087 | none detected | Medium |
| `microservice/manager-service` | `quarkus/manager-service` | 8091 | MongoDB `microservice-portfolio` | High |
| `microservice/api-gateway` | `quarkus/gateway-service` | 8080 | none | High |
| `microservice/discovery-server` | none | 8671 | none | Remove |

## Recommended Migration Order

1. `user-service`
2. `image-service`
3. `profile-service`
4. `notification-service`
5. `project-service`
6. `email-service`
7. `manager-service`
8. `gateway-service`

Reasoning:

- `user-service` owns auth and token validation used by the gateway and downstream services.
- `image-service` is relatively focused and is required by profile/project/manager flows.
- `profile-service` can migrate after user/image contracts are available.
- `notification-service` should migrate before manager flows that create notifications.
- `project-service` depends on user/profile/image.
- `email-service` should migrate before manager flows that send mail.
- `manager-service` has the widest downstream dependency surface.
- `gateway-service` should migrate after service routes and compatibility rules are stable.

## Dependency Graph

```text
gateway-service -> user-service
profile-service -> user-service, image-service
project-service -> user-service, profile-service, image-service
notification-service -> user-service
email-service -> user-service
manager-service -> user-service, profile-service, image-service, email-service, notification-service
```

## Gateway Target Behavior

Keep a Quarkus gateway service for now.

Compatibility target:

- `/auth/**` remains public.
- `/profile/**`, `/project/**`, and `/manager/**` remain protected as currently configured.
- `/notification/**` and `/image/**` preserve current gateway filter behavior first.
- `/profile-hr/**` is documented as unresolved because no matching service exists.
- Token validation may initially call `user-service` `/auth/isValid`, then move to direct JWT verification after auth migration is stable.

## Service URL Defaults

```properties
services.gateway.url=http://localhost:8080
services.user.url=http://localhost:8088
services.image.url=http://localhost:8083
services.profile.url=http://localhost:8085
services.project.url=http://localhost:8086
services.notification.url=http://localhost:8084
services.email.url=http://localhost:8087
services.manager.url=http://localhost:8091
```

Docker Compose can replace localhost URLs with service names:

```properties
services.user.url=http://user-service:8088
services.image.url=http://image-service:8083
services.profile.url=http://profile-service:8085
```

## Known Mapping Issues To Verify

- Gateway route `/profile-hr/**` points to `PROFILE-HR-SERVICE`, but no matching local service exists.
- `manager-service` `UserClient.findById` maps `/findbyid` instead of `/auth/findbyid`.
- `profile-service` `UserClient.checkId` maps `/checkId` instead of `/auth/checkId`.
- `project-service` contains `openFeign/test.java` calling notification `/notification/getAll`.
- Preserve current behavior first; cleanup requires a separate change.
