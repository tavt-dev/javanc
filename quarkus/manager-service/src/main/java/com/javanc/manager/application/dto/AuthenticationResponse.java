package com.javanc.manager.application.dto;

public class AuthenticationResponse {
    public int statusCode;
    public String error;
    public String message;
    public String token;
    public String refreshToken;
    public String expirationTime;
    public UserDTO user;
    public boolean isVaild;
    public String role;
}
