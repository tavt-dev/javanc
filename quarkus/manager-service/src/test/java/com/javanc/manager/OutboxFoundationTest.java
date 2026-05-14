package com.javanc.manager;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;

import com.javanc.manager.infrastructure.outbox.OutboxEventDocument;
import com.javanc.manager.infrastructure.outbox.OutboxMessageKind;
import com.javanc.manager.infrastructure.outbox.OutboxPublisherWorker;
import com.javanc.manager.infrastructure.outbox.OutboxStatus;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;

@QuarkusTest
class OutboxFoundationTest {

    @Inject
    OutboxPublisherWorker worker;

    @Test
    void publishFailureKeepsRecordPendingWithNextAttempt() {
        OutboxEventDocument record = eventRecord("javanc.unknown.events");

        worker.publish(record);

        assertEquals(OutboxStatus.PENDING, record.status);
        assertEquals(1, record.attemptCount);
        assertNotNull(record.nextAttemptAt);
        assertNotNull(record.lastError);
    }

    @Test
    void publishFailureAtMaxAttemptsMarksRecordFailed() {
        OutboxEventDocument record = eventRecord("javanc.unknown.events");
        record.attemptCount = 4;

        worker.publish(record);

        assertEquals(OutboxStatus.FAILED, record.status);
        assertEquals(5, record.attemptCount);
    }

    private static OutboxEventDocument eventRecord(String topic) {
        return OutboxEventDocument.pending(OutboxMessageKind.EVENT, "ManagerFoundationProbe", topic,
                "Manager", "1", "phase5-request", null, "{\"purpose\":\"phase5\"}");
    }
}
