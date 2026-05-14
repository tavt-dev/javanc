# Quarkus Services

Use `run-service.ps1` to start a service with local env files loaded automatically.

Load order:

1. `<service>/.env.example` fills missing defaults.
2. Repo root `.env` overrides defaults when present.
3. `<service>/.env` overrides both when present.

Example:

```powershell
.\run-service.ps1 -Service user-service quarkus:dev
.\run-service.ps1 -Service gateway-service quarkus:dev
```

For Redis-backed rate limiting, start Redis and set `RATE_LIMIT_BACKEND=redis` in root `.env` or the service `.env`.

```powershell
docker compose -f ..\docker-compose.redis.yml up -d
```
