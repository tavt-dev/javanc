package com.javanc.user.adapter.in.rest.exception;

import com.javanc.user.adapter.in.rest.dto.ApiResponse;
import com.javanc.user.application.ratelimit.RateLimitDecision;
import com.javanc.user.application.ratelimit.RateLimitExceededException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class RateLimitExceededExceptionMapper implements ExceptionMapper<RateLimitExceededException> {

    @Override
    public Response toResponse(RateLimitExceededException exception) {
        RateLimitDecision decision = exception.decision();
        return Response.status(429)
                .header("RateLimit-Limit", decision.policy().capacity())
                .header("RateLimit-Remaining", decision.remaining())
                .header("RateLimit-Reset", decision.resetAfterSeconds())
                .header("Retry-After", decision.retryAfterSeconds())
                .entity(new ApiResponse<>(false, "Too many requests", null))
                .build();
    }
}
