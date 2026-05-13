package com.javanc.email.infrastructure.client;

import com.javanc.email.application.dto.ApiResponse;
import com.javanc.email.application.dto.UserDTO;
import com.javanc.email.application.exception.ApplicationException;
import com.javanc.email.application.exception.ErrorCode;
import com.javanc.email.application.port.UserLookupPort;
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
    public String findEmailByUserId(Integer id) {
        ApiResponse<UserDTO> response = userClient.findById(id);
        if (response == null || response.getData() == null) {
            throw new ApplicationException(ErrorCode.USER_NOT_FOUND);
        }
        String email = response.getData().getEmail();
        if (email == null || email.isBlank()) {
            throw new ApplicationException(ErrorCode.USER_EMAIL_NOT_FOUND);
        }
        return email;
    }
}
