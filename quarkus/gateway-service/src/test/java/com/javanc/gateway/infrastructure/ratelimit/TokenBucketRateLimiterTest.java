package com.javanc.gateway.infrastructure.ratelimit;

import jakarta.ws.rs.core.HttpHeaders;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.Duration;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TokenBucketRateLimiterTest {

    @Test
    void rejectsRequestsAfterPolicyCapacityIsConsumed() {
        TokenBucketRateLimiter limiter = limiterWithCapacity(2);
        HttpHeaders headers = headers(Map.of("X-Forwarded-For", "10.0.0.1"));

        assertTrue(limiter.check("GET", "/profiles", headers, null).allowed());
        assertTrue(limiter.check("GET", "/profiles", headers, null).allowed());
        assertFalse(limiter.check("GET", "/profiles", headers, null).allowed());
    }

    @Test
    void tracksBucketsSeparatelyByClientKey() {
        TokenBucketRateLimiter limiter = limiterWithCapacity(1);

        assertTrue(limiter.check("GET", "/profiles", headers(Map.of("X-Forwarded-For", "10.0.0.1")), null)
                .allowed());
        assertTrue(limiter.check("GET", "/profiles", headers(Map.of("X-Forwarded-For", "10.0.0.2")), null)
                .allowed());
        assertFalse(limiter.check("GET", "/profiles", headers(Map.of("X-Forwarded-For", "10.0.0.1")), null)
                .allowed());
    }

    @Test
    void bypassesGenericRateLimitForAuthRoutes() {
        RateLimitPolicy defaultPolicy = new RateLimitPolicy(1, 1, Duration.ofMinutes(1));
        RateLimitPolicy authPolicy = new RateLimitPolicy(2, 2, Duration.ofMinutes(1));
        TokenBucketRateLimiter limiter = new TokenBucketRateLimiter(true, defaultPolicy, authPolicy,
                defaultPolicy, defaultPolicy);
        HttpHeaders headers = headers(Map.of("X-Forwarded-For", "10.0.0.3"));

        assertTrue(limiter.check("POST", "/auth/login", headers, null).allowed());
        assertTrue(limiter.check("POST", "/auth/refresh", headers, null).allowed());
        assertTrue(limiter.check("POST", "/auth/register", headers, null).allowed());
    }

    private TokenBucketRateLimiter limiterWithCapacity(int capacity) {
        RateLimitPolicy policy = new RateLimitPolicy(capacity, capacity, Duration.ofMinutes(1));
        return new TokenBucketRateLimiter(true, policy, policy, policy, policy);
    }

    private HttpHeaders headers(Map<String, String> values) {
        return (HttpHeaders) Proxy.newProxyInstance(
                HttpHeaders.class.getClassLoader(),
                new Class<?>[] { HttpHeaders.class },
                (proxy, method, args) -> {
                    if ("getHeaderString".equals(method.getName())) {
                        return values.get(args[0]);
                    }
                    if ("toString".equals(method.getName())) {
                        return values.toString();
                    }
                    if (method.getReturnType().isPrimitive()) {
                        return false;
                    }
                    return null;
                });
    }
}
