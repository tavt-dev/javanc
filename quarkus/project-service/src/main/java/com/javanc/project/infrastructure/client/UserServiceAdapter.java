package com.javanc.project.infrastructure.client;

import com.javanc.project.application.dto.UserDTO;
import com.javanc.project.application.port.UserLookupPort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.rest.client.inject.RestClient;

@ApplicationScoped
public class UserServiceAdapter implements UserLookupPort {

    private final UserClient userClient;

    @Inject
    public UserServiceAdapter(@RestClient UserClient userClient) {
        this.userClient = userClient;
    }

    @Override
    public UserDTO getCurrentUser() {
        return userClient.getCurrentUser().getData();
    }
}
