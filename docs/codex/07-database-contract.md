# Database Contract

## Goal

Preserve the current persistence model during framework migration. Do not redesign schemas, ids, table names, collection names, database names, or enum representation during the initial Quarkus migration.

## Current Databases

| Service | Technology | Database | Table/collection | Id type |
|---|---|---|---|---|
| `user-service` | Spring Data JPA + MySQL | `portfolio` | `user` | `Integer` |
| `image-service` | Spring Data JPA + MySQL | `image` | `image` | `Integer` |
| `project-service` | Spring Data JPA + MySQL | `project1` | `project` | `Integer` |
| `notification-service` | Spring Data JPA + MySQL | `notification1` | `notifications` | `Integer` |
| `profile-service` | Spring Data MongoDB | `microservice-portfolio` | `profile` | `Integer` |
| `manager-service` | Spring Data MongoDB | `microservice-portfolio` | `company`, `job` | `Integer` |
| `email-service` | no persistence detected | none | none | none |
| `api-gateway` | no persistence detected | none | none | none |

## Entity And Document Fields To Preserve

| Model | Fields observed |
|---|---|
| `User` | `id`, `name`, `email`, `idEmployee`, `password`, `isActive`, `role` |
| `Image` | `id`, `url` |
| `Profile` | `id`, `objective`, `education`, `workExperience`, `skills`, `contact`, `typeProfile`, `idImage`, `title`, `idUser`, `url` |
| `Project` | `id`, `title`, `description`, `createAt`, `idImage`, `isDisplay`, `url`, `idProfile` |
| `Notification` | `id`, `message`, `createAt`, `idUser`, `url`, `isRead` |
| `Company` | `id`, `name`, `type`, `description`, `street`, `email`, `phone`, `city`, `country`, `url`, `idManager`, `idHr`, `idJobs` |
| `Job` | `id`, `title`, `description`, `typeJob`, `size`, `idProfiePending`, `idProfile`, `idCompany` |
| `Contact` | `id`, `address`, `phone`, `email` |

Preserve misspelled field names such as `idProfiePending` during compatibility migration unless a separate cleanup is approved.

## DTO Field Compatibility

Preserve JSON fields used by DTOs:

- `ApiResponse`: `success`, `message`, `data`.
- `AuthenticationRequest`: `name`, `email`, `role`, `token`, `password`, `idEmployee`.
- `AuthenticationResponse`: `statusCode`, `error`, `message`, `token`, `refreshToken`, `expirationTime`, `user`, `isVaild`, `role`.
- `UserDTO`: `id`, `name`, `email`, `password`, `idEmployee`, `role`, `isActive`.
- `ImageDTO`: `id`, `url`.
- `NotificationDTO`: `id`, `message`, `createAt`, `url`, `isRead`, `idUser`.

## Quarkus Persistence Mapping

MySQL services should use:

- `quarkus-hibernate-orm-panache`
- `quarkus-jdbc-mysql`

MongoDB services should use:

- `quarkus-mongodb-panache`

Use explicit repositories instead of Panache only when it preserves current behavior more clearly.

## Configuration Rules

Use environment-backed config:

```properties
quarkus.datasource.db-kind=mysql
quarkus.datasource.username=${MYSQL_USERNAME:root}
quarkus.datasource.password=${MYSQL_PASSWORD:}
quarkus.datasource.jdbc.url=${USER_MYSQL_JDBC_URL:jdbc:mysql://localhost:3306/portfolio}
quarkus.mongodb.connection-string=${MONGODB_CONNECTION_STRING:mongodb://localhost:27017}
quarkus.mongodb.database=${MONGODB_DATABASE:microservice-portfolio}
```

Do not commit real database credentials.

## Schema Rules

- Keep `@Table(name = "...")` names.
- Keep `@Document(collection = "...")` names.
- Keep integer ids unless a migration is approved.
- Keep enum field JSON compatibility for `Role`, `TypeProfile`, and `TypeJob`.
- Do not add Flyway or Liquibase in the first migration pass unless requested.
- Keep Hibernate database generation behavior compatible for local development, then harden later.

## Required Checks Before Porting

For each service, inspect:

- Entity/model field annotations and id generation.
- Repository query methods.
- Null/default behavior in service methods.
- Collection/table names.
- Database names in properties.
- DTO-to-entity mapping behavior.
