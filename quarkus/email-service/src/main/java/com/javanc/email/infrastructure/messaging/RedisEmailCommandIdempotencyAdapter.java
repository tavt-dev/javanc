package com.javanc.email.infrastructure.messaging;

import com.javanc.email.application.port.EmailCommandIdempotencyPort;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.keys.KeyCommands;
import io.quarkus.redis.datasource.value.ValueCommands;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.util.Locale;

@ApplicationScoped
public class RedisEmailCommandIdempotencyAdapter implements EmailCommandIdempotencyPort {

    private static final Logger LOG = Logger.getLogger(RedisEmailCommandIdempotencyAdapter.class);

    private final ValueCommands<String, String> values;
    private final KeyCommands<String> keys;
    private final Duration ttl;
    private final String failureMode;

    public RedisEmailCommandIdempotencyAdapter(
            RedisDataSource redisDataSource,
            @ConfigProperty(name = "email.kafka.idempotency.ttl-seconds", defaultValue = "86400") long ttlSeconds,
            @ConfigProperty(name = "email.kafka.idempotency.failure-mode", defaultValue = "open") String failureMode) {
        this.values = redisDataSource.value(String.class);
        this.keys = redisDataSource.key();
        this.ttl = Duration.ofSeconds(Math.max(60, ttlSeconds));
        this.failureMode = value(failureMode).toLowerCase(Locale.ROOT);
    }

    @Override
    public boolean claim(String commandId) {
        if (value(commandId).isBlank()) {
            return true;
        }
        String key = key(commandId);
        try {
            boolean inserted = values.setnx(key, "processing");
            if (inserted) {
                keys.expire(key, ttl);
            }
            return inserted;
        } catch (RuntimeException ex) {
            LOG.warnf(ex, "Redis email idempotency claim failed commandId=%s failureMode=%s", commandId, failureMode);
            if ("closed".equals(failureMode)) {
                throw ex;
            }
            return true;
        }
    }

    @Override
    public void complete(String commandId) {
        if (value(commandId).isBlank()) {
            return;
        }
        try {
            values.set(key(commandId), "processed");
            keys.expire(key(commandId), ttl);
        } catch (RuntimeException ex) {
            LOG.warnf(ex, "Redis email idempotency completion failed commandId=%s", commandId);
        }
    }

    @Override
    public void release(String commandId) {
        if (value(commandId).isBlank()) {
            return;
        }
        try {
            keys.del(key(commandId));
        } catch (RuntimeException ex) {
            LOG.warnf(ex, "Redis email idempotency release failed commandId=%s", commandId);
        }
    }

    private String key(String commandId) {
        return "javanc:email:kafka:command:" + commandId.trim();
    }

    private static String value(String value) {
        return value == null ? "" : value.trim();
    }
}
