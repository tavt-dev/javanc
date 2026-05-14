package com.javanc.email.infrastructure.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.javanc.email.application.exception.ApplicationException;
import com.javanc.email.application.exception.ErrorCode;
import com.javanc.email.application.port.EmailCommandIdempotencyPort;
import com.javanc.email.application.port.MailSenderPort;
import com.javanc.email.application.port.UserLookupPort;
import com.javanc.email.application.service.EmailApplicationService;
import com.javanc.email.domain.model.MailMessage;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class EmailCommandConsumerTest {

    @Test
    void processSendsDirectEmailCommand() {
        FakeMailSenderPort mailSenderPort = new FakeMailSenderPort();
        FakeIdempotencyPort idempotencyPort = new FakeIdempotencyPort();
        EmailCommandConsumer consumer = consumer(mailSenderPort, idempotencyPort);

        consumer.process("""
                {
                  "commandId": "cmd-1",
                  "correlationId": "corr-1",
                  "to": "direct@example.test",
                  "subject": "Direct subject",
                  "body": "Direct body"
                }
                """);

        assertEquals("direct@example.test", mailSenderPort.sentMessage.getMailTo());
        assertEquals("Direct subject", mailSenderPort.sentMessage.getMailSubject());
        assertEquals("Direct body", mailSenderPort.sentMessage.getMailContent());
        assertEquals("cmd-1", idempotencyPort.completedCommandId);
    }

    @Test
    void processSendsLegacyRecipientUserCommandThroughExistingLookup() {
        FakeMailSenderPort mailSenderPort = new FakeMailSenderPort();
        FakeUserLookupPort userLookupPort = new FakeUserLookupPort();
        EmailCommandConsumer consumer = consumer(userLookupPort, mailSenderPort, new FakeIdempotencyPort());

        consumer.process("""
                {
                  "commandId": "cmd-2",
                  "recipientUserId": 42,
                  "subject": "Fallback subject",
                  "body": "Message body"
                }
                """);

        assertEquals(42, userLookupPort.requestedId);
        assertEquals("target@example.test", mailSenderPort.sentMessage.getMailTo());
        assertEquals("Message body", mailSenderPort.sentMessage.getMailSubject());
        assertEquals("Message body", mailSenderPort.sentMessage.getMailContent());
    }

    @Test
    void processSkipsDuplicateCommand() {
        FakeMailSenderPort mailSenderPort = new FakeMailSenderPort();
        FakeIdempotencyPort idempotencyPort = new FakeIdempotencyPort();
        EmailCommandConsumer consumer = consumer(mailSenderPort, idempotencyPort);

        consumer.process("""
                {
                  "commandId": "cmd-3",
                  "to": "direct@example.test",
                  "subject": "Direct subject",
                  "body": "Direct body"
                }
                """);
        consumer.process("""
                {
                  "commandId": "cmd-3",
                  "to": "duplicate@example.test",
                  "subject": "Duplicate subject",
                  "body": "Duplicate body"
                }
                """);

        assertEquals(1, mailSenderPort.sendCount);
        assertEquals("direct@example.test", mailSenderPort.sentMessage.getMailTo());
    }

    @Test
    void processRejectsMissingCommandId() {
        EmailCommandConsumer consumer = consumer(new FakeMailSenderPort(), new FakeIdempotencyPort());

        ApplicationException exception = assertThrows(ApplicationException.class,
                () -> consumer.process("{\"to\":\"direct@example.test\",\"subject\":\"Subject\",\"body\":\"Body\"}"));

        assertEquals(ErrorCode.BAD_REQUEST, exception.getErrorCode());
    }

    @Test
    void processReleasesClaimWhenBusinessLogicFails() {
        FakeIdempotencyPort idempotencyPort = new FakeIdempotencyPort();
        EmailCommandConsumer consumer = consumer(new FakeUserLookupPort(), mailMessage -> {
            throw new ApplicationException(ErrorCode.MAIL_SEND_FAILED);
        }, idempotencyPort);

        ApplicationException exception = assertThrows(ApplicationException.class,
                () -> consumer.process("""
                        {
                          "commandId": "cmd-4",
                          "to": "direct@example.test",
                          "subject": "Subject",
                          "body": "Body"
                        }
                        """));

        assertEquals(ErrorCode.MAIL_SEND_FAILED, exception.getErrorCode());
        assertEquals("cmd-4", idempotencyPort.releasedCommandId);
    }

    private EmailCommandConsumer consumer(FakeMailSenderPort mailSenderPort, FakeIdempotencyPort idempotencyPort) {
        return consumer(new FakeUserLookupPort(), mailSenderPort, idempotencyPort);
    }

    private EmailCommandConsumer consumer(UserLookupPort userLookupPort, MailSenderPort mailSenderPort,
            FakeIdempotencyPort idempotencyPort) {
        return new EmailCommandConsumer(new EmailApplicationService(userLookupPort, mailSenderPort),
                idempotencyPort, new ObjectMapper());
    }

    private static class FakeUserLookupPort implements UserLookupPort {

        private Integer requestedId;

        @Override
        public String findEmailByUserId(Integer id) {
            requestedId = id;
            return "target@example.test";
        }
    }

    private static class FakeMailSenderPort implements MailSenderPort {

        private MailMessage sentMessage;
        private int sendCount;

        @Override
        public void send(MailMessage mailMessage) {
            sentMessage = mailMessage;
            sendCount++;
        }
    }

    private static class FakeIdempotencyPort implements EmailCommandIdempotencyPort {

        private final Set<String> claimed = new HashSet<>();
        private String completedCommandId;
        private String releasedCommandId;

        @Override
        public boolean claim(String commandId) {
            return claimed.add(commandId);
        }

        @Override
        public void complete(String commandId) {
            completedCommandId = commandId;
        }

        @Override
        public void release(String commandId) {
            releasedCommandId = commandId;
            claimed.remove(commandId);
        }
    }
}
