package com.javanc.notification;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.javanc.notification.infrastructure.messaging.IdempotentCommandProcessor;
import com.javanc.notification.infrastructure.messaging.KafkaCommandConsumer;
import com.javanc.notification.infrastructure.messaging.ProcessedMessageRepository;
import com.javanc.notification.infrastructure.messaging.ProcessedMessageStatus;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@QuarkusTest
class KafkaFoundationTest {

    @Inject
    KafkaCommandConsumer consumer;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    MeterRegistry meterRegistry;

    @Inject
    ProcessedMessageRepository processedMessageRepository;

    @Inject
    IdempotentCommandProcessor idempotentCommandProcessor;

    @BeforeEach
    @Transactional
    void cleanProcessedMessages() {
        processedMessageRepository.deleteAll();
    }

    @Test
    void consumerValidatesEnvelopeWithoutCreatingNotification() throws Exception {
        double before = consumeCount("success");
        KafkaCommandConsumer.CommandEnvelope<Map<String, Object>> envelope = new KafkaCommandConsumer.CommandEnvelope<>(
                "command-1", "CreateNotification", Instant.now(), "manager-service", "phase4-request",
                "notification:phase4", 1, Map.of("purpose", "phase4"));

        consumer.consume(objectMapper.writeValueAsString(envelope));

        assertEquals(before + 1.0, consumeCount("success"));
        assertEquals(1, processedMessageRepository.count());
    }

    @Test
    void consumerRejectsInvalidEnvelopeWithoutThrowing() {
        double before = consumeCount("failure");

        consumer.consume("{\"commandType\":\"CreateNotification\"}");

        assertEquals(before + 1.0, consumeCount("failure"));
    }

    @Test
    void duplicateCommandIsAcknowledgedWithoutProcessingAgain() throws Exception {
        KafkaCommandConsumer.CommandEnvelope<Map<String, Object>> envelope = new KafkaCommandConsumer.CommandEnvelope<>(
                "command-duplicate", "CreateNotification", Instant.now(), "manager-service", "phase5-request",
                "notification:duplicate", 1, Map.of("purpose", "phase5"));
        String json = objectMapper.writeValueAsString(envelope);

        consumer.consume(json);
        consumer.consume(json);

        assertEquals(1, processedMessageRepository.count());
        assertEquals(ProcessedMessageStatus.PROCESSED,
                processedMessageRepository.findByIdempotencyKey("notification:duplicate").orElseThrow().status);
    }

    @Test
    void handlerFailureMarksMessageFailed() {
        KafkaCommandConsumer.CommandEnvelope<Map<String, Object>> envelope = new KafkaCommandConsumer.CommandEnvelope<>(
                "command-failure", "CreateNotification", Instant.now(), "manager-service", "phase5-request",
                "notification:failure", 1, Map.of("purpose", "phase5"));

        assertThrows(IllegalStateException.class,
                () -> idempotentCommandProcessor.process(envelope, () -> {
                    throw new IllegalStateException("notification store unavailable");
                }));

        assertEquals(ProcessedMessageStatus.FAILED,
                processedMessageRepository.findByIdempotencyKey("notification:failure").orElseThrow().status);
    }

    private double consumeCount(String outcome) {
        Counter counter = meterRegistry.find("javanc_kafka_consume_total")
                .tag("service", "notification-service")
                .tag("topic", "javanc.notification.commands")
                .tag("outcome", outcome)
                .counter();
        return counter == null ? 0.0 : counter.count();
    }
}
