package com.javanc.gateway.infrastructure.client.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

public class AuthenticationResponse {

    private int statusCode;
    private String error;
    private String message;
    private String token;
    private String refreshToken;
    private String expirationTime;

    @JsonProperty("isVaild")
    @JsonAlias("vaild")
    private boolean valid;

    private String role;

    public AuthenticationResponse() {
    }

    public AuthenticationResponse(int statusCode, String error) {
        this.statusCode = statusCode;
        this.error = error;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(int statusCode) {
        this.statusCode = statusCode;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getExpirationTime() {
        return expirationTime;
    }

    public void setExpirationTime(String expirationTime) {
        this.expirationTime = expirationTime;
    }

    public boolean isVaild() {
        return valid;
    }

    public void setVaild(boolean valid) {
        this.valid = valid;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public static AuthenticationResponse unauthenticated() {
        return new AuthenticationResponse(1041, "Unauthenticated");
    }
}
