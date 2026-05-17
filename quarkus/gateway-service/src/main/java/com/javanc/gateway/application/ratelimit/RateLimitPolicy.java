package com.javanc.gateway.application.ratelimit;

import java.time.Duration;

public record RateLimitPolicy(
        String name,
        long capacity,
        Duration refillPeriod) {

    public RateLimitPolicy {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name is required");
        }
        if (capacity < 1) {
            throw new IllegalArgumentException("capacity must be positive");
        }
        if (refillPeriod == null || refillPeriod.isZero() || refillPeriod.isNegative()) {
            throw new IllegalArgumentException("refillPeriod must be positive");
        }
    }

    public long ttlSeconds() {
        return Math.max(1L, Math.ceilDiv(refillPeriod.toSeconds() * 2L, 1L));
    }
}
