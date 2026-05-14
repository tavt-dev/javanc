package com.javanc.email.application.service;

import com.javanc.email.application.dto.MessageDTO;
import com.javanc.email.application.dto.VerificationOtpEmailDTO;
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

    @Test
    void verificationOtpBuildsModernHtmlTemplate() {
        FakeMailSenderPort mailSenderPort = new FakeMailSenderPort();
        EmailApplicationService service = new EmailApplicationService(new FakeUserLookupPort(), mailSenderPort);
        VerificationOtpEmailDTO request = new VerificationOtpEmailDTO();
        request.setTo(" verify@example.test ");
        request.setName("Verify <User>");
        request.setOtp("123456");
        request.setExpiresInMinutes(10);

        service.sendVerificationOtp(request);

        assertEquals("verify@example.test", mailSenderPort.sentMessage.getMailTo());
        assertEquals("Verify your Javanc account", mailSenderPort.sentMessage.getMailSubject());
        assertEquals("text/html", mailSenderPort.sentMessage.getContentType());
        assertEquals(true, mailSenderPort.sentMessage.getMailContent().contains("<!doctype html>"));
        assertEquals(true, mailSenderPort.sentMessage.getMailContent().contains("Verify your email"));
        assertEquals(true, mailSenderPort.sentMessage.getMailContent().contains("123456"));
        assertEquals(true, mailSenderPort.sentMessage.getMailContent().contains("10 minutes"));
        assertEquals(true, mailSenderPort.sentMessage.getMailContent().contains("Verify &lt;User&gt;"));
    }

    @Test
    void passwordResetOtpBuildsResetTemplate() {
        FakeMailSenderPort mailSenderPort = new FakeMailSenderPort();
        EmailApplicationService service = new EmailApplicationService(new FakeUserLookupPort(), mailSenderPort);
        VerificationOtpEmailDTO request = new VerificationOtpEmailDTO();
        request.setTo(" reset@example.test ");
        request.setName("Reset <User>");
        request.setOtp("654321");
        request.setExpiresInMinutes(10);

        service.sendPasswordResetOtp(request);

        assertEquals("reset@example.test", mailSenderPort.sentMessage.getMailTo());
        assertEquals("Reset your Javanc password", mailSenderPort.sentMessage.getMailSubject());
        assertEquals("text/html", mailSenderPort.sentMessage.getContentType());
        assertEquals(true, mailSenderPort.sentMessage.getMailContent().contains("Reset your password"));
        assertEquals(true, mailSenderPort.sentMessage.getMailContent().contains("654321"));
        assertEquals(true, mailSenderPort.sentMessage.getMailContent().contains("Reset &lt;User&gt;"));
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
