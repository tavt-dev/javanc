# Target Quarkus Architecture

## Target Platform

Use Quarkus 3.33 LTS, Java 21, and Maven.

Official basis:

- Quarkus announced 3.33 LTS on 2026-03-25.
- Quarkus states LTS releases are supported for 12 months.
- Source: https://quarkus.io/blog/quarkus-3-33-released/

Do not chase the newest non-LTS Quarkus release for this migration unless the user explicitly changes the platform decision.

## Target Repository Shape

Target layout when implementation begins:

```text
quarkus/
  pom.xml
  gateway-service/
  user-service/
  image-service/
  profile-service/
  project-service/
  notification-service/
  email-service/
  manager-service/
```

This is a target design. Do not create this scaffold during docs-only, analysis-only, or plan-only work.

## Module Responsibilities

| Module | Replaces | Responsibility |
|---|---|---|
| `gateway-service` | `microservice/api-gateway` | Gateway routing, CORS, token enforcement |
| `user-service` | `microservice/user-service` | Auth, users, roles, JWT compatibility |
| `image-service` | `microservice/image-service` | Multipart upload, image metadata, Cloudinary |
| `profile-service` | `microservice/profile-service` | Profile MongoDB data and user/image clients |
| `project-service` | `microservice/project-service` | Project MySQL data and user/profile/image clients |
| `notification-service` | `microservice/notification-service` | Notification MySQL data and messaging |
| `email-service` | `microservice/email-service` | Mail sending and messaging |
| `manager-service` | `microservice/manager-service` | Company/job MongoDB data and dependent clients |

Do not create `discovery-server` in Quarkus. Replace Eureka with service URL configuration and Docker Compose service names.

## Package Convention

Use `com.javanc` package names for all new Quarkus code. Do not carry over the current Spring package prefix.

```text
com.javanc.gateway
com.javanc.user
com.javanc.image
com.javanc.profile
com.javanc.project
com.javanc.notification
com.javanc.email
com.javanc.manager
```

Recommended package groups per service:

```text
resource/     Jakarta REST endpoints
service/      business services
repository/   Panache or explicit repositories
entity/       SQL entities
model/        MongoDB documents or embedded models
dto/          request/response DTOs
client/       REST clients
security/     auth and identity helpers
exception/    exceptions and ExceptionMapper classes
config/       config mappings and producers
```

## Extension Matrix

| Module | Quarkus extensions to start with |
|---|---|
| `gateway-service` | `quarkus-rest-jackson`, `quarkus-rest-client-jackson`, `quarkus-security`, `quarkus-smallrye-jwt`, `quarkus-smallrye-health`, `quarkus-smallrye-openapi` |
| `user-service` | `quarkus-rest-jackson`, `quarkus-hibernate-validator`, `quarkus-hibernate-orm-panache`, `quarkus-jdbc-mysql`, `quarkus-security`, `quarkus-smallrye-jwt`, `quarkus-smallrye-health`, `quarkus-smallrye-openapi` |
| `image-service` | `quarkus-rest-jackson`, `quarkus-hibernate-validator`, `quarkus-hibernate-orm-panache`, `quarkus-jdbc-mysql`, `quarkus-smallrye-health`, `quarkus-smallrye-openapi` |
| `profile-service` | `quarkus-rest-jackson`, `quarkus-rest-client-jackson`, `quarkus-hibernate-validator`, `quarkus-mongodb-panache`, `quarkus-smallrye-health`, `quarkus-smallrye-openapi` |
| `project-service` | `quarkus-rest-jackson`, `quarkus-rest-client-jackson`, `quarkus-hibernate-validator`, `quarkus-hibernate-orm-panache`, `quarkus-jdbc-mysql`, `quarkus-smallrye-health`, `quarkus-smallrye-openapi` |
| `notification-service` | `quarkus-rest-jackson`, `quarkus-rest-client-jackson`, `quarkus-hibernate-validator`, `quarkus-hibernate-orm-panache`, `quarkus-jdbc-mysql`, `quarkus-messaging-kafka`, `quarkus-smallrye-health`, `quarkus-smallrye-openapi` |
| `email-service` | `quarkus-rest-jackson`, `quarkus-rest-client-jackson`, `quarkus-hibernate-validator`, `quarkus-mailer`, `quarkus-messaging-kafka`, `quarkus-smallrye-health`, `quarkus-smallrye-openapi` |
| `manager-service` | `quarkus-rest-jackson`, `quarkus-rest-client-jackson`, `quarkus-hibernate-validator`, `quarkus-mongodb-panache`, `quarkus-smallrye-health`, `quarkus-smallrye-openapi` |

Add `quarkus-container-image-docker` when container images are introduced.

## Configuration Strategy

Use environment-backed properties for secrets, ports, service URLs, and external systems.

Examples:

```properties
quarkus.http.port=${USER_SERVICE_PORT:8088}
quarkus.datasource.username=${MYSQL_USERNAME:root}
quarkus.datasource.password=${MYSQL_PASSWORD:}
quarkus.datasource.jdbc.url=${USER_MYSQL_JDBC_URL:jdbc:mysql://localhost:3306/portfolio}
quarkus.mongodb.connection-string=${MONGODB_CONNECTION_STRING:mongodb://localhost:27017}
quarkus.mongodb.database=${MONGODB_DATABASE:microservice-portfolio}
services.user.url=${USER_SERVICE_URL:http://localhost:8088}
jwt.secret=${JWT_SECRET:}
cloudinary.url=${CLOUDINARY_URL:}
quarkus.mailer.username=${MAIL_USERNAME:}
quarkus.mailer.password=${MAIL_PASSWORD:}
kafka.bootstrap.servers=${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}
```

Do not commit real secrets. Do not copy current hardcoded secrets into Quarkus source.

## Local Development Strategy

Initial local development can run one migrated Quarkus service at a time against existing Spring services. After multiple Quarkus services exist, add Docker Compose for MySQL, MongoDB, Kafka, and services.

Use stable default ports matching the current Spring ports to minimize Angular and gateway changes.
