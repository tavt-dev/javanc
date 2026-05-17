package com.javanc.gateway.infrastructure.ratelimit;

import com.javanc.gateway.application.ratelimit.RateLimitDecision;
import com.javanc.gateway.application.ratelimit.RateLimitKeyFactory;
import com.javanc.gateway.application.ratelimit.RateLimitMetrics;
import com.javanc.gateway.application.ratelimit.RateLimitMode;
import com.javanc.gateway.application.ratelimit.RateLimitPolicy;
import io.quarkus.redis.client.RedisClientName;
import io.quarkus.redis.datasource.RedisDataSource;
import io.vertx.mutiny.redis.client.Response;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Clock;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicLong;

@ApplicationScoped
public class RedisTokenBucketLimiter {

    private static final Logger LOG = Logger.getLogger(RedisTokenBucketLimiter.class);
    private static final long REDIS_WARNING_INTERVAL_MILLIS = Duration.ofMinutes(1).toMillis();
    private static final String SCRIPT = """
            local key = KEYS[1]
            local capacity = tonumber(ARGV[1])
            local period = tonumber(ARGV[2])
            local now = tonumber(ARGV[3])
            local cost = tonumber(ARGV[4])
            local ttl = tonumber(ARGV[5])
            local current = redis.call('HMGET', key, 'tokens', 'last_refill')
            local tokens = tonumber(current[1])
            local last_refill = tonumber(current[2])
            if tokens == nil then tokens = capacity end
            if last_refill == nil then last_refill = now end
            local elapsed = math.max(0, now - last_refill)
            local refill = elapsed * capacity / period
            tokens = math.min(capacity, tokens + refill)
            local allowed = 0
            local retry_after = 0
            if tokens >= cost then
              tokens = tokens - cost
              allowed = 1
            else
              retry_after = math.ceil((cost - tokens) * period / capacity)
            end
            local reset_after = math.ceil((capacity - tokens) * period / capacity)
            redis.call('HSET', key, 'tokens', tokens, 'last_refill', now)
            redis.call('EXPIRE', key, ttl)
            return {allowed, math.floor(tokens), reset_after, retry_after}
            """;

    private final RedisDataSource redisDataSource;
    private final RateLimitKeyFactory keyFactory;
    private final RateLimitMetrics metrics;
    private final Clock clock;
    private final boolean enabled;
    private final boolean failOpen;
    private final RateLimitMode mode;
    private final AtomicLong nextRedisWarningAtMillis = new AtomicLong();

    @Inject
    public RedisTokenBucketLimiter(@RedisClientName("foundation") RedisDataSource redisDataSource,
            RateLimitKeyFactory keyFactory,
            RateLimitMetrics metrics,
            Clock clock,
            @ConfigProperty(name = "rate-limit.enabled") boolean enabled,
            @ConfigProperty(name = "rate-limit.fail-open") boolean failOpen,
            @ConfigProperty(name = "rate-limit.mode") String mode) {
        this.redisDataSource = redisDataSource;
        this.keyFactory = keyFactory;
        this.metrics = metrics;
        this.clock = clock;
        this.enabled = enabled;
        this.failOpen = failOpen;
        this.mode = RateLimitMode.from(mode);
    }

    public RateLimitDecision evaluate(String service, RateLimitPolicy policy, String identity, String identityType) {
        if (!enabled) {
            return RateLimitDecision.bypassed(policy, identityType, mode);
        }
        try {
            Response response = redisDataSource.execute(
                    "EVAL",
                    SCRIPT,
                    "1",
                    keyFactory.key(service, policy.name(), identity),
                    Long.toString(policy.capacity()),
                    Long.toString(policy.refillPeriod().toMillis()),
                    Long.toString(clock.millis()),
                    "1",
                    Long.toString(policy.ttlSeconds()));
            boolean allowed = response.get(0).toLong() == 1L;
            long remaining = response.get(1).toLong();
            Duration resetAfter = Duration.ofMillis(response.get(2).toLong());
            Duration retryAfter = Duration.ofMillis(response.get(3).toLong());
            RateLimitDecision decision = allowed
                    ? RateLimitDecision.allowed(policy, remaining, resetAfter, identityType, mode)
                    : RateLimitDecision.denied(policy, remaining, resetAfter, retryAfter, identityType, mode);
            metrics.decision(decision);
            return decision;
        } catch (RuntimeException exception) {
            metrics.redisError("eval");
            logRedisFailure(policy, identityType, exception);
            if (failOpen) {
                return RateLimitDecision.bypassed(policy, identityType, mode);
            }
            RateLimitDecision decision = RateLimitDecision.denied(policy, 0L, policy.refillPeriod(),
                    policy.refillPeriod(), identityType, mode);
            metrics.decision(decision);
            return decision;
        }
    }

    private void logRedisFailure(RateLimitPolicy policy, String identityType, RuntimeException exception) {
        long now = clock.millis();
        long nextAllowed = nextRedisWarningAtMillis.get();
        if (now < nextAllowed || !nextRedisWarningAtMillis.compareAndSet(nextAllowed,
                now + REDIS_WARNING_INTERVAL_MILLIS)) {
            return;
        }
        LOG.warnf("Rate-limit Redis evaluation failed policy=%s identityType=%s failOpen=%s cause=%s",
                policy.name(), identityType, failOpen, exception.getClass().getSimpleName());
    }
}
