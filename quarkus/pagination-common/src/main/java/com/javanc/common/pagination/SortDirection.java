package com.javanc.common.pagination;

public enum SortDirection {
    ASC,
    DESC;

    public static SortDirection from(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Sort direction is required");
        }
        return switch (value.trim().toLowerCase()) {
            case "asc" -> ASC;
            case "desc" -> DESC;
            default -> throw new IllegalArgumentException("Invalid sort direction");
        };
    }

    public String wireValue() {
        return name().toLowerCase();
    }
}
