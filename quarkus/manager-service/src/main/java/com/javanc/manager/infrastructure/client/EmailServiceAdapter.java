package com.javanc.manager.infrastructure.client;

import com.javanc.manager.application.dto.MessageDTO;
import com.javanc.manager.application.port.EmailPort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.rest.client.inject.RestClient;

@ApplicationScoped
public class EmailServiceAdapter implements EmailPort {

    private final EmailClient emailClient;

    @Inject
    public EmailServiceAdapter(@RestClient EmailClient emailClient) {
        this.emailClient = emailClient;
    }

    @Override
    public void send(MessageDTO messageDTO) {
        emailClient.send(messageDTO);
    }
}
