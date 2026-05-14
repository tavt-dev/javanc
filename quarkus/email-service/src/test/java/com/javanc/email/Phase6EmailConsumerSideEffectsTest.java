package com.javanc.email;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Instant;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.javanc.email.infrastructure.messaging.KafkaCommandConsumer;
import com.javanc.email.infrastructure.messaging.ProcessedMessageRepository;
import com.javanc.email.interfaces.rest.resource.EmailResourceTest;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.QuarkusTestProfile;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@QuarkusTest
@TestProfile(Phase6EmailConsumerSideEffectsTest.SideEffectsEnabledProfile.class)
class Phase6EmailConsumerSideEffectsTest {

    @Inject
    KafkaCommandConsumer consumer;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    ProcessedMessageRepository processedMessageRepository;

    @BeforeEach
    @Transactional
    void clean() {
        processedMessageRepository.deleteAll();
        EmailResourceTest.TestMailSenderPort.sentMessage = null;
        EmailResourceTest.TestMailSenderPort.sendCount = 0;
        EmailResourceTest.TestUserLookupPort.requestedId = null;
    }

    @Test
    void verificationOtpCommandSendsMailOnceWithIdempotency() throws Exception {
        var envelope = new KafkaCommandConsumer.CommandEnvelope<>("otp-command-1", "SendVerificationOtpEmail",
                Instant.now(), "user-service", "phase6-request", "otp:phase6@example.test", 1,
                Map.of("to", "phase6@example.test", "name", "Phase Six", "otp", "123456", "expiresInMinutes", 5));
        String json = objectMapper.writeValueAsString(envelope);

        consumer.consume(json);
        consumer.consume(json);

        assertEquals(1, EmailResourceTest.TestMailSenderPort.sendCount);
        assertEquals("phase6@example.test", EmailResourceTest.TestMailSenderPort.sentMessage.getMailTo());
        assertEquals("Verify your Javanc account", EmailResourceTest.TestMailSenderPort.sentMessage.getMailSubject());
    }

    @Test
    void userMessageCommandSendsMailToResolvedUserEmail() throws Exception {
        var envelope = new KafkaCommandConsumer.CommandEnvelope<>("job-email-command-1", "SendUserMessageEmail",
                Instant.now(), "manager-service", "phase6-request", "email:job:33", 1,
                Map.of("userId", 33, "subject", "Job accepted", "message", "Your application was accepted"));

        consumer.consume(objectMapper.writeValueAsString(envelope));

        assertEquals(33, EmailResourceTest.TestUserLookupPort.requestedId);
        assertEquals("target@example.test", EmailResourceTest.TestMailSenderPort.sentMessage.getMailTo());
        assertEquals("Job accepted", EmailResourceTest.TestMailSenderPort.sentMessage.getMailSubject());
    }

    public static class SideEffectsEnabledProfile implements QuarkusTestProfile {
        @Override
        public Map<String, String> getConfigOverrides() {
            return Map.of("kafka.consumer.side-effects.enabled", "true");
        }
    }
}
