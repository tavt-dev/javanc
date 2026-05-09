package com.javanc.email.application.port;

import com.javanc.email.domain.model.MailMessage;

public interface MailSenderPort {

    void send(MailMessage mailMessage);
}
