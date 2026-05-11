package com.javanc.profile.interfaces.rest.dto;

public class TokenIntrospectionRequest {

    private String token;

    public TokenIntrospectionRequest() {
    }

    public TokenIntrospectionRequest(String token) {
        this.token = token;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
