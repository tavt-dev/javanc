package com.javanc.user;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.javanc.user.adapter.out.email.EmailServiceVerificationNotifier;
import com.javanc.user.adapter.out.notification.NotificationRoleRequestNotifier;
import com.javanc.user.adapter.out.outbox.OutboxEventRepository;
import com.javanc.user.adapter.out.outbox.OutboxMessageKind;

import io.micrometer.core.instrument.MeterRegistry;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@QuarkusTest
class Phase6AsyncOutboxTest {

    @Inject
    OutboxEventRepository outboxRepository;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    MeterRegistry meterRegistry;

    @BeforeEach
    @Transactional
    void cleanOutbox() {
        outboxRepository.deleteAll();
    }

    @Test
    @Transactional
    void asyncOtpNotifierWritesEmailCommandOutboxWithoutHttpFallback() {
        EmailServiceVerificationNotifier notifier = new EmailServiceVerificationNotifier(null, outboxRepository,
                objectMapper, meterRegistry, true, false, "javanc.email.commands");

        notifier.sendOtpForUser(42, "phase6@example.test", "Phase Six", "123456", 5);

        assertEquals(1, outboxRepository.count());
        var record = outboxRepository.listAll().getFirst();
        assertEquals(OutboxMessageKind.COMMAND, record.messageKind);
        assertEquals("SendVerificationOtpEmail", record.messageType);
        assertEquals("javanc.email.commands", record.topic);
        assertEquals("User", record.aggregateType);
        assertEquals("42", record.aggregateId);
    }

    @Test
    @Transactional
    void asyncRoleNotifierWritesNotificationCommandOutboxWithoutHttpFallback() {
        NotificationRoleRequestNotifier notifier = new NotificationRoleRequestNotifier(null, outboxRepository,
                objectMapper, meterRegistry, true, true, false, "javanc.notification.commands");

        notifier.notifyRoleRequest(77, 42, "Your manager upgrade request was approved", "APPROVED");

        assertEquals(1, outboxRepository.count());
        var record = outboxRepository.listAll().getFirst();
        assertEquals(OutboxMessageKind.COMMAND, record.messageKind);
        assertEquals("CreateNotification", record.messageType);
        assertEquals("javanc.notification.commands", record.topic);
        assertEquals("RoleRequest", record.aggregateType);
        assertEquals("77", record.aggregateId);
    }
}
