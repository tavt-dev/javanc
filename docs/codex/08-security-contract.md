# Security Contract

## Current Security Summary

`user-service` owns authentication, users, roles, JWT generation, refresh token generation, and token validation.

`api-gateway` currently:

- Allows `/auth/**` without token.
- Requires `Authorization: Bearer <token>` for routes where `AuthenticationFilter` is configured.
- Calls `user-service` `/auth/isValid` to validate tokens.

## Current JWT Behavior To Preserve First

Based on `JwtTokenUtil`:

- Algorithm: HMAC SHA-256 compatible signing.
- Subject: user email.
- Issued-at claim is set.
- Expiration: 24 hours.
- Refresh token expiration: 24 hours.
- Token validation checks subject against loaded user details and expiration.

The current signing secret is hardcoded in Spring source. Do not copy the secret value into docs or Quarkus code. Use environment-backed config such as `JWT_SECRET` during migration.

## Auth Endpoint Status Behavior

Preserve these observed behaviors before cleanup:

- `POST /auth/signup` returns `409 CONFLICT` when `AuthenticationResponse.isVaild` is false.
- `POST /auth/signin` returns `401 UNAUTHORIZED` when `AuthenticationResponse.isVaild` is false.
- `POST /auth/isValid` returns `ApiResponse<AuthenticationResponse>`.
- Current invalid token behavior should be inspected carefully because exceptions may be mapped by service exception handlers.

## Role Behavior

Current role values are represented as strings/enums and include values used by user, admin, manager, and HR flows. Preserve casing and field names during baseline migration.

Important compatibility field:

- `AuthenticationResponse.role`
- `UserDTO.role`
- `AuthenticationRequest.role`

## Password Rules

- Preserve compatibility with existing password hashes.
- Use BCrypt-compatible hashing if stored hashes are BCrypt.
- Do not log raw passwords.
- Do not log encoded password hashes.
- Do not expose password hashes in DTO responses.
- Do not copy current debug password logs into Quarkus.

## Gateway Rules

Compatibility target:

- `/auth/**` remains public.
- `/profile/**`, `/project/**`, and `/manager/**` require token through gateway.
- `/notification/**` and `/image/**` preserve current gateway behavior first.
- Missing bearer token returns unauthorized.
- Invalid token returns unauthorized.
- Valid token forwards the request.

Security hardening after baseline may include:

- Direct JWT verification in gateway.
- Consistent auth requirements for `/notification/**` and `/image/**`.
- Role-based route policies.
- Safer downstream identity propagation.
- Removing token query parameters in favor of headers, only after frontend/API contract migration.

## Minimum Tests For Future Migration

`user-service`:

- Signup success.
- Signup duplicate email.
- Signin success.
- Signin unknown email.
- Signin wrong password.
- Refresh token success.
- Valid token returns valid response.
- Invalid token behavior is preserved or intentionally documented.

`gateway-service`:

- `/auth/**` passes without token.
- Protected route without token is rejected.
- Protected route with invalid token is rejected.
- Protected route with valid token is forwarded.

## Secret Handling

Move these to environment variables when migrating:

- JWT signing secret.
- Mail username and password.
- Database credentials.
- Cloudinary credentials.
- Kafka connection credentials if introduced.

Never include real secret values in docs, tests, source code, or example commands.
