package com.javanc.email.application.service;

import com.javanc.email.application.dto.MessageDTO;
import com.javanc.email.application.exception.ApplicationException;
import com.javanc.email.application.exception.ErrorCode;
import com.javanc.email.application.port.MailSenderPort;
import com.javanc.email.application.port.UserLookupPort;
import com.javanc.email.domain.model.MailMessage;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class EmailApplicationServiceTest {

    @Test
    void sendLooksUpUserAndBuildsCompatibleMailMessage() {
        FakeUserLookupPort userLookupPort = new FakeUserLookupPort();
        FakeMailSenderPort mailSenderPort = new FakeMailSenderPort();
        EmailApplicationService service = new EmailApplicationService(userLookupPort, mailSenderPort);

        service.send(new MessageDTO("accept job successful byjava", 12));

        assertEquals(12, userLookupPort.requestedId);
        assertEquals("target@example.test", mailSenderPort.sentMessage.getMailTo());
        assertEquals("accept job successful byjava", mailSenderPort.sentMessage.getMailSubject());
        assertEquals("accept job successful byjava", mailSenderPort.sentMessage.getMailContent());
        assertEquals("text/plain", mailSenderPort.sentMessage.getContentType());
    }

    @Test
    void sendRejectsNullBodyWithBadRequestError() {
        EmailApplicationService service = new EmailApplicationService(new FakeUserLookupPort(), new FakeMailSenderPort());

        ApplicationException exception = assertThrows(ApplicationException.class, () -> service.send(null));

        assertEquals(ErrorCode.BAD_REQUEST, exception.getErrorCode());
    }

    @Test
    void sendPropagatesMailFailure() {
        EmailApplicationService service = new EmailApplicationService(new FakeUserLookupPort(), mailMessage -> {
            throw new ApplicationException(ErrorCode.MAIL_SEND_FAILED);
        });

        ApplicationException exception = assertThrows(ApplicationException.class,
                () -> service.send(new MessageDTO("message", 1)));

        assertEquals(ErrorCode.MAIL_SEND_FAILED, exception.getErrorCode());
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

        @Override
        public void send(MailMessage mailMessage) {
            sentMessage = mailMessage;
        }
    }
}
