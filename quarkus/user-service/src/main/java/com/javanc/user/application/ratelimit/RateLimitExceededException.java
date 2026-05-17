package com.javanc.user.application.ratelimit;

public class RateLimitExceededException extends RuntimeException {

    private final RateLimitDecision decision;

    public RateLimitExceededException(RateLimitDecision decision) {
        super("Too many requests");
        this.decision = decision;
    }

    public RateLimitDecision decision() {
        return decision;
    }
}
