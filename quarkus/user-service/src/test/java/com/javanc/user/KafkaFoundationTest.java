package com.javanc.user;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.Map;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.javanc.user.adapter.out.messaging.KafkaFoundationPublisher;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;

@QuarkusTest
class KafkaFoundationTest {

    @Inject
    KafkaFoundationPublisher publisher;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    MeterRegistry meterRegistry;

    @Test
    void commandEnvelopeSerializesWithRequiredFields() throws Exception {
        KafkaFoundationPublisher.CommandEnvelope<Map<String, Object>> envelope = KafkaFoundationPublisher.CommandEnvelope
                .create("SendVerificationOtpEmail", "user-service", "phase4-request", "otp:test@example.test",
                        Map.of("purpose", "phase4"));

        String json = objectMapper.writeValueAsString(envelope);
        KafkaFoundationPublisher.CommandEnvelope<?> decoded = objectMapper.readValue(json,
                KafkaFoundationPublisher.CommandEnvelope.class);

        assertEquals("SendVerificationOtpEmail", decoded.commandType());
        assertEquals("phase4-request", decoded.correlationId());
        assertEquals(1, decoded.payloadVersion());
    }

    @Test
    void commandEnvelopeRejectsMissingRequiredMetadata() {
        assertThrows(IllegalArgumentException.class,
                () -> KafkaFoundationPublisher.CommandEnvelope.create("", "user-service", "phase4-request",
                        "otp:test@example.test", Map.of("purpose", "phase4")));
    }

    @Test
    void disabledPublisherDoesNotRequireKafkaBroker() {
        double before = publishCount("javanc.email.commands", "disabled");

        publisher.publishEmailCommand("SendVerificationOtpEmail", "otp:test@example.test", Map.of("purpose", "phase4"))
                .toCompletableFuture()
                .join();

        assertEquals(before + 1.0, publishCount("javanc.email.commands", "disabled"));
    }

    private double publishCount(String topic, String outcome) {
        Counter counter = meterRegistry.find("javanc_kafka_publish_total")
                .tag("service", "user-service")
                .tag("topic", topic)
                .tag("outcome", outcome)
                .counter();
        return counter == null ? 0.0 : counter.count();
    }
}
