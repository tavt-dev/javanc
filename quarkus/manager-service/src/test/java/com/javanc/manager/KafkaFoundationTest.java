package com.javanc.manager;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Map;

import org.junit.jupiter.api.Test;

import com.javanc.manager.infrastructure.messaging.KafkaFoundationPublisher;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;

@QuarkusTest
class KafkaFoundationTest {

    @Inject
    KafkaFoundationPublisher publisher;

    @Inject
    MeterRegistry meterRegistry;

    @Test
    void disabledPublisherDoesNotRequireKafkaBroker() {
        double before = publishCount("javanc.manager.events", "disabled");

        publisher.publishManagerEvent("ManagerFoundationProbe", "Manager", "phase4", Map.of("purpose", "phase4"))
                .toCompletableFuture()
                .join();

        assertEquals(before + 1.0, publishCount("javanc.manager.events", "disabled"));
    }

    private double publishCount(String topic, String outcome) {
        Counter counter = meterRegistry.find("javanc_kafka_publish_total")
                .tag("service", "manager-service")
                .tag("topic", topic)
                .tag("outcome", outcome)
                .counter();
        return counter == null ? 0.0 : counter.count();
    }
}
