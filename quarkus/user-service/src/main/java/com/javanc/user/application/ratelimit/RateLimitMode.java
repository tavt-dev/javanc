package com.javanc.user.application.ratelimit;

public enum RateLimitMode {
    SHADOW,
    ENFORCE;

    public static RateLimitMode from(String value) {
        if (value == null || value.isBlank()) {
            return SHADOW;
        }
        try {
            return RateLimitMode.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            return SHADOW;
        }
    }

    public String metricValue() {
        return name().toLowerCase();
    }
}
