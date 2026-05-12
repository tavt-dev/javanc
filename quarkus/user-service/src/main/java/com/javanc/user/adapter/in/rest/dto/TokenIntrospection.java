package com.javanc.user.adapter.in.rest.dto;

public class TokenIntrospection {
    public boolean active;
    public String subject;
    public Integer userId;
    public String role;
    public Long expiresAt;

    public TokenIntrospection() {
    }

    public TokenIntrospection(boolean active, String subject, Integer userId, String role, Long expiresAt) {
        this.active = active;
        this.subject = subject;
        this.userId = userId;
        this.role = role;
        this.expiresAt = expiresAt;
    }
}
