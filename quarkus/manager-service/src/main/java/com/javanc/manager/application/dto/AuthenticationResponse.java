package com.javanc.manager.application.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class AuthenticationResponse {
    public String accessToken;
    public String refreshToken;
    public String tokenType;
    public long expiresInSeconds;
    public UserDTO user;
}
