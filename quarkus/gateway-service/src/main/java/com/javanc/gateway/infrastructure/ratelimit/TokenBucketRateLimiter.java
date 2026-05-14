package com.javanc.gateway.infrastructure.ratelimit;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.keys.KeyCommands;
import io.quarkus.redis.datasource.value.ValueCommands;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.HttpHeaders;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class TokenBucketRateLimiter {

    private static final Logger LOG = Logger.getLogger(TokenBucketRateLimiter.class);

    private final boolean enabled;
    private final String serviceName;
    private final String backend;
    private final String redisFailureMode;
    private final RateLimitPolicy defaultPolicy;
    private final RateLimitPolicy authPolicy;
    private final RateLimitPolicy uploadPolicy;
    private final RateLimitPolicy messagePolicy;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final ValueCommands<String, Long> redisValues;
    private final KeyCommands<String> redisKeys;

    @Inject
    public TokenBucketRateLimiter(
            RedisDataSource redisDataSource,
            @ConfigProperty(name = "quarkus.application.name", defaultValue = "gateway-service") String serviceName,
            @ConfigProperty(name = "rate-limit.enabled", defaultValue = "true") boolean enabled,
            @ConfigProperty(name = "rate-limit.backend", defaultValue = "redis") String backend,
            @ConfigProperty(name = "rate-limit.redis.failure-mode", defaultValue = "category-default") String redisFailureMode,
            @ConfigProperty(name = "rate-limit.default.capacity", defaultValue = "600") int defaultCapacity,
            @ConfigProperty(name = "rate-limit.default.refill-tokens", defaultValue = "600") int defaultRefillTokens,
            @ConfigProperty(name = "rate-limit.default.refill-period-seconds", defaultValue = "60") long defaultRefillPeriodSeconds,
            @ConfigProperty(name = "rate-limit.auth.capacity", defaultValue = "120") int authCapacity,
            @ConfigProperty(name = "rate-limit.auth.refill-tokens", defaultValue = "120") int authRefillTokens,
            @ConfigProperty(name = "rate-limit.auth.refill-period-seconds", defaultValue = "60") long authRefillPeriodSeconds,
            @ConfigProperty(name = "rate-limit.upload.capacity", defaultValue = "60") int uploadCapacity,
            @ConfigProperty(name = "rate-limit.upload.refill-tokens", defaultValue = "60") int uploadRefillTokens,
            @ConfigProperty(name = "rate-limit.upload.refill-period-seconds", defaultValue = "300") long uploadRefillPeriodSeconds,
            @ConfigProperty(name = "rate-limit.message.capacity", defaultValue = "180") int messageCapacity,
            @ConfigProperty(name = "rate-limit.message.refill-tokens", defaultValue = "180") int messageRefillTokens,
            @ConfigProperty(name = "rate-limit.message.refill-period-seconds", defaultValue = "60") long messageRefillPeriodSeconds) {
        this(enabled, serviceName, backend, redisFailureMode, redisDataSource,
                new RateLimitPolicy(defaultCapacity, defaultRefillTokens, Duration.ofSeconds(defaultRefillPeriodSeconds)),
                new RateLimitPolicy(authCapacity, authRefillTokens, Duration.ofSeconds(authRefillPeriodSeconds)),
                new RateLimitPolicy(uploadCapacity, uploadRefillTokens, Duration.ofSeconds(uploadRefillPeriodSeconds)),
                new RateLimitPolicy(messageCapacity, messageRefillTokens, Duration.ofSeconds(messageRefillPeriodSeconds)));
    }

    TokenBucketRateLimiter(boolean enabled, RateLimitPolicy defaultPolicy, RateLimitPolicy authPolicy,
            RateLimitPolicy uploadPolicy, RateLimitPolicy messagePolicy) {
        this(enabled, "gateway-service", "memory", "open", null, defaultPolicy, authPolicy, uploadPolicy, messagePolicy);
    }

    TokenBucketRateLimiter(boolean enabled, String serviceName, String backend, String redisFailureMode,
            RedisDataSource redisDataSource, RateLimitPolicy defaultPolicy, RateLimitPolicy authPolicy,
            RateLimitPolicy uploadPolicy, RateLimitPolicy messagePolicy) {
        this.enabled = enabled;
        this.serviceName = value(serviceName).isBlank() ? "gateway-service" : serviceName.trim();
        this.backend = value(backend).toLowerCase(Locale.ROOT);
        this.redisFailureMode = value(redisFailureMode).toLowerCase(Locale.ROOT);
        this.defaultPolicy = defaultPolicy;
        this.authPolicy = authPolicy;
        this.uploadPolicy = uploadPolicy;
        this.messagePolicy = messagePolicy;
        this.redisValues = redisDataSource == null ? null : redisDataSource.value(Long.class);
        this.redisKeys = redisDataSource == null ? null : redisDataSource.key();
    }

    public RateLimitDecision check(String method, String rawPath, HttpHeaders headers, byte[] body) {
        String category = category(method, rawPath, headers);
        RateLimitPolicy policy = policy(category);
        if (!enabled || "auth".equals(category)) {
            return new RateLimitDecision(true, policy.capacity(), policy.capacity(), 0, nowEpochSeconds());
        }
        String identity = requestKey(headers);
        if ("redis".equals(backend) && redisValues != null && redisKeys != null) {
            try {
                return consumeRedis(category, policy, identity);
            } catch (RuntimeException ex) {
                LOG.warnf(ex, "Redis rate limiter failed service=%s category=%s failureMode=%s", serviceName,
                        category, redisFailureMode);
                return redisFailureDecision(category, policy);
            }
        }
        return consumeMemory(category, policy, identity);
    }

    private RateLimitDecision consumeMemory(String category, RateLimitPolicy policy, String identity) {
        String key = category + ":" + identity;
        return buckets.computeIfAbsent(key, ignored -> new Bucket(policy)).consume();
    }

    private RateLimitDecision consumeRedis(String category, RateLimitPolicy policy, String identity) {
        String key = "javanc:rate:" + serviceName + ":" + category + ":" + identity;
        long count = redisValues.incr(key);
        long ttl = policy.refillPeriod().toSeconds();
        if (count == 1) {
            redisKeys.expire(key, policy.refillPeriod());
        } else {
            ttl = redisKeys.ttl(key);
            if (ttl < 1) {
                redisKeys.expire(key, policy.refillPeriod());
                ttl = policy.refillPeriod().toSeconds();
            }
        }
        long remaining = Math.max(0, policy.capacity() - count);
        boolean allowed = count <= policy.capacity();
        return new RateLimitDecision(allowed, policy.capacity(), (int) remaining, allowed ? 0 : Math.max(1, ttl),
                nowEpochSeconds() + Math.max(1, ttl));
    }

    private RateLimitDecision redisFailureDecision(String category, RateLimitPolicy policy) {
        boolean allowed = switch (redisFailureMode) {
            case "closed" -> false;
            case "category-default" -> !"auth".equals(category);
            default -> true;
        };
        long retryAfter = allowed ? 0 : Math.max(1, policy.refillPeriod().toSeconds());
        return new RateLimitDecision(allowed, policy.capacity(), allowed ? policy.capacity() : 0, retryAfter,
                nowEpochSeconds() + retryAfter);
    }

    private RateLimitPolicy policy(String category) {
        return switch (category) {
            case "auth" -> authPolicy;
            case "upload" -> uploadPolicy;
            case "message" -> messagePolicy;
            default -> defaultPolicy;
        };
    }

    private String category(String method, String rawPath, HttpHeaders headers) {
        String path = rawPath == null ? "" : rawPath.toLowerCase(Locale.ROOT);
        String contentType = headers == null ? "" : value(headers.getHeaderString(HttpHeaders.CONTENT_TYPE)).toLowerCase(Locale.ROOT);
        if (path.startsWith("/auth/")) {
            return "auth";
        }
        if (!"GET".equalsIgnoreCase(method) && !"HEAD".equalsIgnoreCase(method)
                && (contentType.contains("multipart") || path.contains("avatar") || path.contains("image")
                        || path.contains("logo"))) {
            return "upload";
        }
        if (path.contains("notification") || path.contains("email")) {
            return "message";
        }
        return "default";
    }

    private String requestKey(HttpHeaders headers) {
        String service = headers == null ? "" : value(headers.getHeaderString("X-Service-Name"));
        if (!service.isBlank()) {
            return "service:" + service;
        }
        String authorization = headers == null ? "" : value(headers.getHeaderString(HttpHeaders.AUTHORIZATION));
        if (!authorization.isBlank()) {
            return "token:" + sha256(authorization);
        }
        String forwarded = headers == null ? "" : value(headers.getHeaderString("X-Forwarded-For"));
        if (!forwarded.isBlank()) {
            return "ip:" + forwarded.split(",")[0].trim();
        }
        String realIp = headers == null ? "" : value(headers.getHeaderString("X-Real-IP"));
        return realIp.isBlank() ? "ip:unknown" : "ip:" + realIp;
    }

    private static String value(String value) {
        return value == null ? "" : value.trim();
    }

    private String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest).substring(0, 32);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }

    private long nowEpochSeconds() {
        return System.currentTimeMillis() / 1000;
    }

    private static class Bucket {
        private final RateLimitPolicy policy;
        private int tokens;
        private long lastRefillMillis;

        private Bucket(RateLimitPolicy policy) {
            this.policy = policy;
            this.tokens = Math.max(1, policy.capacity());
            this.lastRefillMillis = System.currentTimeMillis();
        }

        private synchronized RateLimitDecision consume() {
            refill();
            long resetEpochSeconds = (lastRefillMillis + policy.refillPeriod().toMillis()) / 1000;
            if (tokens <= 0) {
                long retryAfterMillis = Math.max(1000,
                        (lastRefillMillis + policy.refillPeriod().toMillis()) - System.currentTimeMillis());
                return new RateLimitDecision(false, policy.capacity(), 0, (long) Math.ceil(retryAfterMillis / 1000.0),
                        resetEpochSeconds);
            }
            tokens--;
            return new RateLimitDecision(true, policy.capacity(), tokens, 0, resetEpochSeconds);
        }

        private void refill() {
            long now = System.currentTimeMillis();
            long periodMillis = Math.max(1000, policy.refillPeriod().toMillis());
            long elapsedPeriods = (now - lastRefillMillis) / periodMillis;
            if (elapsedPeriods <= 0) {
                return;
            }
            long restored = elapsedPeriods * Math.max(1, policy.refillTokens());
            tokens = (int) Math.min(policy.capacity(), tokens + restored);
            lastRefillMillis += elapsedPeriods * periodMillis;
        }
    }
}
