package com.javanc.user.domain.model;

public record UserId(Integer value) {

    public UserId {
        if (value == null) {
            throw new IllegalArgumentException("User id is required");
        }
    }
}
