package com.javanc.user;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Map;

import org.junit.jupiter.api.Test;

import com.javanc.user.adapter.out.messaging.KafkaFoundationPublisher;
import com.javanc.user.adapter.out.outbox.OutboxEventEntity;
import com.javanc.user.adapter.out.outbox.OutboxMessageKind;
import com.javanc.user.adapter.out.outbox.OutboxPublisherWorker;
import com.javanc.user.adapter.out.outbox.OutboxStatus;

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
@TestProfile(KafkaDevServicesPublisherTest.KafkaEnabledProfile.class)
@QuarkusTestResource(value = KafkaCompanionResource.class, restrictToAnnotatedClass = true)
class KafkaDevServicesPublisherTest {

    private static final String TOPIC = "javanc.email.commands";

    @Inject
    KafkaFoundationPublisher publisher;

    @Inject
    OutboxPublisherWorker outboxPublisherWorker;

    @InjectKafkaCompanion
    KafkaCompanion companion;

    @Test
    void publisherSendsMessageWhenKafkaIsEnabled() {
        publisher.publishEmailCommand("SendVerificationOtpEmail", "phase4:kafka-devservices",
                Map.of("purpose", "phase4"))
                .toCompletableFuture()
                .join();

        ConsumerTask<String, String> messages = companion.consumeStrings().fromTopics(TOPIC, 1);

        messages.awaitCompletion();
        assertEquals(1, messages.count());
    }

    @Test
    void outboxPublisherSendsMessageWhenKafkaIsEnabled() {
        OutboxEventEntity record = OutboxEventEntity.pending(OutboxMessageKind.COMMAND, "SendVerificationOtpEmail",
                TOPIC, "User", "1", "phase5-request", "phase5:kafka-devservices:user",
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
                    "mp.messaging.outgoing.email-commands-out.enabled", "true",
                    "mp.messaging.outgoing.email-commands-out.auto.offset.reset", "earliest",
                    "role.notifications.enabled", "false",
                    "user.admin.bootstrap.enabled", "true",
                    "user.admin.email", "test.admin@example.com",
                    "user.admin.password", "Password1!",
                    "user.admin.name", "Test Admin");
        }
    }
}
