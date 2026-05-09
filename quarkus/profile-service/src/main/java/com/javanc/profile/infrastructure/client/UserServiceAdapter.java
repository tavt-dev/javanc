package com.javanc.profile.infrastructure.client;

import com.javanc.profile.application.port.UserLookupPort;
import com.javanc.profile.interfaces.rest.dto.ApiResponse;
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
}
