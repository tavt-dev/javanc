package com.javanc.gateway.infrastructure.client.dto;

public class AuthenticationResponse {

    private int statusCode;
    private String error;

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

    public static AuthenticationResponse unauthenticated() {
        return new AuthenticationResponse(1041, "Unauthenticated");
    }
}
