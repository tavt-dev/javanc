package com.javanc.project;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;

import com.javanc.project.infrastructure.outbox.OutboxEventEntity;
import com.javanc.project.infrastructure.outbox.OutboxEventRepository;
import com.javanc.project.infrastructure.outbox.OutboxMessageKind;
import com.javanc.project.infrastructure.outbox.OutboxPublisherWorker;
import com.javanc.project.infrastructure.outbox.OutboxStatus;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.QuarkusTestProfile;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@QuarkusTest
@TestProfile(OutboxFoundationTest.DisabledOutboxProfile.class)
class OutboxFoundationTest {

    @Inject
    OutboxEventRepository repository;

    @Inject
    OutboxPublisherWorker worker;

    @Test
    @Transactional
    void disabledPollLeavesPendingRecordUntouched() {
        repository.deleteAll();
        OutboxEventEntity record = eventRecord("javanc.project.events");
        repository.persist(record);

        worker.poll();

        OutboxEventEntity saved = repository.findById(record.id);
        assertEquals(OutboxStatus.PENDING, saved.status);
        assertEquals(0, saved.attemptCount);
    }

    @Test
    void publishFailureKeepsRecordPendingWithNextAttempt() {
        OutboxEventEntity record = eventRecord("javanc.unknown.events");

        worker.publish(record);

        assertEquals(OutboxStatus.PENDING, record.status);
        assertEquals(1, record.attemptCount);
        assertNotNull(record.nextAttemptAt);
        assertNotNull(record.lastError);
    }

    private static OutboxEventEntity eventRecord(String topic) {
        return OutboxEventEntity.pending(OutboxMessageKind.EVENT, "ProjectFoundationProbe", topic,
                "Project", "1", "phase5-request", null, "{\"purpose\":\"phase5\"}");
    }

    public static class DisabledOutboxProfile implements QuarkusTestProfile {
        @Override
        public java.util.Map<String, String> getConfigOverrides() {
            return java.util.Map.of(
                    "messaging.enabled", "false",
                    "outbox.publisher.enabled", "false",
                    "mp.messaging.outgoing.project-events-out.enabled", "false",
                    "mp.messaging.outgoing.notification-commands-out.enabled", "false");
        }
    }
}
