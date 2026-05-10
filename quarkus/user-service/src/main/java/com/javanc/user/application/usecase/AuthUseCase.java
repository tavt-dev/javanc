package com.javanc.user.application.usecase;

import com.javanc.user.application.command.LoginCommand;
import com.javanc.user.application.command.RefreshSessionCommand;
import com.javanc.user.application.command.RegisterUserCommand;
import com.javanc.user.application.result.AuthSessionResult;
import com.javanc.user.application.result.TokenClaims;
import com.javanc.user.application.result.TokenIntrospectionResult;
import com.javanc.user.domain.model.EmailAddress;
import com.javanc.user.domain.model.Role;
import com.javanc.user.domain.model.TokenType;
import com.javanc.user.domain.model.User;
import com.javanc.user.domain.port.PasswordHasher;
import com.javanc.user.domain.port.TokenService;
import com.javanc.user.domain.port.UserRepository;
import com.javanc.user.shared.exception.ApplicationException;
import com.javanc.user.shared.exception.ErrorCode;
import com.javanc.user.shared.exception.JwtServiceException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class AuthUseCase {

    private final UserRepository userRepository;
    private final TokenService tokenService;
    private final PasswordHasher passwordHasher;

    @Inject
    public AuthUseCase(UserRepository userRepository, TokenService tokenService, PasswordHasher passwordHasher) {
        this.userRepository = userRepository;
        this.tokenService = tokenService;
        this.passwordHasher = passwordHasher;
    }

    @Transactional
    public AuthSessionResult register(RegisterUserCommand command) {
        requirePassword(command.password());
        EmailAddress email = email(command.email());
        if (userRepository.findByEmail(email).isPresent()) {
            throw new ApplicationException(ErrorCode.USER_ALREADY_EXISTS);
        }

        User user = new User(
                null,
                required(command.name(), "Name is required"),
                email,
                null,
                passwordHasher.hash(command.password()),
                true,
                Role.user);

        return session(userRepository.save(user));
    }

    public AuthSessionResult login(LoginCommand command) {
        EmailAddress email = email(command.email());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApplicationException(ErrorCode.UNAUTHORIZED, "Invalid email or password"));
        if (!user.active() || !passwordHasher.matches(command.password(), user.passwordHash())) {
            throw new ApplicationException(ErrorCode.UNAUTHORIZED, "Invalid email or password");
        }
        return session(user);
    }

    public AuthSessionResult refresh(RefreshSessionCommand command) {
        TokenClaims claims = tokenService.validate(command.refreshToken(), TokenType.refresh);
        User user = userRepository.findByEmail(new EmailAddress(claims.subject()))
                .orElseThrow(() -> new ApplicationException(ErrorCode.UNAUTHORIZED));
        requireActive(user);
        return session(user);
    }

    public TokenIntrospectionResult introspect(String token) {
        try {
            TokenClaims claims = tokenService.validate(token, TokenType.access);
            User user = userRepository.findByEmail(new EmailAddress(claims.subject())).orElse(null);
            if (user == null || !user.active()) {
                return TokenIntrospectionResult.inactive();
            }
            return new TokenIntrospectionResult(true, claims.subject(), user.id().value(),
                    user.role().name(), claims.expiresAt());
        } catch (RuntimeException exception) {
            return TokenIntrospectionResult.inactive();
        }
    }

    public void logout(String token) {
        tokenService.validate(token, TokenType.access);
    }

    private AuthSessionResult session(User user) {
        requireActive(user);
        return new AuthSessionResult(
                tokenService.generateAccessToken(user),
                tokenService.generateRefreshToken(user),
                "Bearer",
                tokenService.accessExpiresInSeconds(),
                UserResultMapper.toResult(user));
    }

    private void requireActive(User user) {
        if (user == null || !user.active()) {
            throw new ApplicationException(ErrorCode.FORBIDDEN, "User is inactive");
        }
    }

    private EmailAddress email(String value) {
        try {
            return new EmailAddress(value);
        } catch (IllegalArgumentException exception) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, exception.getMessage());
        }
    }

    private String required(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, message);
        }
        return value.trim();
    }

    private void requirePassword(String password) {
        if (password == null || password.length() < 8
                || !password.matches(".*[A-Z].*")
                || !password.matches(".*[a-z].*")
                || !password.matches(".*\\d.*")) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST,
                    "Password must be at least 8 characters and include upper, lower, and digit");
        }
    }
}
