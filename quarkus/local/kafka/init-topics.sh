#!/usr/bin/env bash
set -euo pipefail

create_topic() {
  local topic="$1"
  local retention="$2"

  /opt/kafka/bin/kafka-topics.sh \
    --bootstrap-server kafka:29092 \
    --create \
    --if-not-exists \
    --topic "$topic" \
    --partitions 1 \
    --replication-factor 1 \
    --config cleanup.policy=delete \
    --config retention.ms="$retention"
}

seven_days_ms=604800000
fourteen_days_ms=1209600000

create_topic javanc.user.events "$seven_days_ms"
create_topic javanc.manager.events "$seven_days_ms"
create_topic javanc.project.events "$seven_days_ms"
create_topic javanc.email.commands "$seven_days_ms"
create_topic javanc.notification.commands "$seven_days_ms"
create_topic javanc.email.commands.dlq "$fourteen_days_ms"
create_topic javanc.notification.commands.dlq "$fourteen_days_ms"
create_topic javanc.domain-events.dlq "$fourteen_days_ms"

/opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:29092 --list
