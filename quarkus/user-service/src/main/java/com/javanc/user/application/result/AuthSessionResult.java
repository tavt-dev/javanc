package com.javanc.user.application.result;

public record AuthSessionResult(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresInSeconds,
        UserResult user) {
}
