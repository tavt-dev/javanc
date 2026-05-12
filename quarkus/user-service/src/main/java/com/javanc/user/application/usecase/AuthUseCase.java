package com.javanc.user.application.usecase;

import com.javanc.user.application.command.LoginCommand;
import com.javanc.user.application.command.RefreshSessionCommand;
import com.javanc.user.application.command.ResendVerificationOtpCommand;
import com.javanc.user.application.command.RegisterUserCommand;
import com.javanc.user.application.command.VerifyEmailCommand;
import com.javanc.user.application.result.AuthSessionResult;
import com.javanc.user.application.result.RegistrationPendingResult;
import com.javanc.user.application.result.TokenClaims;
import com.javanc.user.application.result.TokenIntrospectionResult;
import com.javanc.user.domain.model.AccountStatus;
import com.javanc.user.domain.model.EmailAddress;
import com.javanc.user.domain.model.EmailVerificationOtp;
import com.javanc.user.domain.model.Role;
import com.javanc.user.domain.model.TokenType;
import com.javanc.user.domain.model.User;
import com.javanc.user.domain.port.EmailVerificationNotifier;
import com.javanc.user.domain.port.EmailVerificationOtpRepository;
import com.javanc.user.domain.port.OtpGenerator;
import com.javanc.user.domain.port.OtpHasher;
import com.javanc.user.domain.port.PasswordHasher;
import com.javanc.user.domain.port.TokenService;
import com.javanc.user.domain.port.UserRepository;
import com.javanc.user.shared.exception.ApplicationException;
import com.javanc.user.shared.exception.ErrorCode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

@ApplicationScoped
public class AuthUseCase {

    private final UserRepository userRepository;
    private final EmailVerificationOtpRepository otpRepository;
    private final TokenService tokenService;
    private final PasswordHasher passwordHasher;
    private final OtpGenerator otpGenerator;
    private final OtpHasher otpHasher;
    private final EmailVerificationNotifier verificationNotifier;
    private final Clock clock;
    private final int otpLength;
    private final long otpTtlSeconds;
    private final int otpMaxAttempts;
    private final long resendCooldownSeconds;

    @Inject
    public AuthUseCase(UserRepository userRepository, EmailVerificationOtpRepository otpRepository,
            TokenService tokenService, PasswordHasher passwordHasher, OtpGenerator otpGenerator, OtpHasher otpHasher,
            EmailVerificationNotifier verificationNotifier, Clock clock,
            @ConfigProperty(name = "otp.verification.length") int otpLength,
            @ConfigProperty(name = "otp.verification.ttl-seconds") long otpTtlSeconds,
            @ConfigProperty(name = "otp.verification.max-attempts") int otpMaxAttempts,
            @ConfigProperty(name = "otp.verification.resend-cooldown-seconds") long resendCooldownSeconds) {
        this.userRepository = userRepository;
        this.otpRepository = otpRepository;
        this.tokenService = tokenService;
        this.passwordHasher = passwordHasher;
        this.otpGenerator = otpGenerator;
        this.otpHasher = otpHasher;
        this.verificationNotifier = verificationNotifier;
        this.clock = clock;
        this.otpLength = otpLength;
        this.otpTtlSeconds = otpTtlSeconds;
        this.otpMaxAttempts = otpMaxAttempts;
        this.resendCooldownSeconds = resendCooldownSeconds;
    }

    @Transactional
    public RegistrationPendingResult register(RegisterUserCommand command) {
        requirePassword(command.password());
        EmailAddress email = email(command.email());
        if (userRepository.findByEmail(email).isPresent()) {
            throw new ApplicationException(ErrorCode.USER_ALREADY_EXISTS);
        }

        User user = User.registerPending(required(command.name(), "Name is required"), email,
                passwordHasher.hash(command.password()));
        User saved = userRepository.save(user);
        createAndSendOtp(saved);
        return new RegistrationPendingResult(saved.email().value(), saved.status().name(), otpTtlSeconds);
    }

    @Transactional
    public AuthSessionResult verifyEmail(VerifyEmailCommand command) {
        EmailAddress email = email(command.email());
        String otp = required(command.otp(), "OTP is required");
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApplicationException(ErrorCode.BAD_REQUEST, "Invalid verification code"));
        if (user.status() == AccountStatus.ACTIVE) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, "Email already verified");
        }
        if (user.status() != AccountStatus.PENDING_VERIFICATION) {
            throw new ApplicationException(ErrorCode.FORBIDDEN, "User is inactive");
        }

        EmailVerificationOtp verificationOtp = otpRepository.findLatestOpenByEmail(email)
                .orElseThrow(() -> new ApplicationException(ErrorCode.BAD_REQUEST, "Invalid verification code"));
        Instant now = clock.instant();
        if (verificationOtp.expired(now)) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, "Verification code expired");
        }
        if (verificationOtp.attemptsExceeded()) {
            throw new ApplicationException(ErrorCode.FORBIDDEN, "Verification attempts exceeded");
        }
        if (!otpHasher.matches(email, otp, verificationOtp.otpHash())) {
            otpRepository.save(verificationOtp.incrementAttempts());
            throw new ApplicationException(ErrorCode.BAD_REQUEST, "Invalid verification code");
        }

        otpRepository.save(verificationOtp.consume(now));
        user.verifyEmail();
        return session(userRepository.save(user));
    }

    @Transactional
    public void resendVerificationOtp(ResendVerificationOtpCommand command) {
        EmailAddress email;
        try {
            email = email(command.email());
        } catch (ApplicationException exception) {
            return;
        }
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || user.status() != AccountStatus.PENDING_VERIFICATION) {
            return;
        }

        Instant now = clock.instant();
        otpRepository.findLatestOpenByEmail(email).ifPresent(existing -> {
            if (Duration.between(existing.lastSentAt(), now).getSeconds() < resendCooldownSeconds) {
                throw new ApplicationException(ErrorCode.TOO_MANY_REQUESTS, "Please wait before requesting another OTP");
            }
        });
        otpRepository.consumeOpenOtps(email);
        createAndSendOtp(user);
    }

    public AuthSessionResult login(LoginCommand command) {
        EmailAddress email = email(command.email());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApplicationException(ErrorCode.UNAUTHORIZED, "Invalid email or password"));
        if (!passwordHasher.matches(command.password(), user.passwordHash())) {
            throw new ApplicationException(ErrorCode.UNAUTHORIZED, "Invalid email or password");
        }
        if (user.status() == AccountStatus.PENDING_VERIFICATION) {
            throw new ApplicationException(ErrorCode.FORBIDDEN, "Email verification required");
        }
        if (!user.active()) {
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

    private void createAndSendOtp(User user) {
        Instant now = clock.instant();
        String otp = otpGenerator.generate(otpLength);
        EmailVerificationOtp verificationOtp = EmailVerificationOtp.create(user.id(), user.email(),
                otpHasher.hash(user.email(), otp), now, now.plusSeconds(otpTtlSeconds), otpMaxAttempts);
        otpRepository.save(verificationOtp);
        verificationNotifier.sendOtp(user.email().value(), user.name(), otp, Math.max(1, otpTtlSeconds / 60));
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
