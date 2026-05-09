# Current Spring Architecture

## Architecture Style

The backend is a Spring Boot microservice system with an Angular client. The services are independently built Maven projects under `microservice/`. Routing is centralized through `api-gateway`, and service discovery currently uses Eureka.

Detected Spring stack:

- Spring MVC controllers for service APIs.
- Spring Cloud Gateway/WebFlux in `api-gateway`.
- Eureka server and Eureka clients.
- OpenFeign clients for service-to-service HTTP calls.
- Spring Security and JJWT in `user-service`.
- Spring Data JPA with MySQL in `user-service`, `image-service`, `project-service`, and `notification-service`.
- Spring Data MongoDB in `profile-service` and `manager-service`.
- Spring Kafka in email/notification related services.
- Spring Mail in `email-service`.
- Cloudinary SDK in `image-service`.
- Lombok and ModelMapper in several services.

## Runtime Ports

| Service | Port | Config source |
|---|---:|---|
| `api-gateway` | 8080 | `microservice/api-gateway/src/main/resources/application.yml` |
| `discovery-server` | 8671 | `microservice/discovery-server/src/main/resources/application.yml` |
| `user-service` | 8088 | `microservice/user-service/src/main/resources/application.yml` |
| `image-service` | 8083 | `microservice/image-service/src/main/resources/application.yml` |
| `profile-service` | 8085 | `microservice/profile-service/src/main/resources/application.yml` |
| `project-service` | 8086 | `microservice/project-service/src/main/resources/application.yml` |
| `notification-service` | 8084 | `microservice/notification-service/src/main/resources/application.yml` |
| `email-service` | 8087 | `microservice/email-service/src/main/resources/application.yml` |
| `manager-service` | 8091 | `microservice/manager-service/src/main/resources/application.yml` |

## Service Inventory

| Service | Main files to inspect before migration | Notes |
|---|---|---|
| `api-gateway` | `config/AuthenticationFilter.java`, `config/CorsConfig.java`, `UserClient.java`, `UserService.java`, `application.yml` | Routes requests and validates tokens through `user-service` |
| `discovery-server` | `DiscoveryServerApplication.java`, `application.yml` | Eureka-only service; do not recreate in Quarkus |
| `user-service` | `UserController.java`, `AuthService.java`, `JwtTokenUtil.java`, `SecurityConfig.java`, `JwtAuthenticationFilter.java`, `UserRepository.java` | Owns auth, users, roles, JWT |
| `image-service` | `ImageController.java`, `CloudinaryService.java`, `ImageServiceImpl.java`, `ImageRepository.java`, `Image.java` | Multipart upload and Cloudinary integration |
| `profile-service` | `ProfileController.java`, `ProfileServiceImp.java`, `ProfileRepository.java`, `Profile.java`, Feign clients | MongoDB profile documents and image/user calls |
| `project-service` | `ProjectController.java`, `ProjectServiceImpl.java`, `ProjectRepository.java`, `Project.java`, Feign clients | MySQL project data and downstream image/profile/user calls |
| `notification-service` | `NotificationController.java`, `NotificationServiceImpl.java`, `NotificationRepository.java`, `Notification.java`, Kafka config | MySQL notification data |
| `email-service` | `MailController.java`, `MailServiceImpl.java`, `MailService.java`, mail config, Kafka config | Sends email and calls user service |
| `manager-service` | `CompanyController.java`, `JobController.java`, service impls, Mongo repositories, Feign clients | Highest dependency surface |

## Gateway Routes

Current `api-gateway` routes:

| Path predicate | Target service | Current auth filter |
|---|---|---|
| `/profile/**` | `PROFILE-SERVICE` | `AuthenticationFilter` |
| `/project/**` | `PROJECT-SERVICE` | `AuthenticationFilter` |
| `/auth/**` | `USER-SERVICE` | public |
| `/profile-hr/**` | `PROFILE-HR-SERVICE` | no matching local service found |
| `/notification/**` | `NOTIFICATION-SERVICE` | no filter in current config |
| `/manager/**` | `MANAGER-SERVICE` | `AuthenticationFilter` |
| `/image/**` | `IMAGE-SERVICE` | no filter in current config |

Preserve this behavior first. Security tightening is a separate phase.

## Persistence Summary

| Service | Spring persistence | Database | Table/collection | Id type |
|---|---|---|---|---|
| `user-service` | JPA/MySQL | `portfolio` | `user` | `Integer` |
| `image-service` | JPA/MySQL | `image` | `image` | `Integer` |
| `project-service` | JPA/MySQL | `project1` | `project` | `Integer` |
| `notification-service` | JPA/MySQL | `notification1` | `notifications` | `Integer` |
| `profile-service` | MongoDB | `microservice-portfolio` | `profile` | `Integer` |
| `manager-service` | MongoDB | `microservice-portfolio` | `company`, `job` | `Integer` |

## Inter-Service Calls

Known current OpenFeign dependencies:

- `api-gateway` calls `user-service` `/auth/isValid`.
- `profile-service` calls `user-service` and `image-service`.
- `project-service` calls `user-service`, `profile-service`, `image-service`, and a test notification client.
- `notification-service` calls `user-service`.
- `email-service` calls `user-service`.
- `manager-service` calls `user-service`, `profile-service`, `image-service`, `email-service`, and `notification-service`.

## Current Risks To Track

- Secrets exist in current Spring code/config. Do not copy them to docs or Quarkus code.
- Some Feign paths appear inconsistent and must be verified before porting, for example manager user lookup path without `/auth`.
- `GET /auth/ourUserDetailsService` uses `@PathVariable String username` without a path variable in the mapping.
- `GET /manager/user/job/findbyid` method has an unannotated `Integer id` parameter.
- `GET /project/user/get` uses `@RequestPart MultipartFile` on a GET endpoint.
- `profile-service` `checkIdProfile` currently returns `"true"` without checking the id.
- Gateway route `/profile-hr/**` points to a missing local service.
