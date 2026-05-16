package com.javanc.user.adapter.out.redis;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class RedisHealthService {

    private static final String HEALTH_PROBE_KEY = "javanc:system:health:probe";

    @Inject
    RedisService redisService;

    public RedisHealthStatus status() {
        if (!redisService.isEnabled()) {
            return RedisHealthStatus.DISABLED;
        }
        return redisService.execute("health", dataSource -> {
            dataSource.key().exists(HEALTH_PROBE_KEY);
            return RedisHealthStatus.UP;
        }, RedisHealthStatus.DOWN);
    }

    public enum RedisHealthStatus {
        UP,
        DOWN,
        DISABLED
    }
}
