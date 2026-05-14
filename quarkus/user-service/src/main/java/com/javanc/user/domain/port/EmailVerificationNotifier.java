package com.javanc.user.domain.port;

public interface EmailVerificationNotifier {

    void sendOtp(String email, String name, String otp, long expiresInMinutes);

    default void sendPasswordResetOtp(String email, String name, String otp, long expiresInMinutes) {
        sendOtp(email, name, otp, expiresInMinutes);
    }
}
