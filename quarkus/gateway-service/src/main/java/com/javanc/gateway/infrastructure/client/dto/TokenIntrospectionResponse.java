package com.javanc.gateway.infrastructure.client.dto;

public class TokenIntrospectionResponse {
    private boolean active;

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
