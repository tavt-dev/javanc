package com.javanc.project;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Map;

import org.junit.jupiter.api.Test;

import com.javanc.project.infrastructure.outbox.OutboxEventEntity;
import com.javanc.project.infrastructure.outbox.OutboxMessageKind;
import com.javanc.project.infrastructure.outbox.OutboxPublisherWorker;
import com.javanc.project.infrastructure.outbox.OutboxStatus;

import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.QuarkusTestProfile;
import io.quarkus.test.junit.TestProfile;
import io.quarkus.test.kafka.InjectKafkaCompanion;
import io.quarkus.test.kafka.KafkaCompanionResource;
import io.smallrye.reactive.messaging.kafka.companion.ConsumerTask;
import io.smallrye.reactive.messaging.kafka.companion.KafkaCompanion;
import jakarta.inject.Inject;

@QuarkusTest
@TestProfile(KafkaDevServicesOutboxTest.KafkaEnabledProfile.class)
@QuarkusTestResource(value = KafkaCompanionResource.class, restrictToAnnotatedClass = true)
class KafkaDevServicesOutboxTest {

    private static final String TOPIC = "javanc.project.events";

    @Inject
    OutboxPublisherWorker outboxPublisherWorker;

    @InjectKafkaCompanion
    KafkaCompanion companion;

    @Test
    void outboxPublisherSendsProjectEventWhenKafkaIsEnabled() {
        OutboxEventEntity record = OutboxEventEntity.pending(OutboxMessageKind.EVENT, "ProjectFoundationProbe",
                TOPIC, "Project", "1", "phase5-request", null, "{\"purpose\":\"phase5\"}");

        outboxPublisherWorker.publish(record);

        ConsumerTask<String, String> messages = companion.consumeStrings().fromTopics(TOPIC, 1);

        messages.awaitCompletion();
        assertEquals(1, messages.count());
        assertEquals(OutboxStatus.PUBLISHED, record.status);
    }

    public static class KafkaEnabledProfile implements QuarkusTestProfile {
        @Override
        public Map<String, String> getConfigOverrides() {
            return Map.of(
                    "messaging.enabled", "true",
                    "quarkus.kafka.devservices.enabled", "true",
                    "mp.messaging.outgoing.project-events-out.enabled", "true");
        }
    }
}
