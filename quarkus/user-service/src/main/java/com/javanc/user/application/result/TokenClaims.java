package com.javanc.user.application.result;

import com.javanc.user.domain.model.AuthProvider;
import com.javanc.user.domain.model.TokenType;

public record TokenClaims(String subject, Integer userId, String role, TokenType type, AuthProvider provider,
        long expiresAt) {
}
