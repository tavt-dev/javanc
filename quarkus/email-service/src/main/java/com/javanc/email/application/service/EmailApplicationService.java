package com.javanc.email.application.service;

import com.javanc.email.application.dto.MailDTO;
import com.javanc.email.application.dto.MessageDTO;
import com.javanc.email.application.dto.VerificationOtpEmailDTO;
import com.javanc.email.application.exception.ApplicationException;
import com.javanc.email.application.exception.ErrorCode;
import com.javanc.email.application.port.MailSenderPort;
import com.javanc.email.application.port.UserLookupPort;
import com.javanc.email.domain.model.MailMessage;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class EmailApplicationService {

    private static final String TEXT_PLAIN = "text/plain";

    private final UserLookupPort userLookupPort;
    private final MailSenderPort mailSenderPort;

    @Inject
    public EmailApplicationService(UserLookupPort userLookupPort, MailSenderPort mailSenderPort) {
        this.userLookupPort = userLookupPort;
        this.mailSenderPort = mailSenderPort;
    }

    public void send(MessageDTO messageDTO) {
        if (messageDTO == null) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST);
        }
        String mailTo = userLookupPort.findEmailByUserId(messageDTO.getId());
        MailDTO mailDTO = new MailDTO(mailTo, messageDTO.getMessage(), messageDTO.getMessage());
        mailSenderPort.send(toMailMessage(mailDTO));
    }

    public void sendVerificationOtp(VerificationOtpEmailDTO request) {
        if (request == null || blank(request.getTo()) || blank(request.getOtp()) || request.getExpiresInMinutes() <= 0) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST);
        }
        String name = blank(request.getName()) ? "there" : request.getName().trim();
        String subject = "Verify your Javanc account";
        String content = """
                Hello %s,

                Your verification code is: %s

                This code expires in %d minutes. If you did not create an account, you can ignore this email.
                """.formatted(name, request.getOtp().trim(), request.getExpiresInMinutes());
        mailSenderPort.send(toMailMessage(new MailDTO(request.getTo().trim(), subject, content)));
    }

    private MailMessage toMailMessage(MailDTO mailDTO) {
        return new MailMessage(null, mailDTO.getMailTo(), mailDTO.getMailSubject(), mailDTO.getMailContent(),
                TEXT_PLAIN);
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
