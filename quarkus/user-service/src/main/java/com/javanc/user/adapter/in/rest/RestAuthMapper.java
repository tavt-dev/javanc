package com.javanc.user.adapter.in.rest;

import com.javanc.user.adapter.in.rest.dto.AuthenticationRequest;
import com.javanc.user.adapter.in.rest.dto.AuthenticationResponse;
import com.javanc.user.adapter.in.rest.dto.UserDTO;
import com.javanc.user.application.command.SignInCommand;
import com.javanc.user.application.command.SignUpCommand;
import com.javanc.user.application.command.UpdateUserCommand;
import com.javanc.user.application.result.AuthenticationResult;
import com.javanc.user.application.result.UserResult;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class RestAuthMapper {

    public SignUpCommand toSignUpCommand(AuthenticationRequest request) {
        return new SignUpCommand(request.getName(), request.getEmail(), request.getRole(), request.getPassword(),
                request.getIdEmployee());
    }

    public SignInCommand toSignInCommand(AuthenticationRequest request) {
        return new SignInCommand(request.getEmail(), request.getPassword());
    }

    public UpdateUserCommand toUpdateCommand(String token, UserDTO userDTO) {
        return new UpdateUserCommand(token, userDTO.getId(), userDTO.getName(), userDTO.getEmail(),
                userDTO.getPassword(), userDTO.getIdEmployee(), userDTO.getRole(), userDTO.isActive());
    }

    public AuthenticationResponse toResponse(AuthenticationResult result) {
        if (result == null) {
            return null;
        }
        return new AuthenticationResponse(
                result.statusCode(),
                result.error(),
                result.message(),
                result.token(),
                result.refreshToken(),
                result.expirationTime(),
                toDto(result.user()),
                result.valid(),
                result.role());
    }

    public UserDTO toDto(UserResult result) {
        if (result == null) {
            return null;
        }
        return new UserDTO(result.id(), result.name(), result.email(), null, result.idEmployee(), result.role(),
                result.active());
    }
}
