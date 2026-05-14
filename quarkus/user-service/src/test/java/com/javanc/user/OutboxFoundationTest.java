package com.javanc.user;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;

import com.javanc.user.adapter.out.outbox.OutboxEventEntity;
import com.javanc.user.adapter.out.outbox.OutboxEventRepository;
import com.javanc.user.adapter.out.outbox.OutboxMessageKind;
import com.javanc.user.adapter.out.outbox.OutboxPublisherWorker;
import com.javanc.user.adapter.out.outbox.OutboxStatus;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@QuarkusTest
class OutboxFoundationTest {

    @Inject
    OutboxEventRepository repository;

    @Inject
    OutboxPublisherWorker worker;

    @Test
    @Transactional
    void disabledPollLeavesPendingRecordUntouched() {
        repository.deleteAll();
        OutboxEventEntity record = commandRecord("javanc.email.commands");
        repository.persist(record);

        worker.poll();

        OutboxEventEntity saved = repository.findById(record.id);
        assertEquals(OutboxStatus.PENDING, saved.status);
        assertEquals(0, saved.attemptCount);
    }

    @Test
    void publishFailureKeepsRecordPendingWithNextAttempt() {
        OutboxEventEntity record = commandRecord("javanc.unknown.commands");

        worker.publish(record);

        assertEquals(OutboxStatus.PENDING, record.status);
        assertEquals(1, record.attemptCount);
        assertNotNull(record.nextAttemptAt);
        assertNotNull(record.lastError);
    }

    @Test
    void publishFailureAtMaxAttemptsMarksRecordFailed() {
        OutboxEventEntity record = commandRecord("javanc.unknown.commands");
        record.attemptCount = 4;

        worker.publish(record);

        assertEquals(OutboxStatus.FAILED, record.status);
        assertEquals(5, record.attemptCount);
    }

    private static OutboxEventEntity commandRecord(String topic) {
        return OutboxEventEntity.pending(OutboxMessageKind.COMMAND, "SendVerificationOtpEmail", topic,
                "User", "1", "phase5-request", "phase5:user:1", "{\"purpose\":\"phase5\"}");
    }
}
