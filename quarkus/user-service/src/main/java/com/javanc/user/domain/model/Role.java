package com.javanc.user.domain.model;

public enum Role {
    admin,
    user,
    hr,
    manager;

    public static Role fromNullable(String value) {
        return value == null ? user : Role.valueOf(value);
    }
}
