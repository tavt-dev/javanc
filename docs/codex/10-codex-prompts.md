# Codex Prompt Pack

Use these prompts to keep future work scoped. Prompts marked analysis-only, docs-only, or plan-only must not produce code changes.

## 1. Analysis-Only Prompt

```text
Read docs/codex and inspect the relevant Spring service under microservice/.

Goal:
Analyze the next Quarkus migration step. Do not edit files.

Report:
1. Current endpoints, params, body types, multipart fields, and status behavior.
2. DTOs and JSON fields to preserve.
3. Database names, tables/collections, model fields, and id types.
4. Current service dependencies and Feign clients.
5. Security/JWT behavior.
6. Migration risks and compatibility traps.
7. Exact files that would be created or modified in a later implementation step.

Do not write code. Do not create Quarkus scaffold.
```

## 2. Docs-Only Prompt

```text
Update only docs/codex/*.md for the Quarkus migration.

Rules:
- Do not edit README.md.
- Do not edit microservice/.
- Do not edit client/.
- Do not create files under quarkus/.
- Do not run Maven or Quarkus commands.
- Use English.
- Keep facts aligned with the current Spring source.
- Do not include real secrets.

After editing:
- Verify that only docs/codex/*.md changed.
- Scan docs for draft markers, unresolved placeholders, and real secrets.
```

## 3. Scaffold-Only Prompt

```text
Create only the initial Quarkus Maven monorepo scaffold under quarkus/.

Rules:
- Do not migrate business logic yet.
- Do not edit Spring services.
- Do not edit Angular client.
- Use Quarkus 3.33 LTS, Java 21, Maven.
- Create parent pom and placeholder service modules only.
- Add environment-backed application.properties examples.
- Keep ports compatible with the current Spring services.
- Do not include real secrets.

After editing:
- Run a Maven validation command if dependencies are available.
- Report files created and remaining scaffold risks.
```

## 4. Service Migration Prompt

```text
Migrate only <service-name> from microservice/<service-name> to quarkus/<service-name>.

Before editing:
- Read all docs/codex files.
- Inspect the Spring controller, DTOs, models/entities, repositories, service logic, clients, security, and config.
- List exact files to create and modify.

Implementation rules:
- Do not modify unrelated services.
- Do not delete Spring code.
- Preserve API paths, methods, params, multipart field names, JSON fields, and ApiResponse shape.
- Preserve database names, table/collection names, model fields, enum values, and id types.
- Preserve auth/JWT compatibility before security cleanup.
- Move secrets to environment-backed config.
- Use Jakarta REST, CDI, Quarkus repositories/clients, and Quarkus tests.

After editing:
- Report files created.
- Report files modified.
- Describe behavior changed.
- Explain how to run.
- Explain how to test.
- List remaining risks.
```

## 5. User-Service First Migration Prompt

```text
Migrate user-service first.

Compatibility requirements:
- Preserve /auth endpoints.
- Preserve AuthenticationRequest, AuthenticationResponse, UserDTO, and ApiResponse JSON fields.
- Preserve AuthenticationResponse.isVaild spelling.
- Preserve JWT subject=email and 24-hour expiration behavior first.
- Move JWT secret to environment-backed config.
- Preserve signup duplicate email and signin invalid credential status behavior.
- Do not log raw passwords, encoded passwords, or tokens.

Tests:
- Signup success and duplicate email.
- Signin success and invalid credentials.
- Refresh token.
- Token validation.
- User lookup by id.
```

## 6. Test Prompt

```text
Add tests for quarkus/<service-name>.

Rules:
- Cover primary endpoint behavior.
- Verify ApiResponse wrapper shape.
- Cover important failure paths.
- Mock downstream REST clients where practical.
- Do not require production secrets.
- Do not modify unrelated services.

Run the relevant test command and summarize results.
```

## 7. Review Prompt

```text
Review the Quarkus migration for <service-name>.

Prioritize findings:
1. API compatibility regressions.
2. DTO or JSON field mismatches.
3. Multipart field mismatches.
4. Database table, collection, field, enum, or id incompatibilities.
5. Auth/JWT behavior regressions.
6. Secret leakage.
7. Missing tests.
8. Unused dependencies or unnecessary abstractions.

Return findings first with file and line references.
```

## 8. Feature-After-Baseline Prompt

```text
Plan a new feature only after the affected Quarkus services compile, run, and preserve baseline API behavior.

Feature:
<feature description>

Plan:
1. Affected services.
2. API additions or changes.
3. DTO/schema changes.
4. Security behavior.
5. Tests and acceptance criteria.
6. Rollout risks.

Do not implement until the plan is decision complete.
```
