package com.javanc.user.redis;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;

import org.junit.jupiter.api.Test;

import com.javanc.user.adapter.out.redis.RedisHealthService;
import com.javanc.user.adapter.out.redis.RedisHealthService.RedisHealthStatus;
import com.javanc.user.adapter.out.redis.RedisService;

import io.quarkus.test.common.QuarkusTestResource;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;

@QuarkusTest
@QuarkusTestResource(value = RedisTestResource.class, restrictToAnnotatedClass = true)
class RedisEnabledFoundationTest {

    private static final String KEY = "javanc:test:value";
    private static final String COUNTER_KEY = "javanc:test:counter";

    @Inject
    RedisService redisService;

    @Inject
    RedisHealthService redisHealthService;

    @Test
    void foundationCommandsWorkAgainstRedis() {
        redisService.delete(KEY);
        redisService.delete(COUNTER_KEY);

        assertTrue(redisService.set(KEY, "value"));
        assertEquals("value", redisService.get(KEY).orElseThrow());
        assertTrue(redisService.exists(KEY));
        assertTrue(redisService.expire(KEY, Duration.ofSeconds(30)));
        assertTrue(redisService.ttl(KEY).orElseThrow() > 0);
        assertTrue(redisService.setex(KEY, Duration.ofSeconds(30), "updated"));
        assertEquals("updated", redisService.get(KEY).orElseThrow());
        assertEquals(1L, redisService.incr(COUNTER_KEY).orElseThrow());
        assertTrue(redisService.delete(KEY));
        assertFalse(redisService.exists(KEY));
        assertEquals(RedisHealthStatus.UP, redisHealthService.status());
    }

}
