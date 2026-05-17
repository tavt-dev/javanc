package com.javanc.gateway.application.model;

public record AuthenticatedPrincipal(
        boolean active,
        Integer userId,
        String role) {

    public static AuthenticatedPrincipal inactive() {
        return new AuthenticatedPrincipal(false, null, null);
    }
}
