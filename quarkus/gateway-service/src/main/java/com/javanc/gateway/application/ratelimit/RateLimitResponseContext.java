package com.javanc.gateway.application.ratelimit;

import jakarta.enterprise.context.RequestScoped;

@RequestScoped
public class RateLimitResponseContext {

    private RateLimitDecision selectedDecision;

    public void consider(RateLimitDecision decision) {
        if (decision == null || !decision.evaluated()) {
            return;
        }
        if (selectedDecision == null
                || decision.enforcedBlock()
                || decision.remaining() < selectedDecision.remaining()) {
            selectedDecision = decision;
        }
    }

    public RateLimitDecision selectedDecision() {
        return selectedDecision;
    }
}
