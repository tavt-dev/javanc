package com.javanc.user.domain.model;

public record EmployeeId(String value) {

    public EmployeeId {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Employee ID is required");
        }
        value = value.trim();
    }

    public static EmployeeId optional(String value) {
        return value == null || value.isBlank() ? null : new EmployeeId(value);
    }
}
