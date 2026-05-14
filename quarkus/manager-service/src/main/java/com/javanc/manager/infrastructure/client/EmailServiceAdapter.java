package com.javanc.manager.infrastructure.client;

import java.util.UUID;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.jboss.logging.MDC;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.javanc.manager.application.dto.MessageDTO;
import com.javanc.manager.application.port.EmailPort;
import com.javanc.manager.infrastructure.outbox.OutboxEventDocument;
import com.javanc.manager.infrastructure.outbox.OutboxEventRepository;
import com.javanc.manager.infrastructure.outbox.OutboxMessageKind;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class EmailServiceAdapter implements EmailPort {

    private final EmailClient emailClient;
    private final OutboxEventRepository outboxRepository;
    private final ObjectMapper objectMapper;
    private final MeterRegistry meterRegistry;
    private final boolean asyncJobSideEffectsEnabled;
    private final boolean asyncHttpFallbackEnabled;
    private final String emailCommandsTopic;

    @Inject
    public EmailServiceAdapter(@RestClient EmailClient emailClient, OutboxEventRepository outboxRepository,
            ObjectMapper objectMapper, MeterRegistry meterRegistry,
            @ConfigProperty(name = "async.job-side-effects.enabled", defaultValue = "false") boolean asyncJobSideEffectsEnabled,
            @ConfigProperty(name = "async.http-fallback.enabled", defaultValue = "true") boolean asyncHttpFallbackEnabled,
            @ConfigProperty(name = "mp.messaging.outgoing.email-commands-out.topic", defaultValue = "javanc.email.commands") String emailCommandsTopic) {
        this.emailClient = emailClient;
        this.outboxRepository = outboxRepository;
        this.objectMapper = objectMapper;
        this.meterRegistry = meterRegistry;
        this.asyncJobSideEffectsEnabled = asyncJobSideEffectsEnabled;
        this.asyncHttpFallbackEnabled = asyncHttpFallbackEnabled;
        this.emailCommandsTopic = emailCommandsTopic;
    }

    @Override
    public void send(MessageDTO messageDTO) {
        if (asyncJobSideEffectsEnabled) {
            writeOutbox(messageDTO);
            if (!asyncHttpFallbackEnabled) {
                return;
            }
        }
        try {
            emailClient.send(messageDTO);
            record(asyncJobSideEffectsEnabled ? "dual-http" : "http", "success");
        } catch (RuntimeException exception) {
            record(asyncJobSideEffectsEnabled ? "dual-http" : "http", "failure");
            throw exception;
        }
    }

    private void writeOutbox(MessageDTO messageDTO) {
        try {
            SendUserMessageEmailPayload payload = new SendUserMessageEmailPayload(messageDTO.id,
                    messageDTO.message, messageDTO.message);
            String payloadJson = objectMapper.writeValueAsString(payload);
            String aggregateId = messageDTO.id == null ? "unknown" : messageDTO.id.toString();
            String idempotencyKey = "email:job-side-effect:" + aggregateId + ":" + UUID.randomUUID();
            outboxRepository.persist(OutboxEventDocument.pending(OutboxMessageKind.COMMAND, "SendUserMessageEmail",
                    emailCommandsTopic, "Job", aggregateId, correlationId(), idempotencyKey, payloadJson));
            record("outbox", "success");
        } catch (JsonProcessingException exception) {
            record("outbox", "failure");
            throw new IllegalStateException("Unable to create job email command", exception);
        }
    }

    private void record(String path, String outcome) {
        Counter.builder("javanc_async_side_effect_total")
                .tag("service", "manager-service")
                .tag("useCase", "job-email")
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

    private record SendUserMessageEmailPayload(Integer userId, String subject, String message) {
    }
}
