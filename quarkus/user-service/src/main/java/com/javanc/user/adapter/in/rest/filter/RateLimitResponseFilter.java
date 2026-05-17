package com.javanc.user.adapter.in.rest.filter;

import com.javanc.user.application.ratelimit.RateLimitDecision;
import com.javanc.user.application.ratelimit.RateLimitResponseContext;
import jakarta.inject.Inject;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;

import java.io.IOException;

@Provider
public class RateLimitResponseFilter implements ContainerResponseFilter {

    @Inject
    RateLimitResponseContext responseContext;

    @Override
    public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext)
            throws IOException {
        RateLimitDecision decision = this.responseContext.selectedDecision();
        if (decision == null) {
            return;
        }
        responseContext.getHeaders().putSingle("RateLimit-Limit", decision.policy().capacity());
        responseContext.getHeaders().putSingle("RateLimit-Remaining", decision.remaining());
        responseContext.getHeaders().putSingle("RateLimit-Reset", decision.resetAfterSeconds());
        if (decision.enforcedBlock()) {
            responseContext.getHeaders().putSingle("Retry-After", decision.retryAfterSeconds());
        }
    }
}
