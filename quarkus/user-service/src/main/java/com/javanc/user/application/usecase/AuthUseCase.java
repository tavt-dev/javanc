package com.javanc.user.application.usecase;

import com.javanc.user.application.command.RefreshTokenCommand;
import com.javanc.user.application.command.SignInCommand;
import com.javanc.user.application.command.SignUpCommand;
import com.javanc.user.application.result.AuthenticationResult;
import com.javanc.user.domain.model.EmailAddress;
import com.javanc.user.domain.model.EmployeeId;
import com.javanc.user.domain.model.PasswordHash;
import com.javanc.user.domain.model.Role;
import com.javanc.user.domain.model.User;
import com.javanc.user.domain.port.IdGenerator;
import com.javanc.user.domain.port.PasswordHasher;
import com.javanc.user.domain.port.TokenService;
import com.javanc.user.domain.port.UserRepository;
import com.javanc.user.shared.exception.JwtServiceException;
import com.javanc.user.shared.exception.UserNotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class AuthUseCase {

    private final UserRepository userRepository;
    private final TokenService tokenService;
    private final PasswordHasher passwordHasher;
    private final IdGenerator idGenerator;

    @Inject
    public AuthUseCase(UserRepository userRepository, TokenService tokenService, PasswordHasher passwordHasher,
            IdGenerator idGenerator) {
        this.userRepository = userRepository;
        this.tokenService = tokenService;
        this.passwordHasher = passwordHasher;
        this.idGenerator = idGenerator;
    }

    @Transactional
    public AuthenticationResult signUp(SignUpCommand command) {
        EmailAddress email = new EmailAddress(command.email());
        if (userRepository.findByEmail(email).isPresent()) {
            return response(409, "Email already exists", false);
        }

        User user = new User(
                idGenerator.nextUserId(),
                command.name(),
                email,
                new EmployeeId(command.idEmployee()),
                passwordHasher.hash(command.password()),
                true,
                Role.fromNullable(command.role()));

        userRepository.save(user);

        AuthenticationResult response = response(200, "User Saved Successfully", true);
        response.setUser(UserResultMapper.toResult(user));
        return response;
    }

    public AuthenticationResult signIn(SignInCommand command) {
        EmailAddress email = new EmailAddress(command.email());
        return userRepository.findByEmail(email)
                .map(user -> signInExistingUser(user, command.password()))
                .orElseGet(() -> response(404, "Email not found", false));
    }

    public AuthenticationResult refreshToken(RefreshTokenCommand command) {
        String email = tokenService.extractSubject(command.token());
        User user = loadByEmail(email);

        AuthenticationResult response = response(200, "Successfully Refreshed Token", false);
        response.setToken(tokenService.generateAccessToken(user));
        response.setRefreshToken(command.token());
        response.setExpirationTime("24Hr");
        return response;
    }

    public AuthenticationResult validateToken(String token) {
        try {
            String email = tokenService.extractSubject(token);
            User user = loadByEmail(email);
            if (tokenService.isTokenValid(token, user)) {
                AuthenticationResult response = new AuthenticationResult();
                response.setValid(true);
                response.setRole(user.role() == null ? null : user.role().name());
                return response;
            }
        } catch (JwtServiceException | UserNotFoundException e) {
            return invalidTokenResponse();
        }
        return invalidTokenResponse();
    }

    private AuthenticationResult signInExistingUser(User user, String rawPassword) {
        PasswordHash passwordHash = user.passwordHash();
        if (!passwordHasher.matches(rawPassword, passwordHash)) {
            return response(401, "Invalid credentials", false);
        }

        AuthenticationResult response = response(200, "Successfully Signed In", true);
        response.setToken(tokenService.generateAccessToken(user));
        response.setRefreshToken(tokenService.generateRefreshToken(user));
        response.setExpirationTime("24Hr");
        response.setRole(user.role() == null ? null : user.role().name());
        response.setUser(UserResultMapper.toResult(user));
        return response;
    }

    private User loadByEmail(String email) {
        return userRepository.findByEmail(new EmailAddress(email))
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));
    }

    private AuthenticationResult invalidTokenResponse() {
        AuthenticationResult response = new AuthenticationResult();
        response.setValid(false);
        return response;
    }

    private AuthenticationResult response(int statusCode, String message, boolean valid) {
        AuthenticationResult response = new AuthenticationResult();
        response.setStatusCode(statusCode);
        response.setMessage(message);
        response.setValid(valid);
        return response;
    }
}
