package com.javanc.manager;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.javanc.manager.infrastructure.outbox.OutboxEventDocument;
import com.javanc.manager.infrastructure.outbox.OutboxMessageKind;
import com.javanc.manager.infrastructure.outbox.OutboxPublisherWorker;
import com.javanc.manager.infrastructure.outbox.OutboxStatus;

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
@QuarkusTestResource(value = KafkaDevServicesOutboxTest.ChannelKafkaCompanionResource.class, restrictToAnnotatedClass = true)
class KafkaDevServicesOutboxTest {

    private static final String TOPIC = "javanc.notification.commands";

    @Inject
    OutboxPublisherWorker outboxPublisherWorker;

    @InjectKafkaCompanion
    KafkaCompanion companion;

    @BeforeEach
    void prepareTopic() {
        if (!companion.topics().list().contains(TOPIC)) {
            companion.topics().createAndWait(TOPIC, 1);
        } else {
            companion.topics().clear(TOPIC);
        }
    }

    @Test
    void outboxPublisherSendsNotificationCommandWhenKafkaIsEnabled() {
        OutboxEventDocument record = OutboxEventDocument.pending(OutboxMessageKind.COMMAND, "CreateNotification",
                TOPIC, "Manager", "1", "phase5-request", "phase5:kafka-devservices:manager",
                "{\"purpose\":\"phase5\"}");

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
                    "mp.messaging.outgoing.notification-commands-out.enabled", "true");
        }
    }

    public static class ChannelKafkaCompanionResource extends KafkaCompanionResource {
        @Override
        public Map<String, String> start() {
            Map<String, String> config = new HashMap<>(super.start());
            String bootstrapServers = config.get("kafka.bootstrap.servers");
            config.put("mp.messaging.outgoing.notification-commands-out.bootstrap.servers", bootstrapServers);
            return config;
        }
    }
}
