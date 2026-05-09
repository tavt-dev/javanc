package com.javanc.manager.infrastructure.client;

import com.javanc.manager.application.dto.ApiResponse;
import com.javanc.manager.application.dto.AuthenticationRequest;
import com.javanc.manager.application.dto.AuthenticationResponse;
import com.javanc.manager.application.exception.ApplicationException;
import com.javanc.manager.application.exception.ErrorCode;
import com.javanc.manager.application.port.UserAccountPort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.rest.client.inject.RestClient;

@ApplicationScoped
public class UserServiceAdapter implements UserAccountPort {

    private final UserClient userClient;

    @Inject
    public UserServiceAdapter(@RestClient UserClient userClient) {
        this.userClient = userClient;
    }

    @Override
    public Integer signUp(AuthenticationRequest authenticationRequest) {
        ApiResponse<AuthenticationResponse> response = userClient.signUp(authenticationRequest);
        if (response == null || response.data == null || response.data.user == null) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST);
        }
        return response.data.user.id;
    }
}
