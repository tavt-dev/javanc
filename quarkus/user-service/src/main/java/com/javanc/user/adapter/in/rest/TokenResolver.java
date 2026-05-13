package com.javanc.user.adapter.in.rest;

import com.javanc.user.shared.exception.ErrorCode;
import com.javanc.user.shared.exception.JwtServiceException;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class TokenResolver {

    public String resolve(String authorizationHeader, String queryToken) {
        String headerToken = fromAuthorizationHeader(authorizationHeader);
        if (headerToken != null) {
            return headerToken;
        }
        if (queryToken == null || queryToken.isBlank()) {
            throw new JwtServiceException(ErrorCode.UNAUTHORIZED);
        }
        return queryToken;
    }

    public String requireHeaderToken(String authorizationHeader) {
        String headerToken = fromAuthorizationHeader(authorizationHeader);
        if (headerToken == null) {
            throw new JwtServiceException(ErrorCode.UNAUTHORIZED);
        }
        return headerToken;
    }

    private String fromAuthorizationHeader(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            return null;
        }
        if (!authorizationHeader.startsWith("Bearer ")) {
            throw new JwtServiceException(ErrorCode.UNAUTHORIZED);
        }
        String token = authorizationHeader.substring("Bearer ".length());
        if (token.isBlank()) {
            throw new JwtServiceException(ErrorCode.UNAUTHORIZED);
        }
        return token;
    }
}
