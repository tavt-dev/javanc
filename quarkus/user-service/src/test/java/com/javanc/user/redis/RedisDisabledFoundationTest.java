package com.javanc.user.redis;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.javanc.user.adapter.out.redis.RedisHealthService;
import com.javanc.user.adapter.out.redis.RedisHealthService.RedisHealthStatus;
import com.javanc.user.adapter.out.redis.RedisService;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.QuarkusTestProfile;
import io.quarkus.test.junit.TestProfile;
import jakarta.inject.Inject;

@QuarkusTest
@TestProfile(RedisDisabledFoundationTest.RedisDisabledProfile.class)
class RedisDisabledFoundationTest {

    @Inject
    RedisService redisService;

    @Inject
    RedisHealthService redisHealthService;

    @Test
    void disabledRedisFallsBackWithoutBroker() {
        assertFalse(redisService.isEnabled());
        assertTrue(redisService.get("javanc:test:key").isEmpty());
        assertFalse(redisService.set("javanc:test:key", "value"));
        assertFalse(redisService.setex("javanc:test:key", Duration.ofSeconds(30), "value"));
        assertFalse(redisService.delete("javanc:test:key"));
        assertFalse(redisService.exists("javanc:test:key"));
        assertTrue(redisService.incr("javanc:test:counter").isEmpty());
        assertFalse(redisService.expire("javanc:test:key", Duration.ofSeconds(30)));
        assertTrue(redisService.ttl("javanc:test:key").isEmpty());
        assertTrue(redisHealthService.status() == RedisHealthStatus.DISABLED);
    }

    public static class RedisDisabledProfile implements QuarkusTestProfile {
        @Override
        public Map<String, String> getConfigOverrides() {
            return Map.of(
                    "redis.enabled", "false",
                    "quarkus.redis.health.enabled", "false",
                    "quarkus.redis.devservices.enabled", "false",
                    "quarkus.redis.foundation.hosts", "redis://localhost:6399/0",
                    "quarkus.redis.foundation.devservices.enabled", "false");
        }
    }
}
