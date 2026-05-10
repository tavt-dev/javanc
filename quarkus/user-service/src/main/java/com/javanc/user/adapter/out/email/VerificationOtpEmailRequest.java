package com.javanc.user.adapter.out.email;

public class VerificationOtpEmailRequest {
    public String to;
    public String name;
    public String otp;
    public long expiresInMinutes;

    public VerificationOtpEmailRequest() {
    }

    public VerificationOtpEmailRequest(String to, String name, String otp, long expiresInMinutes) {
        this.to = to;
        this.name = name;
        this.otp = otp;
        this.expiresInMinutes = expiresInMinutes;
    }
}
