package com.javanc.user.domain.model;

public enum Role {
    admin,
    user,
    hr,
    manager;

    public static Role fromNullable(String value) {
        if (value == null || value.isBlank()) {
            return user;
        }
        return Role.valueOf(value.trim().toLowerCase());
    }

    public static Role fromRequired(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Role is required");
        }
        return Role.valueOf(value.trim().toLowerCase());
    }
}
