package com.javanc.user.domain.port;

public interface EmailVerificationNotifier {

    void sendOtp(String email, String name, String otp, long expiresInMinutes);
}
