package com.javanc.manager.infrastructure.client;

import com.javanc.manager.application.dto.MessageDTO;
import com.javanc.manager.application.port.NotificationPort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.rest.client.inject.RestClient;

@ApplicationScoped
public class NotificationServiceAdapter implements NotificationPort {

    private final NotificationClient notificationClient;

    @Inject
    public NotificationServiceAdapter(@RestClient NotificationClient notificationClient) {
        this.notificationClient = notificationClient;
    }

    @Override
    public void create(MessageDTO messageDTO) {
        notificationClient.create(messageDTO);
    }
}
