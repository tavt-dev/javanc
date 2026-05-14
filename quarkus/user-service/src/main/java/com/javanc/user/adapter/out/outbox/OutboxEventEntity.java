package com.javanc.user.adapter.out.outbox;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "outbox_event")
public class OutboxEventEntity {

    @Id
    @Column(name = "id", length = 36)
    public String id;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_kind", nullable = false, length = 32)
    public OutboxMessageKind messageKind;

    @Column(name = "message_type", nullable = false, length = 150)
    public String messageType;

    @Column(name = "topic", nullable = false)
    public String topic;

    @Column(name = "aggregate_type", length = 100)
    public String aggregateType;

    @Column(name = "aggregate_id", length = 100)
    public String aggregateId;

    @Column(name = "correlation_id", nullable = false, length = 128)
    public String correlationId;

    @Column(name = "idempotency_key")
    public String idempotencyKey;

    @Column(name = "payload_version", nullable = false)
    public int payloadVersion;

    @Lob
    @Column(name = "payload_json", nullable = false, columnDefinition = "json")
    public String payloadJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    public OutboxStatus status;

    @Column(name = "attempt_count", nullable = false)
    public int attemptCount;

    @Column(name = "next_attempt_at")
    public Instant nextAttemptAt;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt;

    @Column(name = "published_at")
    public Instant publishedAt;

    @Column(name = "last_error", length = 1000)
    public String lastError;

    public static OutboxEventEntity pending(OutboxMessageKind kind, String messageType, String topic,
            String aggregateType, String aggregateId, String correlationId, String idempotencyKey, String payloadJson) {
        OutboxEventEntity entity = new OutboxEventEntity();
        entity.id = UUID.randomUUID().toString();
        entity.messageKind = kind;
        entity.messageType = messageType;
        entity.topic = topic;
        entity.aggregateType = aggregateType;
        entity.aggregateId = aggregateId;
        entity.correlationId = correlationId;
        entity.idempotencyKey = idempotencyKey;
        entity.payloadVersion = 1;
        entity.payloadJson = payloadJson;
        entity.status = OutboxStatus.PENDING;
        entity.attemptCount = 0;
        entity.createdAt = Instant.now();
        return entity;
    }
}
