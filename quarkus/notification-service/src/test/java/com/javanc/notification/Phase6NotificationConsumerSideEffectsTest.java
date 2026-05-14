package com.javanc.notification;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Instant;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.javanc.notification.infrastructure.messaging.KafkaCommandConsumer;
import com.javanc.notification.infrastructure.messaging.ProcessedMessageRepository;
import com.javanc.notification.infrastructure.persistence.NotificationJpaRepository;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.QuarkusTestProfile;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@QuarkusTest
@TestProfile(Phase6NotificationConsumerSideEffectsTest.SideEffectsEnabledProfile.class)
class Phase6NotificationConsumerSideEffectsTest {

    @Inject
    KafkaCommandConsumer consumer;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    ProcessedMessageRepository processedMessageRepository;

    @Inject
    NotificationJpaRepository notificationRepository;

    @BeforeEach
    @Transactional
    void clean() {
        processedMessageRepository.deleteAll();
        notificationRepository.deleteAll();
    }

    @Test
    void createNotificationCommandPersistsNotificationOnceWithIdempotency() throws Exception {
        var envelope = new KafkaCommandConsumer.CommandEnvelope<>("notification-command-1", "CreateNotification",
                Instant.now(), "manager-service", "phase6-request", "notification:job:33", 1,
                Map.of("userId", 33, "message", "Your application was accepted", "url", "/jobs/1"));
        String json = objectMapper.writeValueAsString(envelope);

        consumer.consume(json);
        consumer.consume(json);

        assertEquals(1, notificationRepository.findByUserId(33).size());
        assertEquals("Your application was accepted", notificationRepository.findByUserId(33).getFirst().getMessage());
    }

    public static class SideEffectsEnabledProfile implements QuarkusTestProfile {
        @Override
        public Map<String, String> getConfigOverrides() {
            return Map.of("kafka.consumer.side-effects.enabled", "true");
        }
    }
}
