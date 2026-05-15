package com.javanc.user.application.result;

public record VerifiedGoogleIdentity(String subject, String email, String name, String pictureUrl,
        boolean emailVerified) {
}
