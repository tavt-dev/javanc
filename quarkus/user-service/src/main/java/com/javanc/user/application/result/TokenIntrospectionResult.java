package com.javanc.user.application.result;

public record TokenIntrospectionResult(
        boolean active,
        String subject,
        Integer userId,
        String role,
        Long expiresAt) {

    public static TokenIntrospectionResult inactive() {
        return new TokenIntrospectionResult(false, null, null, null, null);
    }
}
