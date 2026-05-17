package com.javanc.user.application.ratelimit;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tags;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;
import org.jboss.logging.MDC;

@ApplicationScoped
public class RateLimitMetrics {

    private static final Logger LOG = Logger.getLogger(RateLimitMetrics.class);

    private final MeterRegistry meterRegistry;

    @Inject
    public RateLimitMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    public void decision(RateLimitDecision decision) {
        String outcome = decision.allowed() ? "allowed" : decision.mode() == RateLimitMode.SHADOW
                ? "would_block"
                : "blocked";
        Counter.builder("javanc_rate_limit_decision_total")
                .tags(Tags.of(
                        "service", "user-service",
                        "policy", decision.policy().name(),
                        "mode", decision.mode().metricValue(),
                        "outcome", outcome))
                .register(meterRegistry)
                .increment();
        if (!decision.allowed() && decision.mode() == RateLimitMode.SHADOW) {
            Counter.builder("javanc_rate_limit_shadow_would_block_total")
                    .tags(Tags.of("service", "user-service", "policy", decision.policy().name()))
                    .register(meterRegistry)
                    .increment();
        }
        if (!decision.allowed()) {
            LOG.warnf("rate_limit_decision service=user-service requestId=%s policy=%s mode=%s outcome=%s identityType=%s",
                    requestId(), decision.policy().name(), decision.mode().metricValue(), outcome,
                    decision.identityType());
        }
    }

    public void redisError(String operation) {
        Counter.builder("javanc_rate_limit_redis_error_total")
                .tags(Tags.of("service", "user-service", "operation", operation))
                .register(meterRegistry)
                .increment();
    }

    private String requestId() {
        Object requestId = MDC.get("requestId");
        return requestId instanceof String value && !value.isBlank() ? value : "unknown";
    }
}
