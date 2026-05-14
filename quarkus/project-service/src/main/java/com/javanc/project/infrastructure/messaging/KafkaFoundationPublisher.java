package com.javanc.project.infrastructure.messaging;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.reactive.messaging.Channel;
import org.eclipse.microprofile.reactive.messaging.Emitter;
import org.jboss.logging.Logger;
import org.jboss.logging.MDC;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;

@ApplicationScoped
public class KafkaFoundationPublisher {

    private static final Logger LOG = Logger.getLogger(KafkaFoundationPublisher.class);
    private static final String SERVICE_NAME = "project-service";

    @Inject
    ObjectMapper objectMapper;

    @Inject
    MeterRegistry meterRegistry;

    @Inject
    @Channel("project-events-out")
    Instance<Emitter<String>> projectEvents;

    @Inject
    @Channel("notification-commands-out")
    Instance<Emitter<String>> notificationCommands;

    @ConfigProperty(name = "messaging.enabled", defaultValue = "false")
    boolean messagingEnabled;

    @ConfigProperty(name = "mp.messaging.outgoing.project-events-out.topic", defaultValue = "javanc.project.events")
    String projectEventsTopic;

    @ConfigProperty(name = "mp.messaging.outgoing.notification-commands-out.topic", defaultValue = "javanc.notification.commands")
    String notificationCommandsTopic;

    public CompletionStage<Void> publishProjectEvent(String eventType, String aggregateType, String aggregateId,
            Object payload) {
        EventEnvelope<Object> envelope = EventEnvelope.create(eventType, SERVICE_NAME, aggregateType, aggregateId,
                correlationId(), payload);
        return publish(projectEventsTopic, projectEvents, envelope);
    }

    public CompletionStage<Void> publishNotificationCommand(String commandType, String idempotencyKey, Object payload) {
        CommandEnvelope<Object> envelope = CommandEnvelope.create(commandType, SERVICE_NAME, correlationId(),
                idempotencyKey, payload);
        return publish(notificationCommandsTopic, notificationCommands, envelope);
    }

    public CompletionStage<Void> publishOutboxMessage(String id, String messageKind, String messageType, String topic,
            String aggregateType, String aggregateId, String correlationId, String idempotencyKey, int payloadVersion,
            String payloadJson) {
        try {
            JsonNode payload = objectMapper.readTree(payloadJson);
            if ("EVENT".equals(messageKind)) {
                EventEnvelope<JsonNode> envelope = new EventEnvelope<>(id, messageType, Instant.now(), SERVICE_NAME,
                        aggregateType, aggregateId, correlationId, payloadVersion, payload);
                return publish(topic, emitterForTopic(topic), envelope);
            }
            if ("COMMAND".equals(messageKind)) {
                CommandEnvelope<JsonNode> envelope = new CommandEnvelope<>(id, messageType, Instant.now(),
                        SERVICE_NAME, correlationId, idempotencyKey, payloadVersion, payload);
                return publish(topic, emitterForTopic(topic), envelope);
            }
            return CompletableFuture.failedFuture(new IllegalArgumentException("Unsupported outbox message kind"));
        } catch (Exception exception) {
            record(topic, "failure");
            return CompletableFuture.failedFuture(exception);
        }
    }

    private Instance<Emitter<String>> emitterForTopic(String topic) {
        if (projectEventsTopic.equals(topic)) {
            return projectEvents;
        }
        if (notificationCommandsTopic.equals(topic)) {
            return notificationCommands;
        }
        throw new IllegalArgumentException("No Kafka emitter configured for topic: " + topic);
    }

    private CompletionStage<Void> publish(String topic, Instance<Emitter<String>> emitter, Object envelope) {
        if (!messagingEnabled) {
            record(topic, "disabled");
            LOG.debugf("Kafka disabled for topic=%s service=%s", topic, SERVICE_NAME);
            return CompletableFuture.completedFuture(null);
        }
        if (!emitter.isResolvable()) {
            record(topic, "failure");
            return CompletableFuture.failedFuture(new IllegalStateException("Kafka emitter is not available: " + topic));
        }
        try {
            String payload = objectMapper.writeValueAsString(envelope);
            return emitter.get().send(payload).whenComplete((ignored, failure) -> {
                String outcome = failure == null ? "success" : "failure";
                record(topic, outcome);
                LOG.infof("Kafka publish topic=%s service=%s outcome=%s", topic, SERVICE_NAME, outcome);
            });
        } catch (JsonProcessingException exception) {
            record(topic, "failure");
            return CompletableFuture.failedFuture(exception);
        }
    }

    private void record(String topic, String outcome) {
        Counter.builder("javanc_kafka_publish_total")
                .tag("service", SERVICE_NAME)
                .tag("topic", topic)
                .tag("outcome", outcome)
                .register(meterRegistry)
                .increment();
    }

    private String correlationId() {
        Object requestId = MDC.get("requestId");
        if (requestId instanceof String value && !value.isBlank()) {
            return value;
        }
        return UUID.randomUUID().toString();
    }

    public record EventEnvelope<T>(String eventId, String eventType, Instant occurredAt, String sourceService,
            String aggregateType, String aggregateId, String correlationId, int payloadVersion, T payload) {

        public EventEnvelope {
            require(eventId, "eventId");
            require(eventType, "eventType");
            require(sourceService, "sourceService");
            require(aggregateType, "aggregateType");
            require(aggregateId, "aggregateId");
            require(correlationId, "correlationId");
            Objects.requireNonNull(occurredAt, "occurredAt");
            Objects.requireNonNull(payload, "payload");
            if (payloadVersion < 1) {
                throw new IllegalArgumentException("payloadVersion must be positive");
            }
        }

        public static <T> EventEnvelope<T> create(String eventType, String sourceService, String aggregateType,
                String aggregateId, String correlationId, T payload) {
            return new EventEnvelope<>(UUID.randomUUID().toString(), eventType, Instant.now(), sourceService,
                    aggregateType, aggregateId, correlationId, 1, payload);
        }
    }

    public record CommandEnvelope<T>(String commandId, String commandType, Instant requestedAt, String sourceService,
            String correlationId, String idempotencyKey, int payloadVersion, T payload) {

        public CommandEnvelope {
            require(commandId, "commandId");
            require(commandType, "commandType");
            require(sourceService, "sourceService");
            require(correlationId, "correlationId");
            require(idempotencyKey, "idempotencyKey");
            Objects.requireNonNull(requestedAt, "requestedAt");
            Objects.requireNonNull(payload, "payload");
            if (payloadVersion < 1) {
                throw new IllegalArgumentException("payloadVersion must be positive");
            }
        }

        public static <T> CommandEnvelope<T> create(String commandType, String sourceService, String correlationId,
                String idempotencyKey, T payload) {
            return new CommandEnvelope<>(UUID.randomUUID().toString(), commandType, Instant.now(), sourceService,
                    correlationId, idempotencyKey, 1, payload);
        }
    }

    private static void require(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " is required");
        }
    }
}
