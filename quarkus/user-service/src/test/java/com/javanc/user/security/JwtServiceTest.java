package com.javanc.user.security;

import com.javanc.user.entity.Role;
import com.javanc.user.entity.User;
import com.javanc.user.exception.JwtServiceException;
import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.jwt.auth.principal.JWTParser;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
class JwtServiceTest {

    private static final String TEST_SECRET = "test-secret-key-with-at-least-32-bytes-1234567890";

    @Inject
    JwtService jwtService;

    @Inject
    JWTParser jwtParser;

    @Test
    void generatedTokenCanBeParsedWithEmailSubject() {
        User user = user("jwt.subject@example.com");

        String token = jwtService.generateToken(user);

        assertNotNull(token);
        assertEquals("jwt.subject@example.com", jwtService.extractUsername(token));
        assertTrue(jwtService.isTokenValid(token, user));
    }

    @Test
    void refreshTokenUsesSameValidationContract() {
        User user = user("jwt.refresh@example.com");

        String token = jwtService.generateRefreshToken(user);

        assertNotNull(token);
        assertTrue(jwtService.isTokenValid(token, user));
    }

    @Test
    void tokenForDifferentSubjectIsRejected() {
        String token = jwtService.generateToken(user("jwt.owner@example.com"));

        assertFalse(jwtService.isTokenValid(token, user("jwt.other@example.com")));
    }

    @Test
    void invalidMalformedExpiredAndWrongSignatureTokensAreRejected() {
        User user = user("jwt.invalid@example.com");
        String token = jwtService.generateToken(user);
        JwtService wrongSecretService = new JwtService("different-test-secret-with-at-least-32-bytes",
                86400000, Clock.systemUTC(), jwtParser);
        JwtService expiredService = new JwtService(TEST_SECRET, 1,
                Clock.fixed(Instant.parse("2020-01-01T00:00:00Z"), ZoneOffset.UTC), jwtParser);
        String expiredToken = expiredService.generateToken(user);

        assertFalse(jwtService.isTokenValid("not-a-jwt", user));
        assertFalse(wrongSecretService.isTokenValid(token, user));
        assertFalse(jwtService.isTokenValid(expiredToken, user));
        assertTrue(jwtService.isTokenExpired(expiredToken));
    }

    @Test
    void blankJwtSecretDoesNotGenerateToken() {
        JwtService blankSecretService = new JwtService("", 86400000, Clock.systemUTC(), jwtParser);

        assertThrows(JwtServiceException.class, () -> blankSecretService.generateToken(user("jwt.blank@example.com")));
    }

    private User user(String email) {
        return new User(1, "JWT User", email, "EMP-JWT", "encoded", true, Role.user);
    }
}
