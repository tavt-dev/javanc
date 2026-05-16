package com.javanc.user.redis;

import java.util.Map;

import org.testcontainers.containers.GenericContainer;
import org.testcontainers.utility.DockerImageName;

import io.quarkus.test.common.QuarkusTestResourceLifecycleManager;

public class RedisTestResource implements QuarkusTestResourceLifecycleManager {

    private GenericContainer<?> redis;

    @Override
    public Map<String, String> start() {
        redis = new GenericContainer<>(DockerImageName.parse("redis:7")).withExposedPorts(6379);
        redis.start();
        return Map.of(
                "redis.enabled", "true",
                "quarkus.redis.foundation.hosts",
                "redis://" + redis.getHost() + ":" + redis.getMappedPort(6379) + "/0",
                "quarkus.redis.health.enabled", "true");
    }

    @Override
    public void stop() {
        if (redis != null) {
            redis.stop();
        }
    }
}
