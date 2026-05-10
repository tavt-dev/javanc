package com.javanc.gateway.application.service;

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

    public Uni<Boolean> isAuthorized(String authorizationHeader) {
        String token = bearerToken(authorizationHeader);
        if (token == null) {
            LOG.warn("Authorization header is missing or is not a Bearer token");
            return Uni.createFrom().item(false);
        }
        return tokenValidationPort.isValid(token)
                .invoke(valid -> LOG.debugf("User-service token validation result valid=%s", valid))
                .onFailure().recoverWithItem(false);
    }

    public String bearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith(BEARER_PREFIX)) {
            return null;
        }
        String token = authorizationHeader.substring(BEARER_PREFIX.length()).trim();
        return token.isEmpty() ? null : token;
    }
}
