package com.javanc.user.application.result;

public record RegistrationPendingResult(String email, String status, long expiresInSeconds) {
}
