package com.javanc.email.application.dto;

public class VerificationOtpEmailDTO {
    private String to;
    private String name;
    private String otp;
    private long expiresInMinutes;

    public String getTo() {
        return to;
    }

    public void setTo(String to) {
        this.to = to;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }

    public long getExpiresInMinutes() {
        return expiresInMinutes;
    }

    public void setExpiresInMinutes(long expiresInMinutes) {
        this.expiresInMinutes = expiresInMinutes;
    }
}
