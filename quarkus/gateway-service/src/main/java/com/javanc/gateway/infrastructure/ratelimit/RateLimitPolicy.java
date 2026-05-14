package com.javanc.gateway.infrastructure.ratelimit;

import java.time.Duration;

public record RateLimitPolicy(int capacity, int refillTokens, Duration refillPeriod) {
}
