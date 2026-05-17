package com.javanc.user.application.ratelimit;

import com.javanc.user.adapter.out.ratelimit.RedisTokenBucketLimiter;
import com.javanc.user.redis.RedisTestResource;
import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.QuarkusTestProfile;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
@QuarkusTestResource(value = RedisTestResource.class, restrictToAnnotatedClass = true)
@TestProfile(RedisTokenBucketLimiterTest.EnabledRateLimitProfile.class)
class RedisTokenBucketLimiterTest {

    @Inject
    RedisTokenBucketLimiter limiter;

    @Test
    void tokenBucketAllowsBurstThenBlocksUntilRefill() {
        RateLimitPolicy policy = new RateLimitPolicy("test-bucket", 1, Duration.ofMinutes(1));
        String identity = UUID.randomUUID().toString();

        assertTrue(limiter.evaluate("user-service", policy, identity, "test").allowed());
        assertFalse(limiter.evaluate("user-service", policy, identity, "test").allowed());
    }

    public static class EnabledRateLimitProfile implements QuarkusTestProfile {
        @Override
        public Map<String, String> getConfigOverrides() {
            return Map.of(
                    "rate-limit.enabled", "true",
                    "rate-limit.mode", "enforce",
                    "rate-limit.fail-open", "false",
                    "rate-limit.key-secret", "test-rate-limit-secret");
        }
    }
}
