package com.javanc.user.security;

import com.javanc.user.entity.User;
import com.javanc.user.exception.ErrorCode;
import com.javanc.user.exception.JwtServiceException;
import io.smallrye.jwt.algorithm.SignatureAlgorithm;
import io.smallrye.jwt.auth.principal.JWTParser;
import io.smallrye.jwt.auth.principal.ParseException;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.time.Clock;
import java.time.Instant;

@ApplicationScoped
public class JwtService {

    private String jwtSecret;
    private long expirationMillis;
    private Clock clock;
    private JWTParser jwtParser;

    public JwtService() {
    }

    @Inject
    public JwtService(@ConfigProperty(name = "jwt.secret") String jwtSecret,
            @ConfigProperty(name = "jwt.expiration-millis") long expirationMillis,
            Clock clock,
            JWTParser jwtParser) {
        this.jwtSecret = jwtSecret;
        this.expirationMillis = expirationMillis;
        this.clock = clock;
        this.jwtParser = jwtParser;
    }

    public String generateToken(User user) {
        return generateTokenForSubject(user.getEmail());
    }

    public String generateRefreshToken(User user) {
        return generateTokenForSubject(user.getEmail());
    }

    public String extractUsername(String token) {
        return verifyToken(token).getSubject();
    }

    public boolean isTokenValid(String token, User user) {
        if (user == null || user.getEmail() == null) {
            return false;
        }
        try {
            String username = extractUsername(token);
            return user.getEmail().equals(username) && !isTokenExpired(token);
        } catch (JwtServiceException e) {
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        try {
            return verifyToken(token).getExpirationTime() < clock.instant().getEpochSecond();
        } catch (JwtServiceException e) {
            return true;
        }
    }

    private String generateTokenForSubject(String subject) {
        String secret = requireJwtSecret();
        if (subject == null || subject.isBlank()) {
            throw new JwtServiceException(ErrorCode.JWT_INVALID);
        }
        Instant now = clock.instant();
        return Jwt.subject(subject)
                .issuedAt(now.getEpochSecond())
                .expiresAt(now.plusMillis(expirationMillis).getEpochSecond())
                .jws()
                .algorithm(SignatureAlgorithm.HS256)
                .signWithSecret(secret);
    }

    private JsonWebToken verifyToken(String token) {
        String secret = requireJwtSecret();
        if (token == null || token.isBlank()) {
            throw new JwtServiceException(ErrorCode.JWT_INVALID);
        }
        try {
            return jwtParser.verify(token.trim(), secret);
        } catch (ParseException | RuntimeException e) {
            throw new JwtServiceException(classifyJwtError(e), classifyJwtError(e).getMessage(), e);
        }
    }

    private String requireJwtSecret() {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new JwtServiceException(ErrorCode.JWT_INVALID);
        }
        return jwtSecret;
    }

    private ErrorCode classifyJwtError(Exception exception) {
        String message = exception.getMessage();
        if (message == null) {
            return ErrorCode.JWT_INVALID;
        }
        String lowerCaseMessage = message.toLowerCase();
        if (lowerCaseMessage.contains("expired")) {
            return ErrorCode.JWT_EXPIRED;
        }
        if (lowerCaseMessage.contains("malformed")) {
            return ErrorCode.JWT_MALFORMED;
        }
        return ErrorCode.JWT_INVALID;
    }
}
