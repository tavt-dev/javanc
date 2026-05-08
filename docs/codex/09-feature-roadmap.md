# Feature Roadmap

## Rule

Migration first, features second.

Do not add new business features until the affected Quarkus services compile, run locally, pass basic tests, and preserve baseline API behavior.

## Phase 0: Documentation And Planning

Goal: keep migration work predictable before code changes.

Acceptance:

- `docs/codex` describes current services, target architecture, APIs, DB, security, and prompts.
- No Quarkus code is generated during docs-only work.
- Known risks are listed before implementation starts.

## Phase 1: Quarkus Baseline Migration

Goal: create Quarkus services that preserve current behavior.

Order:

1. `user-service`
2. `image-service`
3. `profile-service`
4. `notification-service`
5. `project-service`
6. `email-service`
7. `manager-service`
8. `gateway-service`

Baseline acceptance:

- Each migrated service compiles.
- Main endpoints respond with compatible wrapper shape.
- Request params, JSON fields, and multipart field names are compatible.
- Database mappings are compatible.
- REST clients use config-backed URLs.
- Secrets are not hardcoded.
- Spring source remains available as reference.

## Phase 2: Stabilization

Add platform quality after baseline behavior is stable:

- Health checks.
- OpenAPI docs.
- Global exception mappers.
- Bean validation.
- Test coverage for main resources and services.
- Docker Compose for local multi-service runs.
- Centralized environment variable documentation.
- JWT config hardening.
- Mail/Kafka/Cloudinary config hardening.
- Consistent logging and error response behavior.

## Phase 3: Security And API Cleanup

Only after compatibility is proven:

- Review route auth rules for `/notification/**` and `/image/**`.
- Replace token query params with headers where feasible.
- Normalize inconsistent Feign paths.
- Decide what to do with `/profile-hr/**`.
- Remove unsafe password/token logging from replacement code.
- Consider database migration tooling if schema ownership is clear.

## Phase 4: Business Features

Candidate features after migration:

- Admin dashboard APIs for users, companies, jobs, profiles, and projects.
- Job application flow with review states.
- Notification read/unread state and unread count.
- Image ownership validation.
- Better search/filter for jobs and projects.

Each feature must have a separate plan defining API changes, DTO changes, service ownership, security behavior, and tests.

## Prohibited During Baseline

- No endpoint renames for cleanup only.
- No role redesign.
- No database redesign.
- No frontend rewrite.
- No schema migration unless explicitly approved.
- No new business feature hidden inside framework migration.
