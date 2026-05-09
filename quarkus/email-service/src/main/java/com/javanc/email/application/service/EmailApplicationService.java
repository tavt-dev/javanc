package com.javanc.email.application.service;

import com.javanc.email.application.dto.MailDTO;
import com.javanc.email.application.dto.MessageDTO;
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

    private MailMessage toMailMessage(MailDTO mailDTO) {
        return new MailMessage(null, mailDTO.getMailTo(), mailDTO.getMailSubject(), mailDTO.getMailContent(),
                TEXT_PLAIN);
    }
}
