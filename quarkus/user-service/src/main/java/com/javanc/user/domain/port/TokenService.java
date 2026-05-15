package com.javanc.user.domain.port;

import com.javanc.user.application.result.TokenClaims;
import com.javanc.user.domain.model.AuthProvider;
import com.javanc.user.domain.model.User;
import com.javanc.user.domain.model.TokenType;

public interface TokenService {

    String generateAccessToken(User user, AuthProvider provider);

    String generateRefreshToken(User user, AuthProvider provider);

    TokenClaims validate(String token, TokenType expectedType);

    long accessExpiresInSeconds();
}
