package com.javanc.user.application.ratelimit;

import java.time.Duration;

public record RateLimitDecision(
        RateLimitPolicy policy,
        boolean allowed,
        long remaining,
        Duration resetAfter,
        Duration retryAfter,
        String identityType,
        RateLimitMode mode,
        boolean evaluated) {

    public static RateLimitDecision allowed(RateLimitPolicy policy, long remaining, Duration resetAfter,
            String identityType, RateLimitMode mode) {
        return new RateLimitDecision(policy, true, remaining, resetAfter, Duration.ZERO, identityType, mode, true);
    }

    public static RateLimitDecision denied(RateLimitPolicy policy, long remaining, Duration resetAfter,
            Duration retryAfter, String identityType, RateLimitMode mode) {
        return new RateLimitDecision(policy, false, remaining, resetAfter, retryAfter, identityType, mode, true);
    }

    public static RateLimitDecision bypassed(RateLimitPolicy policy, String identityType, RateLimitMode mode) {
        return new RateLimitDecision(policy, true, policy.capacity(), Duration.ZERO, Duration.ZERO, identityType, mode,
                false);
    }

    public boolean enforcedBlock() {
        return evaluated && !allowed && mode == RateLimitMode.ENFORCE;
    }

    public long resetAfterSeconds() {
        return Math.max(0L, Math.ceilDiv(resetAfter.toMillis(), 1000L));
    }

    public long retryAfterSeconds() {
        return Math.max(0L, Math.ceilDiv(retryAfter.toMillis(), 1000L));
    }
}
