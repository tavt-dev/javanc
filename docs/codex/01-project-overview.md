# Project Overview

## Purpose

This document set is the execution contract for migrating the current Spring Boot microservice backend to Quarkus. It should guide future Codex/agent work before any Quarkus code is created.

The docs describe the current system, the target Quarkus shape, compatibility rules, and prompts. They do not mean the Quarkus project has already been implemented.

## Repository Layout

```text
client/       Angular 18 client. Keep unchanged during backend migration unless explicitly requested.
microservice/ Current Spring Boot services. Use this as the behavior source of truth.
quarkus/      Reserved target directory for the future Quarkus Maven monorepo.
docs/codex/   Migration contracts, prompts, checklists, and guardrails.
```

## Current Backend Services

| Service | Current responsibility | Port | Migration target |
|---|---|---:|---|
| `api-gateway` | Gateway routes, token filter, user-service validation call | 8080 | `quarkus/gateway-service` |
| `discovery-server` | Eureka registry | 8671 | Removed from Quarkus target |
| `user-service` | Signup, signin, refresh, token validation, users, roles | 8088 | `quarkus/user-service` |
| `image-service` | Multipart image upload, image metadata, Cloudinary | 8083 | `quarkus/image-service` |
| `profile-service` | Profiles, contact/about data, image references | 8085 | `quarkus/profile-service` |
| `project-service` | Projects, profile ownership, image references | 8086 | `quarkus/project-service` |
| `notification-service` | Notification create/update/list | 8084 | `quarkus/notification-service` |
| `email-service` | Email send endpoint and mail integration | 8087 | `quarkus/email-service` |
| `manager-service` | Companies, jobs, HR/manager assignment, job applications | 8091 | `quarkus/manager-service` |

## Migration Goal

Convert the backend to Quarkus service by service while preserving behavior used by the Angular client and current inter-service calls.

Primary goals:

- Preserve public API paths, HTTP methods, query parameter names, request bodies, response wrappers, and JSON field names.
- Preserve database names, table/collection names, entity fields, and id types unless a separate migration is approved.
- Preserve JWT compatibility first; move hardcoded secrets to environment-backed config during migration.
- Replace Eureka in the Quarkus target with configured service URLs and Docker Compose service names.
- Add health, OpenAPI, validation, tests, and Docker Compose after baseline service behavior is stable.
- Add new business features only after the affected Quarkus services compile, run, and pass baseline tests.

## Current Product Domains

| Domain | Owner service | Main data | Important flows |
|---|---|---|---|
| Auth/User | `user-service` | `User`, `Role`, JWT | signup, signin, refresh, token validation, user lookup |
| Image | `image-service` | `Image` | upload image, return image URL/id |
| Profile | `profile-service` | `Profile`, `Contact`, `TypeProfile` | create/update profile, search/filter profile |
| Project | `project-service` | `Project` | create/update project, list by profile |
| Notification | `notification-service` | `Notification` | create, update, list by user |
| Email | `email-service` | no DB entity detected | send email from message payload |
| Management | `manager-service` | `Company`, `Job` | company CRUD, HR assignment, job applications |

## Source Of Truth Rule

The Spring source under `microservice/` is authoritative. Before implementing any Quarkus service, inspect:

- Controller paths, methods, request params, request bodies, multipart usage, and status behavior.
- DTO fields and JSON field names.
- Entity/model fields, id type, table name, and collection name.
- Repository methods.
- Service business logic and exception behavior.
- Feign clients and downstream paths.
- Security config, token logic, and current gateway route rules.
- `application.yml` and `application.properties`.

## Non-Goals Until Explicitly Requested

- Do not create Quarkus modules during docs-only or analysis-only work.
- Do not edit Spring Boot implementation during planning/docs work.
- Do not edit Angular client during backend migration unless explicitly requested.
- Do not redesign the database during framework migration.
- Do not remove Spring services or Eureka until Quarkus replacements are proven.
- Do not add new business features during the migration baseline.
