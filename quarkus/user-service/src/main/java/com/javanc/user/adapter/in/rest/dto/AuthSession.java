package com.javanc.user.adapter.in.rest.dto;

public class AuthSession {
    public String accessToken;
    public String refreshToken;
    public String tokenType;
    public long expiresInSeconds;
    public UserDTO user;

    public AuthSession() {
    }

    public AuthSession(String accessToken, String refreshToken, String tokenType, long expiresInSeconds, UserDTO user) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenType = tokenType;
        this.expiresInSeconds = expiresInSeconds;
        this.user = user;
    }
}
