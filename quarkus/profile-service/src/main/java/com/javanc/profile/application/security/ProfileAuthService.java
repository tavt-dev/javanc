package com.javanc.profile.application.security;

import com.javanc.profile.application.exception.ApplicationException;
import com.javanc.profile.application.exception.ErrorCode;
import com.javanc.profile.infrastructure.client.TokenIntrospectionClient;
import com.javanc.profile.interfaces.rest.dto.ApiResponse;
import com.javanc.profile.interfaces.rest.dto.TokenIntrospection;
import com.javanc.profile.interfaces.rest.dto.TokenIntrospectionRequest;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.rest.client.inject.RestClient;

@ApplicationScoped
public class ProfileAuthService {

    private final TokenIntrospectionClient tokenIntrospectionClient;

    @Inject
    public ProfileAuthService(@RestClient TokenIntrospectionClient tokenIntrospectionClient) {
        this.tokenIntrospectionClient = tokenIntrospectionClient;
    }

    public CurrentUser authenticate(String authorizationHeader) {
        String token = bearerToken(authorizationHeader);
        ApiResponse<TokenIntrospection> response = tokenIntrospectionClient.introspect(new TokenIntrospectionRequest(token));
        TokenIntrospection introspection = response == null ? null : response.getData();
        if (introspection == null || !introspection.isActive() || introspection.getUserId() == null) {
            throw new ApplicationException(ErrorCode.UNAUTHORIZED);
        }
        return new CurrentUser(introspection.getUserId(), introspection.getSubject(), introspection.getRole());
    }

    private String bearerToken(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            throw new ApplicationException(ErrorCode.UNAUTHORIZED);
        }
        if (!authorizationHeader.regionMatches(true, 0, "Bearer ", 0, "Bearer ".length())) {
            throw new ApplicationException(ErrorCode.UNAUTHORIZED);
        }
        String token = authorizationHeader.substring("Bearer ".length()).trim();
        if (token.isBlank()) {
            throw new ApplicationException(ErrorCode.UNAUTHORIZED);
        }
        return token;
    }
}
