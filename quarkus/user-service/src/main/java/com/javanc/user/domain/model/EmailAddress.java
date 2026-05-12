package com.javanc.user.domain.model;

import java.util.regex.Pattern;

public record EmailAddress(String value) {

    private static final Pattern SIMPLE_EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    public EmailAddress {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        value = value.trim().toLowerCase();
        if (!SIMPLE_EMAIL.matcher(value).matches()) {
            throw new IllegalArgumentException("Email is invalid");
        }
    }
}
