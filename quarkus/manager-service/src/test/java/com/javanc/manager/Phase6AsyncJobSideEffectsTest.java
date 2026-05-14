package com.javanc.manager;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.javanc.manager.application.dto.ApiResponse;
import com.javanc.manager.application.dto.MessageDTO;
import com.javanc.manager.infrastructure.client.EmailClient;
import com.javanc.manager.infrastructure.client.EmailServiceAdapter;
import com.javanc.manager.infrastructure.client.NotificationClient;
import com.javanc.manager.infrastructure.client.NotificationServiceAdapter;
import com.javanc.manager.infrastructure.outbox.OutboxEventDocument;
import com.javanc.manager.infrastructure.outbox.OutboxEventRepository;
import com.javanc.manager.infrastructure.outbox.OutboxMessageKind;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;

class Phase6AsyncJobSideEffectsTest {

    @Test
    void asyncEmailAdapterWritesOutboxAndSkipsHttpWhenFallbackDisabled() {
        FakeOutboxRepository outboxRepository = new FakeOutboxRepository();
        CapturingEmailClient emailClient = new CapturingEmailClient();
        EmailServiceAdapter adapter = new EmailServiceAdapter(emailClient, outboxRepository, new ObjectMapper(),
                new SimpleMeterRegistry(), true, false, "javanc.email.commands");

        adapter.send(new MessageDTO("Job accepted", 33));

        assertEquals(0, emailClient.calls);
        assertEquals(OutboxMessageKind.COMMAND, outboxRepository.saved.messageKind);
        assertEquals("SendUserMessageEmail", outboxRepository.saved.messageType);
        assertEquals("javanc.email.commands", outboxRepository.saved.topic);
    }

    @Test
    void asyncNotificationAdapterWritesOutboxAndSkipsHttpWhenFallbackDisabled() {
        FakeOutboxRepository outboxRepository = new FakeOutboxRepository();
        CapturingNotificationClient notificationClient = new CapturingNotificationClient();
        NotificationServiceAdapter adapter = new NotificationServiceAdapter(notificationClient, outboxRepository,
                new ObjectMapper(), new SimpleMeterRegistry(), true, false, "javanc.notification.commands");

        adapter.create(new MessageDTO("Job accepted", 33));

        assertEquals(0, notificationClient.calls);
        assertEquals(OutboxMessageKind.COMMAND, outboxRepository.saved.messageKind);
        assertEquals("CreateNotification", outboxRepository.saved.messageType);
        assertEquals("javanc.notification.commands", outboxRepository.saved.topic);
    }

    private static class FakeOutboxRepository extends OutboxEventRepository {
        private OutboxEventDocument saved;

        private FakeOutboxRepository() {
            super(false);
        }

        @Override
        public void persist(OutboxEventDocument entity) {
            saved = entity;
        }
    }

    private static class CapturingEmailClient implements EmailClient {
        private int calls;

        @Override
        public ApiResponse<String> send(MessageDTO messageDTO) {
            calls++;
            return new ApiResponse<>(true, "ok", "true");
        }
    }

    private static class CapturingNotificationClient implements NotificationClient {
        private int calls;

        @Override
        public ApiResponse<String> create(MessageDTO messageDTO) {
            calls++;
            return new ApiResponse<>(true, "ok", "true");
        }
    }
}
