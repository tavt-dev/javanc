package com.javanc.user.adapter.out.redis;

import java.time.Duration;
import java.util.Optional;
import java.util.OptionalLong;
import java.util.function.Function;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import io.quarkus.redis.client.RedisClientName;
import io.quarkus.redis.datasource.RedisDataSource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class RedisService {

    private static final Logger LOG = Logger.getLogger(RedisService.class);

    @Inject
    @RedisClientName("foundation")
    RedisDataSource redisDataSource;

    @ConfigProperty(name = "redis.enabled", defaultValue = "true")
    boolean enabled;

    public boolean isEnabled() {
        return enabled;
    }

    public Optional<String> get(String key) {
        return execute("get", dataSource -> Optional.ofNullable(dataSource.value(String.class).get(key)),
                Optional.empty());
    }

    public boolean set(String key, String value) {
        return execute("set", dataSource -> {
            dataSource.value(String.class).set(key, value);
            return true;
        }, false);
    }

    public boolean setex(String key, Duration ttl, String value) {
        return execute("setex", dataSource -> {
            dataSource.value(String.class).setex(key, positiveSeconds(ttl), value);
            return true;
        }, false);
    }

    public boolean delete(String key) {
        return execute("delete", dataSource -> dataSource.key().del(key) > 0, false);
    }

    public boolean exists(String key) {
        return execute("exists", dataSource -> dataSource.key().exists(key), false);
    }

    public OptionalLong incr(String key) {
        return execute("incr", dataSource -> OptionalLong.of(dataSource.value(Long.class).incr(key)),
                OptionalLong.empty());
    }

    public boolean expire(String key, Duration ttl) {
        return execute("expire", dataSource -> dataSource.key().expire(key, positiveSeconds(ttl)), false);
    }

    public OptionalLong ttl(String key) {
        return execute("ttl", dataSource -> OptionalLong.of(dataSource.key().ttl(key)), OptionalLong.empty());
    }

    <T> T execute(String operation, Function<RedisDataSource, T> operationFn, T fallback) {
        if (!enabled) {
            return fallback;
        }
        try {
            return operationFn.apply(redisDataSource);
        } catch (RuntimeException exception) {
            LOG.warnf("Redis operation failed operation=%s cause=%s", operation,
                    exception.getClass().getSimpleName());
            return fallback;
        }
    }

    private static long positiveSeconds(Duration ttl) {
        if (ttl == null || ttl.isZero() || ttl.isNegative()) {
            throw new IllegalArgumentException("ttl must be positive");
        }
        return Math.max(1, ttl.toSeconds());
    }
}
