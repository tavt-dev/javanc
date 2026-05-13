package com.javanc.gateway.application.service;

import com.javanc.gateway.application.port.TokenValidationPort;
import io.smallrye.mutiny.Uni;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GatewayAuthServiceTest {

    @Test
    void extractsBearerTokenSafely() {
        GatewayAuthService service = new GatewayAuthService(token -> Uni.createFrom().item(true));

        assertEquals("abc", service.bearerToken("Bearer abc"));
        assertFalse(service.isAuthorized("Basic abc").await().indefinitely());
        assertFalse(service.isAuthorized("Bearer ").await().indefinitely());
        assertFalse(service.isAuthorized(null).await().indefinitely());
    }

    @Test
    void treatsValidationFailureAsUnauthorized() {
        TokenValidationPort failingPort = token -> Uni.createFrom().failure(new RuntimeException("user down"));
        GatewayAuthService service = new GatewayAuthService(failingPort);

        assertFalse(service.isAuthorized("Bearer abc").await().indefinitely());
    }

    @Test
    void delegatesRawTokenToValidationPort() {
        RecordingPort port = new RecordingPort();
        GatewayAuthService service = new GatewayAuthService(port);

        assertTrue(service.isAuthorized("Bearer valid").await().indefinitely());
        assertEquals("valid", port.token);
    }

    private static class RecordingPort implements TokenValidationPort {
        private String token;

        @Override
        public Uni<Boolean> isValid(String token) {
            this.token = token;
            return Uni.createFrom().item(true);
        }
    }
}
