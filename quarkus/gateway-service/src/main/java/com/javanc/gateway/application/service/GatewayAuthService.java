package com.javanc.gateway.application.service;

import com.javanc.gateway.application.model.AuthenticatedPrincipal;
import com.javanc.gateway.application.port.TokenValidationPort;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

@ApplicationScoped
public class GatewayAuthService {

    private static final Logger LOG = Logger.getLogger(GatewayAuthService.class);
    private static final String BEARER_PREFIX = "Bearer ";

    private final TokenValidationPort tokenValidationPort;

    @Inject
    public GatewayAuthService(TokenValidationPort tokenValidationPort) {
        this.tokenValidationPort = tokenValidationPort;
    }

    public Uni<AuthenticatedPrincipal> authenticate(String authorizationHeader) {
        String token = bearerToken(authorizationHeader);
        if (token == null) {
            LOG.warn("Authorization header is missing or is not a Bearer token");
            return Uni.createFrom().item(AuthenticatedPrincipal.inactive());
        }
        return tokenValidationPort.introspect(token)
                .invoke(principal -> LOG.debugf("User-service token validation result valid=%s", principal.active()))
                .onFailure().recoverWithItem(AuthenticatedPrincipal.inactive());
    }

    public Uni<Boolean> isAuthorized(String authorizationHeader) {
        return authenticate(authorizationHeader).map(AuthenticatedPrincipal::active);
    }

    public String bearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith(BEARER_PREFIX)) {
            return null;
        }
        String token = authorizationHeader.substring(BEARER_PREFIX.length()).trim();
        return token.isEmpty() ? null : token;
    }
}
