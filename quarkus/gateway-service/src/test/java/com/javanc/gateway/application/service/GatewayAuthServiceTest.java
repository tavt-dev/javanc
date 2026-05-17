package com.javanc.gateway.application.service;

import com.javanc.gateway.application.model.AuthenticatedPrincipal;
import com.javanc.gateway.application.port.TokenValidationPort;
import io.smallrye.mutiny.Uni;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GatewayAuthServiceTest {

    @Test
    void extractsBearerTokenSafely() {
        GatewayAuthService service = new GatewayAuthService(
                token -> Uni.createFrom().item(new AuthenticatedPrincipal(true, 1, "user")));

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
        assertEquals(7, service.authenticate("Bearer valid").await().indefinitely().userId());
    }

    private static class RecordingPort implements TokenValidationPort {
        private String token;

        @Override
        public Uni<AuthenticatedPrincipal> introspect(String token) {
            this.token = token;
            return Uni.createFrom().item(new AuthenticatedPrincipal(true, 7, "user"));
        }
    }
}
