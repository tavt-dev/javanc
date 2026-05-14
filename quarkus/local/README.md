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
| MySQL | `localhost:3306` |
| MongoDB | `localhost:27017` |
| Kafka | `localhost:9092` |
| Kafka UI | `http://localhost:9080` |
| Mailpit UI | `http://localhost:8025` |
| Mailpit SMTP | `localhost:1025` |

## Run Quarkus services locally

Use `local/services-local.env.example` as the Maven-local environment baseline. It points services to MySQL, MongoDB, Kafka and Mailpit on localhost while keeping Kafka business flow disabled by default.

Kafka remains optional:

- Baseline HTTP runtime: keep `MESSAGING_ENABLED=false` and `OUTBOX_PUBLISHER_ENABLED=false`.
- Kafka E2E trial: overlay `local/kafka-e2e.env.example`, then enable only the async use case being tested.

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
