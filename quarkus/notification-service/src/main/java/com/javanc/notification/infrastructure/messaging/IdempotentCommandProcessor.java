package com.javanc.notification.infrastructure.messaging;

import java.time.Instant;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class IdempotentCommandProcessor {

    private static final String SERVICE_NAME = "notification-service";

    private final ProcessedMessageRepository repository;
    private final MeterRegistry meterRegistry;

    public IdempotentCommandProcessor(ProcessedMessageRepository repository, MeterRegistry meterRegistry) {
        this.repository = repository;
        this.meterRegistry = meterRegistry;
    }

    @Transactional(dontRollbackOn = RuntimeException.class)
    public boolean process(KafkaCommandConsumer.CommandEnvelope<?> envelope, Runnable handler) {
        ProcessedMessageEntity message = repository.findByIdempotencyKey(envelope.idempotencyKey()).orElse(null);
        if (message != null && message.status == ProcessedMessageStatus.PROCESSED) {
            record(envelope.commandType(), "duplicate");
            return false;
        }
        if (message == null) {
            message = new ProcessedMessageEntity();
            message.idempotencyKey = envelope.idempotencyKey();
            message.messageType = envelope.commandType();
            message.status = ProcessedMessageStatus.PROCESSING;
            repository.persist(message);
        }
        message.status = ProcessedMessageStatus.PROCESSING;
        message.lastError = null;
        try {
            handler.run();
            message.status = ProcessedMessageStatus.PROCESSED;
            message.processedAt = Instant.now();
            record(envelope.commandType(), "processed");
            return true;
        } catch (RuntimeException exception) {
            message.status = ProcessedMessageStatus.FAILED;
            message.lastError = truncate(exception.getMessage());
            record(envelope.commandType(), "failed");
            throw exception;
        }
    }

    private void record(String messageType, String outcome) {
        Counter.builder("javanc_consumer_idempotency_total")
                .tag("service", SERVICE_NAME)
                .tag("messageType", messageType)
                .tag("outcome", outcome)
                .register(meterRegistry)
                .increment();
    }

    private static String truncate(String message) {
        if (message == null) {
            return null;
        }
        return message.length() > 1000 ? message.substring(0, 1000) : message;
    }
}
