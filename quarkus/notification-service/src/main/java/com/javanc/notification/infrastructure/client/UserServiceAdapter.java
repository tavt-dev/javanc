package com.javanc.notification.infrastructure.client;

import com.javanc.notification.application.port.UserLookupPort;
import com.javanc.notification.interfaces.rest.dto.ApiResponse;
import com.javanc.notification.interfaces.rest.dto.UserDTO;
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
    public boolean checkUserId(Integer id) {
        ApiResponse<Boolean> response = userClient.checkId(id);
        return response != null && Boolean.TRUE.equals(response.getData());
    }

    @Override
    public UserDTO getCurrentUser() {
        ApiResponse<UserDTO> response = userClient.getCurrentUser();
        return response == null ? null : response.getData();
    }
}
