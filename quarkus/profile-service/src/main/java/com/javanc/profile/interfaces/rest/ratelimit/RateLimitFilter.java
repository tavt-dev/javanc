package com.javanc.profile.interfaces.rest.ratelimit;

import com.javanc.profile.interfaces.rest.dto.ApiResponse;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.keys.KeyCommands;
import io.quarkus.redis.datasource.value.ValueCommands;
import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Provider
@ApplicationScoped
@Priority(Priorities.AUTHENTICATION)
public class RateLimitFilter implements ContainerRequestFilter {

    private static final Logger LOG = Logger.getLogger(RateLimitFilter.class);
    private static final String MESSAGE = "Too many requests. Please try again later.";

    private final boolean enabled;
    private final String serviceName;
    private final String backend;
    private final String redisFailureMode;
    private final Policy defaultPolicy;
    private final Policy authPolicy;
    private final Policy uploadPolicy;
    private final Policy messagePolicy;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final ValueCommands<String, Long> redisValues;
    private final KeyCommands<String> redisKeys;

    public RateLimitFilter(
            RedisDataSource redisDataSource,
            @ConfigProperty(name = "quarkus.application.name", defaultValue = "profile-service") String serviceName,
            @ConfigProperty(name = "rate-limit.enabled", defaultValue = "true") boolean enabled,
            @ConfigProperty(name = "rate-limit.backend", defaultValue = "redis") String backend,
            @ConfigProperty(name = "rate-limit.redis.failure-mode", defaultValue = "open") String redisFailureMode,
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
        this.enabled = enabled;
        this.serviceName = value(serviceName).isBlank() ? "profile-service" : serviceName.trim();
        this.backend = value(backend).toLowerCase(Locale.ROOT);
        this.redisFailureMode = value(redisFailureMode).toLowerCase(Locale.ROOT);
        this.defaultPolicy = new Policy("default", defaultCapacity, defaultRefillTokens, Duration.ofSeconds(defaultRefillPeriodSeconds));
        this.authPolicy = new Policy("auth", authCapacity, authRefillTokens, Duration.ofSeconds(authRefillPeriodSeconds));
        this.uploadPolicy = new Policy("upload", uploadCapacity, uploadRefillTokens, Duration.ofSeconds(uploadRefillPeriodSeconds));
        this.messagePolicy = new Policy("message", messageCapacity, messageRefillTokens, Duration.ofSeconds(messageRefillPeriodSeconds));
        this.redisValues = redisDataSource.value(Long.class);
        this.redisKeys = redisDataSource.key();
    }

    @Override
    public void filter(ContainerRequestContext context) throws IOException {
        if (!enabled) {
            return;
        }
        String method = value(context.getMethod());
        String path = "/" + value(context.getUriInfo().getPath());
        if ("OPTIONS".equalsIgnoreCase(method) || path.startsWith("/q/")) {
            return;
        }
        if (path.toLowerCase(Locale.ROOT).startsWith("/auth/")) {
            return;
        }

        Policy policy = policyFor(method, path, context.getHeaderString(HttpHeaders.CONTENT_TYPE));
        Decision decision = check(policy, requestKey(context));
        if (decision.allowed()) {
            return;
        }

        context.abortWith(Response.status(429)
                .type(MediaType.APPLICATION_JSON)
                .header("X-RateLimit-Limit", decision.limit())
                .header("X-RateLimit-Remaining", decision.remaining())
                .header("X-RateLimit-Reset", decision.resetEpochSeconds())
                .header("Retry-After", decision.retryAfterSeconds())
                .entity(new ApiResponse<>(false, MESSAGE, null))
                .build());
    }

    private Decision check(Policy policy, String identity) {
        if ("redis".equals(backend)) {
            try {
                return consumeRedis(policy, identity);
            } catch (RuntimeException ex) {
                LOG.warnf(ex, "Redis rate limiter failed service=%s category=%s failureMode=%s", serviceName,
                        policy.name(), redisFailureMode);
                return redisFailureDecision(policy);
            }
        }
        return consumeMemory(policy, identity);
    }

    private Decision consumeMemory(Policy policy, String identity) {
        return buckets.computeIfAbsent(policy.name() + ":" + identity, ignored -> new Bucket(policy)).consume();
    }

    private Decision consumeRedis(Policy policy, String identity) {
        String key = "javanc:rate:" + serviceName + ":" + policy.name() + ":" + identity;
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
        return new Decision(allowed, policy.capacity(), (int) remaining, allowed ? 0 : Math.max(1, ttl),
                nowEpochSeconds() + Math.max(1, ttl));
    }

    private Decision redisFailureDecision(Policy policy) {
        boolean allowed = switch (redisFailureMode) {
            case "closed" -> false;
            case "category-default" -> !"auth".equals(policy.name());
            default -> true;
        };
        long retryAfter = allowed ? 0 : Math.max(1, policy.refillPeriod().toSeconds());
        return new Decision(allowed, policy.capacity(), allowed ? policy.capacity() : 0, retryAfter,
                nowEpochSeconds() + retryAfter);
    }

    private Policy policyFor(String method, String rawPath, String contentTypeHeader) {
        String path = value(rawPath).toLowerCase(Locale.ROOT);
        String contentType = value(contentTypeHeader).toLowerCase(Locale.ROOT);
        if (path.startsWith("/auth/")) {
            return authPolicy;
        }
        if (!"GET".equalsIgnoreCase(method) && !"HEAD".equalsIgnoreCase(method)
                && (contentType.contains("multipart") || path.contains("avatar") || path.contains("image")
                        || path.contains("logo"))) {
            return uploadPolicy;
        }
        if (path.contains("notification") || path.contains("email")) {
            return messagePolicy;
        }
        return defaultPolicy;
    }

    private String requestKey(ContainerRequestContext context) {
        String service = value(context.getHeaderString("X-Service-Name"));
        if (!service.isBlank()) {
            return "service:" + service;
        }
        String authorization = value(context.getHeaderString(HttpHeaders.AUTHORIZATION));
        if (!authorization.isBlank()) {
            return "token:" + sha256(authorization);
        }
        String forwarded = value(context.getHeaderString("X-Forwarded-For"));
        if (!forwarded.isBlank()) {
            return "ip:" + forwarded.split(",")[0].trim();
        }
        String realIp = value(context.getHeaderString("X-Real-IP"));
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

    private record Policy(String name, int capacity, int refillTokens, Duration refillPeriod) {
    }

    private record Decision(boolean allowed, int limit, int remaining, long retryAfterSeconds, long resetEpochSeconds) {
    }

    private static class Bucket {
        private final Policy policy;
        private int tokens;
        private long lastRefillMillis;

        private Bucket(Policy policy) {
            this.policy = policy;
            this.tokens = Math.max(1, policy.capacity());
            this.lastRefillMillis = System.currentTimeMillis();
        }

        private synchronized Decision consume() {
            refill();
            long resetEpochSeconds = (lastRefillMillis + policy.refillPeriod().toMillis()) / 1000;
            if (tokens <= 0) {
                long retryAfterMillis = Math.max(1000,
                        (lastRefillMillis + policy.refillPeriod().toMillis()) - System.currentTimeMillis());
                return new Decision(false, policy.capacity(), 0, (long) Math.ceil(retryAfterMillis / 1000.0),
                        resetEpochSeconds);
            }
            tokens--;
            return new Decision(true, policy.capacity(), tokens, 0, resetEpochSeconds);
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
