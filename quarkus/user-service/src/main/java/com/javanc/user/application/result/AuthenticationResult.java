package com.javanc.user.application.result;

public class AuthenticationResult {

    private int statusCode;
    private String error;
    private String message;
    private String token;
    private String refreshToken;
    private String expirationTime;
    private UserResult user;
    private boolean valid;
    private String role;

    public int statusCode() {
        return statusCode;
    }

    public void setStatusCode(int statusCode) {
        this.statusCode = statusCode;
    }

    public String error() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public String message() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String token() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String refreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String expirationTime() {
        return expirationTime;
    }

    public void setExpirationTime(String expirationTime) {
        this.expirationTime = expirationTime;
    }

    public UserResult user() {
        return user;
    }

    public void setUser(UserResult user) {
        this.user = user;
    }

    public boolean valid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    public String role() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
