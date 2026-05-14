package com.javanc.manager.infrastructure.outbox;

import java.time.Instant;
import java.util.UUID;

import org.bson.codecs.pojo.annotations.BsonId;

import io.quarkus.mongodb.panache.common.MongoEntity;

@MongoEntity(collection = "outbox_event")
public class OutboxEventDocument {

    @BsonId
    public String id;
    public OutboxMessageKind messageKind;
    public String messageType;
    public String topic;
    public String aggregateType;
    public String aggregateId;
    public String correlationId;
    public String idempotencyKey;
    public int payloadVersion;
    public String payloadJson;
    public OutboxStatus status;
    public int attemptCount;
    public Instant nextAttemptAt;
    public Instant createdAt;
    public Instant publishedAt;
    public String lastError;

    public static OutboxEventDocument pending(OutboxMessageKind kind, String messageType, String topic,
            String aggregateType, String aggregateId, String correlationId, String idempotencyKey, String payloadJson) {
        OutboxEventDocument document = new OutboxEventDocument();
        document.id = UUID.randomUUID().toString();
        document.messageKind = kind;
        document.messageType = messageType;
        document.topic = topic;
        document.aggregateType = aggregateType;
        document.aggregateId = aggregateId;
        document.correlationId = correlationId;
        document.idempotencyKey = idempotencyKey;
        document.payloadVersion = 1;
        document.payloadJson = payloadJson;
        document.status = OutboxStatus.PENDING;
        document.attemptCount = 0;
        document.createdAt = Instant.now();
        return document;
    }
}
