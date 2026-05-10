package com.javanc.user.adapter.in.rest;

import com.javanc.user.adapter.in.rest.dto.AuthSession;
import com.javanc.user.adapter.in.rest.dto.ChangeUserRoleRequest;
import com.javanc.user.adapter.in.rest.dto.ChangeUserStatusRequest;
import com.javanc.user.adapter.in.rest.dto.CreateUserAccountRequest;
import com.javanc.user.adapter.in.rest.dto.LoginRequest;
import com.javanc.user.adapter.in.rest.dto.RegistrationPending;
import com.javanc.user.adapter.in.rest.dto.ResendVerificationOtpRequest;
import com.javanc.user.adapter.in.rest.dto.RegisterRequest;
import com.javanc.user.adapter.in.rest.dto.TokenIntrospection;
import com.javanc.user.adapter.in.rest.dto.UpdateUserRequest;
import com.javanc.user.adapter.in.rest.dto.UserDTO;
import com.javanc.user.adapter.in.rest.dto.VerifyEmailRequest;
import com.javanc.user.application.command.ChangeUserRoleCommand;
import com.javanc.user.application.command.ChangeUserStatusCommand;
import com.javanc.user.application.command.CreateUserAccountCommand;
import com.javanc.user.application.command.LoginCommand;
import com.javanc.user.application.command.ResendVerificationOtpCommand;
import com.javanc.user.application.command.RegisterUserCommand;
import com.javanc.user.application.command.UpdateUserProfileCommand;
import com.javanc.user.application.command.VerifyEmailCommand;
import com.javanc.user.application.result.AuthSessionResult;
import com.javanc.user.application.result.RegistrationPendingResult;
import com.javanc.user.application.result.TokenIntrospectionResult;
import com.javanc.user.application.result.UserResult;
import com.javanc.user.shared.exception.ApplicationException;
import com.javanc.user.shared.exception.ErrorCode;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class RestAuthMapper {

    public RegisterUserCommand toCommand(RegisterRequest request) {
        requireRequest(request);
        if (request.role != null || request.employeeId != null) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, "Public registration cannot assign role or employeeId");
        }
        return new RegisterUserCommand(request.name, request.email, request.password);
    }

    public LoginCommand toCommand(LoginRequest request) {
        requireRequest(request);
        return new LoginCommand(request.email, request.password);
    }

    public VerifyEmailCommand toCommand(VerifyEmailRequest request) {
        requireRequest(request);
        return new VerifyEmailCommand(request.email, request.otp);
    }

    public ResendVerificationOtpCommand toCommand(ResendVerificationOtpRequest request) {
        requireRequest(request);
        return new ResendVerificationOtpCommand(request.email);
    }

    public UpdateUserProfileCommand toCommand(String token, Integer userId, UpdateUserRequest request) {
        requireRequest(request);
        if (request.role != null || request.active != null) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, "Use dedicated role or status endpoints");
        }
        return new UpdateUserProfileCommand(token, userId, request.name, request.email, request.password,
                request.employeeId);
    }

    public ChangeUserStatusCommand toCommand(String token, Integer userId, ChangeUserStatusRequest request) {
        requireRequest(request);
        return new ChangeUserStatusCommand(token, userId, request.active, request.status);
    }

    public ChangeUserRoleCommand toCommand(String token, Integer userId, ChangeUserRoleRequest request) {
        requireRequest(request);
        return new ChangeUserRoleCommand(token, userId, request.role);
    }

    public CreateUserAccountCommand toCommand(String token, CreateUserAccountRequest request) {
        requireRequest(request);
        return new CreateUserAccountCommand(token, request.name, request.email, request.password,
                request.employeeId, request.role);
    }

    public AuthSession toDto(AuthSessionResult result) {
        return new AuthSession(result.accessToken(), result.refreshToken(), result.tokenType(),
                result.expiresInSeconds(), toDto(result.user()));
    }

    public RegistrationPending toDto(RegistrationPendingResult result) {
        return new RegistrationPending(result.email(), result.status(), result.expiresInSeconds());
    }

    public TokenIntrospection toDto(TokenIntrospectionResult result) {
        return new TokenIntrospection(result.active(), result.subject(), result.userId(), result.role(),
                result.expiresAt());
    }

    public UserDTO toDto(UserResult result) {
        if (result == null) {
            return null;
        }
        return new UserDTO(result.id(), result.name(), result.email(), null, result.idEmployee(), result.role(),
                result.active(), result.status());
    }

    private void requireRequest(Object request) {
        if (request == null) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST);
        }
    }
}
