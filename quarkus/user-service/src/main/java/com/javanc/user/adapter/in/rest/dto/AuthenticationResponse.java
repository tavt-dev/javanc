package com.javanc.user.adapter.in.rest.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

public class AuthenticationResponse {

    private int statusCode;
    private String error;
    private String message;
    private String token;
    private String refreshToken;
    private String expirationTime;
    private UserDTO user;

    @JsonProperty("vaild")
    @JsonAlias("isVaild")
    private boolean valid;

    private String role;

    public AuthenticationResponse() {
    }

    public AuthenticationResponse(int statusCode, String error, String message, String token, String refreshToken,
            String expirationTime, UserDTO user, boolean valid, String role) {
        this.statusCode = statusCode;
        this.error = error;
        this.message = message;
        this.token = token;
        this.refreshToken = refreshToken;
        this.expirationTime = expirationTime;
        this.user = user;
        this.valid = valid;
        this.role = role;
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

    public UserDTO getUser() {
        return user;
    }

    public void setUser(UserDTO user) {
        this.user = user;
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
}
