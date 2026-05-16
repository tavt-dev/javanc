# Javanc Environment Files

Use these files by purpose:

| File | Purpose |
|---|---|
| `local/infra.env` | Real local Docker Compose runtime file on the developer machine |
| `local/infra.env.example` | Docker Compose infrastructure on the developer machine |
| `local/services-local.env` | Real local baseline for Maven-run Quarkus services |
| `local/services-local.env.example` | Safe local baseline for Maven-run Quarkus services |
| `local/kafka-e2e.env` | Real local overlay that turns on Kafka/async flow when needed |
| `local/kafka-e2e.env.example` | Optional overlay that turns on Kafka/async flow locally |
| `env/services-prod.env.example` | Production backend contract for review, secret mapping, and deployment work |

Rules:

- Service-level `.env.example` files are local developer templates for running one service in isolation.
- `services-local.env` is the runtime file for the normal local stack; keep it aligned with `services-local.env.example`.
- `services-local.env.example` is the committed template/source of truth for local defaults.
- `services-prod.env.example` mirrors `application-prod.properties`; every value without a safe production default must be supplied by the deployment platform.
- Real `.env` files stay untracked.

Frontend:

- `client-react/.env.example` is the local frontend template.
- `client-react/.env.production.example` is the production build template.
