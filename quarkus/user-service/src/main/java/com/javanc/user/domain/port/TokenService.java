package com.javanc.user.domain.port;

import com.javanc.user.application.result.TokenClaims;
import com.javanc.user.domain.model.User;
import com.javanc.user.domain.model.TokenType;

public interface TokenService {

    String generateAccessToken(User user);

    String generateRefreshToken(User user);

    TokenClaims validate(String token, TokenType expectedType);

    long accessExpiresInSeconds();
}
