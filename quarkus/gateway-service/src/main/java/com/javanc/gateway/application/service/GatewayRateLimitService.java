package com.javanc.gateway.application.service;

import com.javanc.gateway.application.ratelimit.RateLimitDecision;
import com.javanc.gateway.application.ratelimit.RateLimitPolicy;
import com.javanc.gateway.domain.model.GatewayRoute;
import com.javanc.gateway.infrastructure.ratelimit.RedisTokenBucketLimiter;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Optional;

@ApplicationScoped
public class GatewayRateLimitService {

    private final GatewayRateLimitPolicyResolver policyResolver;
    private final RedisTokenBucketLimiter limiter;

    @Inject
    public GatewayRateLimitService(GatewayRateLimitPolicyResolver policyResolver, RedisTokenBucketLimiter limiter) {
        this.policyResolver = policyResolver;
        this.limiter = limiter;
    }

    public Optional<RateLimitDecision> evaluateIp(String method, String path, GatewayRoute route, String clientIp) {
        return policyResolver.ipPolicy(method, path, route)
                .map(policy -> evaluate(policy, clientIp, "ip"));
    }

    public Optional<RateLimitDecision> evaluateUser(String method, String path, GatewayRoute route, Integer userId) {
        if (userId == null) {
            return Optional.empty();
        }
        return policyResolver.userPolicy(method, path, route)
                .map(policy -> evaluate(policy, Integer.toString(userId), "user"));
    }

    private RateLimitDecision evaluate(RateLimitPolicy policy, String identity, String identityType) {
        return limiter.evaluate("gateway-service", policy, identity, identityType);
    }
}
