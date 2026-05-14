package com.javanc.gateway.infrastructure.ratelimit;

public record RateLimitDecision(boolean allowed, int limit, int remaining, long retryAfterSeconds,
        long resetEpochSeconds) {
}
