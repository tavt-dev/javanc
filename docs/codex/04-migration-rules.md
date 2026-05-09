# Migration Rules

## Scope Control

1. Migrate one service at a time.
2. Do not edit unrelated services.
3. Do not edit Angular client unless the user explicitly asks.
4. Do not delete Spring Boot services until the matching Quarkus service compiles, tests pass, and runs locally.
5. Do not create Quarkus scaffold when the request is docs-only, analysis-only, or plan-only.
6. Before implementation, list exact files to create and modify.
7. Keep changes small enough to review.
8. If behavior is unclear, inspect Spring code before deciding.

## Compatibility Rules

1. Preserve API paths, HTTP methods, and status behavior.
2. Preserve request parameter names and JSON field names.
3. Preserve multipart field names, especially `image`.
4. Preserve `ApiResponse` wrapper fields: `success`, `message`, `data`.
5. Preserve `AuthenticationResponse` field names including the current typo `isVaild`.
6. Preserve database names, table/collection names, and `Integer` id types.
7. Preserve JWT subject and 24-hour expiration behavior before security hardening.
8. Preserve current gateway public/protected route behavior first.
9. Move secrets to environment-backed config during Quarkus migration.

## Future Quarkus Code Rules

1. Use Jakarta REST resources for endpoints.
2. Use CDI scopes such as `@ApplicationScoped` for service classes.
3. Prefer constructor injection where practical.
4. Use `@Produces(MediaType.APPLICATION_JSON)` for JSON responses.
5. Use `@Consumes(MediaType.APPLICATION_JSON)` for JSON request bodies.
6. Use multipart support only for APIs that currently accept multipart.
7. Keep DTOs explicit and compatible with the Angular client.
8. Avoid unused abstractions and unused dependencies.
9. Do not introduce schema migration tools in the first pass unless requested.
10. Do not log raw passwords, encoded passwords, tokens, or secrets.

## Spring To Quarkus Mapping

| Spring pattern | Quarkus target |
|---|---|
| `@RestController` | Jakarta REST `@Path` resource |
| `@RequestMapping` | class-level `@Path` |
| `@GetMapping` | `@GET` |
| `@PostMapping` | `@POST` |
| `@PutMapping` | `@PUT` |
| `@DeleteMapping` | `@DELETE` |
| `@RequestBody` | resource method body parameter |
| `@RequestParam` | `@QueryParam` |
| `@RequestPart` / `@ModelAttribute` | Quarkus multipart form support |
| `ResponseEntity` | `Response` or `RestResponse` |
| `@Service` | `@ApplicationScoped` |
| `@Autowired` | constructor injection or `@Inject` |
| `JpaRepository` | Panache repository or explicit repository |
| `MongoRepository` | MongoDB Panache repository or explicit repository |
| OpenFeign | MicroProfile REST Client |
| Spring Kafka listener | SmallRye Reactive Messaging `@Incoming` |
| Spring Kafka producer | `Emitter` or `MutinyEmitter` with `@Channel` |
| Spring Mail | Quarkus Mailer |
| `@ControllerAdvice` | `ExceptionMapper` |

## Required Inspection Before Migrating A Service

Inspect these before writing Quarkus code:

- Controller endpoint paths, params, body types, multipart fields, and status behavior.
- DTO fields and exact JSON property names.
- Entity/model annotations, id type, table/collection name, and enum values.
- Repository query methods.
- Service business logic and side effects.
- Feign clients and downstream paths.
- Security checks and token handling.
- `application.yml` and `application.properties`.
- Current tests and missing tests.

## Service Migration Checklist

1. Create Quarkus module with required extensions only.
2. Add config-backed port, DB, service URLs, and external integration settings.
3. Port DTOs and response wrappers first.
4. Port entity/model mappings with compatible names and ids.
5. Port repository logic.
6. Port service logic.
7. Port REST clients.
8. Port resources/endpoints.
9. Add exception mappers compatible with existing response behavior.
10. Add basic tests.
11. Run service-level compile/test.
12. Report differences and risks.

## Definition Of Done Per Service

- Module compiles.
- Basic resource tests pass.
- Existing endpoint contracts are preserved or documented.
- Database mapping is compatible.
- Secrets are environment-backed.
- REST client URLs are config-backed.
- Main failure paths are tested or documented.
- Remaining gaps are listed in the final response.
