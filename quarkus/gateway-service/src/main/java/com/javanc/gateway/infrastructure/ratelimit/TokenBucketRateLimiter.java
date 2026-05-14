package com.javanc.gateway.infrastructure.ratelimit;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.HttpHeaders;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Duration;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class TokenBucketRateLimiter {

    private final boolean enabled;
    private final RateLimitPolicy defaultPolicy;
    private final RateLimitPolicy authPolicy;
    private final RateLimitPolicy uploadPolicy;
    private final RateLimitPolicy messagePolicy;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Inject
    public TokenBucketRateLimiter(
            @ConfigProperty(name = "rate-limit.enabled", defaultValue = "true") boolean enabled,
            @ConfigProperty(name = "rate-limit.default.capacity", defaultValue = "120") int defaultCapacity,
            @ConfigProperty(name = "rate-limit.default.refill-tokens", defaultValue = "120") int defaultRefillTokens,
            @ConfigProperty(name = "rate-limit.default.refill-period-seconds", defaultValue = "60") long defaultRefillPeriodSeconds,
            @ConfigProperty(name = "rate-limit.auth.capacity", defaultValue = "10") int authCapacity,
            @ConfigProperty(name = "rate-limit.auth.refill-tokens", defaultValue = "10") int authRefillTokens,
            @ConfigProperty(name = "rate-limit.auth.refill-period-seconds", defaultValue = "60") long authRefillPeriodSeconds,
            @ConfigProperty(name = "rate-limit.upload.capacity", defaultValue = "20") int uploadCapacity,
            @ConfigProperty(name = "rate-limit.upload.refill-tokens", defaultValue = "20") int uploadRefillTokens,
            @ConfigProperty(name = "rate-limit.upload.refill-period-seconds", defaultValue = "300") long uploadRefillPeriodSeconds,
            @ConfigProperty(name = "rate-limit.message.capacity", defaultValue = "30") int messageCapacity,
            @ConfigProperty(name = "rate-limit.message.refill-tokens", defaultValue = "30") int messageRefillTokens,
            @ConfigProperty(name = "rate-limit.message.refill-period-seconds", defaultValue = "60") long messageRefillPeriodSeconds) {
        this(enabled,
                new RateLimitPolicy(defaultCapacity, defaultRefillTokens, Duration.ofSeconds(defaultRefillPeriodSeconds)),
                new RateLimitPolicy(authCapacity, authRefillTokens, Duration.ofSeconds(authRefillPeriodSeconds)),
                new RateLimitPolicy(uploadCapacity, uploadRefillTokens, Duration.ofSeconds(uploadRefillPeriodSeconds)),
                new RateLimitPolicy(messageCapacity, messageRefillTokens, Duration.ofSeconds(messageRefillPeriodSeconds)));
    }

    TokenBucketRateLimiter(boolean enabled, RateLimitPolicy defaultPolicy, RateLimitPolicy authPolicy,
            RateLimitPolicy uploadPolicy, RateLimitPolicy messagePolicy) {
        this.enabled = enabled;
        this.defaultPolicy = defaultPolicy;
        this.authPolicy = authPolicy;
        this.uploadPolicy = uploadPolicy;
        this.messagePolicy = messagePolicy;
    }

    public RateLimitDecision check(String method, String rawPath, HttpHeaders headers, byte[] body) {
        String category = category(method, rawPath, headers);
        RateLimitPolicy policy = policy(category);
        if (!enabled) {
            return new RateLimitDecision(true, policy.capacity(), policy.capacity(), 0, nowEpochSeconds());
        }
        String key = category + ":" + requestKey(headers);
        return buckets.computeIfAbsent(key, ignored -> new Bucket(policy)).consume();
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
        if (path.startsWith("/auth/login") || path.startsWith("/auth/register")
                || path.startsWith("/auth/verify-email") || path.startsWith("/auth/resend-verification-otp")
                || path.startsWith("/auth/password-reset")) {
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
        String service = value(headers.getHeaderString("X-Service-Name"));
        if (!service.isBlank()) {
            return "service:" + service;
        }
        String authorization = value(headers.getHeaderString(HttpHeaders.AUTHORIZATION));
        if (!authorization.isBlank()) {
            return "token:" + Integer.toHexString(authorization.hashCode());
        }
        String forwarded = value(headers.getHeaderString("X-Forwarded-For"));
        if (!forwarded.isBlank()) {
            return "ip:" + forwarded.split(",")[0].trim();
        }
        String realIp = value(headers.getHeaderString("X-Real-IP"));
        return realIp.isBlank() ? "ip:unknown" : "ip:" + realIp;
    }

    private String value(String value) {
        return value == null ? "" : value.trim();
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
                long retryAfterMillis = Math.max(1000, (lastRefillMillis + policy.refillPeriod().toMillis()) - System.currentTimeMillis());
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
