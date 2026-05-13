package com.javanc.user.adapter.in.rest.dto;

public class RegistrationPending {
    public String email;
    public String status;
    public long expiresInSeconds;

    public RegistrationPending() {
    }

    public RegistrationPending(String email, String status, long expiresInSeconds) {
        this.email = email;
        this.status = status;
        this.expiresInSeconds = expiresInSeconds;
    }
}
