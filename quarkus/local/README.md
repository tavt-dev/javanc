# Javanc Local Runtime

Phase 7 provides local infrastructure only. Quarkus services still run with Maven on the host.

## Start infrastructure

```powershell
cd quarkus
.\scripts\local-infra-up.ps1
```

Services:

| Component | URL |
|---|---|
| MySQL | `localhost:3307` |
| MongoDB | `localhost:27017` |
| Redis | `localhost:6379` |
| Kafka | `localhost:9092` |
| Kafka UI | `http://localhost:9080` |
| Mailpit UI | `http://localhost:8025` |
| Mailpit SMTP | `localhost:1025` |

## Run Quarkus services locally

Use `local/services-local.env` as the Maven-local runtime baseline. It matches `local/infra.env`, points services to MySQL, MongoDB, Redis, Kafka and Mailpit on localhost, and keeps Kafka business flow disabled by default. Keep it aligned with the committed template `local/services-local.env.example`.

Use service-level `.env` files when running one service in isolation; their `.env.example` counterparts are the committed templates. For deployment work, use `env/services-prod.env.example` as the backend production contract.

Redis is available for the first cache/session foundation in `user-service`. Check it with:

```powershell
docker exec javanc-redis redis-cli -a javanc_local ping
```

Kafka remains optional:

- Baseline HTTP runtime: keep `MESSAGING_ENABLED=false` and `OUTBOX_PUBLISHER_ENABLED=false`.
- Kafka E2E trial: overlay `local/kafka-e2e.env`, then enable only the async use case being tested.

## Topics

`kafka-init` creates these topics on startup:

- `javanc.user.events`
- `javanc.manager.events`
- `javanc.project.events`
- `javanc.email.commands`
- `javanc.notification.commands`
- `javanc.email.commands.dlq`
- `javanc.notification.commands.dlq`
- `javanc.domain-events.dlq`

Local retention is 7 days for event/command topics and 14 days for DLQ topics. Production retention remains a separate operations decision.
