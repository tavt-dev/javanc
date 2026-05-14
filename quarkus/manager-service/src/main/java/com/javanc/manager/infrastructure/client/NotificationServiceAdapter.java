package com.javanc.manager.infrastructure.client;

import java.util.UUID;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.jboss.logging.MDC;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.javanc.manager.application.dto.MessageDTO;
import com.javanc.manager.application.port.NotificationPort;
import com.javanc.manager.infrastructure.outbox.OutboxEventDocument;
import com.javanc.manager.infrastructure.outbox.OutboxEventRepository;
import com.javanc.manager.infrastructure.outbox.OutboxMessageKind;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class NotificationServiceAdapter implements NotificationPort {

    private final NotificationClient notificationClient;
    private final OutboxEventRepository outboxRepository;
    private final ObjectMapper objectMapper;
    private final MeterRegistry meterRegistry;
    private final boolean asyncJobSideEffectsEnabled;
    private final boolean asyncHttpFallbackEnabled;
    private final String notificationCommandsTopic;

    @Inject
    public NotificationServiceAdapter(@RestClient NotificationClient notificationClient,
            OutboxEventRepository outboxRepository, ObjectMapper objectMapper, MeterRegistry meterRegistry,
            @ConfigProperty(name = "async.job-side-effects.enabled", defaultValue = "false") boolean asyncJobSideEffectsEnabled,
            @ConfigProperty(name = "async.http-fallback.enabled", defaultValue = "true") boolean asyncHttpFallbackEnabled,
            @ConfigProperty(name = "mp.messaging.outgoing.notification-commands-out.topic", defaultValue = "javanc.notification.commands") String notificationCommandsTopic) {
        this.notificationClient = notificationClient;
        this.outboxRepository = outboxRepository;
        this.objectMapper = objectMapper;
        this.meterRegistry = meterRegistry;
        this.asyncJobSideEffectsEnabled = asyncJobSideEffectsEnabled;
        this.asyncHttpFallbackEnabled = asyncHttpFallbackEnabled;
        this.notificationCommandsTopic = notificationCommandsTopic;
    }

    @Override
    public void create(MessageDTO messageDTO) {
        if (asyncJobSideEffectsEnabled) {
            writeOutbox(messageDTO);
            if (!asyncHttpFallbackEnabled) {
                return;
            }
        }
        try {
            notificationClient.create(messageDTO);
            record(asyncJobSideEffectsEnabled ? "dual-http" : "http", "success");
        } catch (RuntimeException exception) {
            record(asyncJobSideEffectsEnabled ? "dual-http" : "http", "failure");
            throw exception;
        }
    }

    private void writeOutbox(MessageDTO messageDTO) {
        try {
            CreateNotificationPayload payload = new CreateNotificationPayload(messageDTO.id,
                    messageDTO.message, null);
            String payloadJson = objectMapper.writeValueAsString(payload);
            String aggregateId = messageDTO.id == null ? "unknown" : messageDTO.id.toString();
            String idempotencyKey = "notification:job-side-effect:" + aggregateId + ":" + UUID.randomUUID();
            outboxRepository.persist(OutboxEventDocument.pending(OutboxMessageKind.COMMAND, "CreateNotification",
                    notificationCommandsTopic, "Job", aggregateId, correlationId(), idempotencyKey, payloadJson));
            record("outbox", "success");
        } catch (JsonProcessingException exception) {
            record("outbox", "failure");
            throw new IllegalStateException("Unable to create job notification command", exception);
        }
    }

    private void record(String path, String outcome) {
        Counter.builder("javanc_async_side_effect_total")
                .tag("service", "manager-service")
                .tag("useCase", "job-notification")
                .tag("path", path)
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

    private record CreateNotificationPayload(Integer userId, String message, String url) {
    }
}
