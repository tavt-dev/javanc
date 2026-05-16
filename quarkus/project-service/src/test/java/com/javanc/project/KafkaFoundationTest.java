package com.javanc.project;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Map;

import org.junit.jupiter.api.Test;

import com.javanc.project.infrastructure.messaging.KafkaFoundationPublisher;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.QuarkusTestProfile;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;

@QuarkusTest
@TestProfile(KafkaFoundationTest.KafkaDisabledProfile.class)
class KafkaFoundationTest {

    @Inject
    KafkaFoundationPublisher publisher;

    @Inject
    MeterRegistry meterRegistry;

    @Test
    void disabledPublisherDoesNotRequireKafkaBroker() {
        double before = publishCount("javanc.project.events", "disabled");

        publisher.publishProjectEvent("ProjectFoundationProbe", "Project", "phase4", Map.of("purpose", "phase4"))
                .toCompletableFuture()
                .join();

        assertEquals(before + 1.0, publishCount("javanc.project.events", "disabled"));
    }

    private double publishCount(String topic, String outcome) {
        Counter counter = meterRegistry.find("javanc_kafka_publish_total")
                .tag("service", "project-service")
                .tag("topic", topic)
                .tag("outcome", outcome)
                .counter();
        return counter == null ? 0.0 : counter.count();
    }

    public static class KafkaDisabledProfile implements QuarkusTestProfile {
        @Override
        public Map<String, String> getConfigOverrides() {
            return Map.of(
                    "messaging.enabled", "false",
                    "mp.messaging.outgoing.project-events-out.enabled", "false",
                    "mp.messaging.outgoing.notification-commands-out.enabled", "false");
        }
    }
}
