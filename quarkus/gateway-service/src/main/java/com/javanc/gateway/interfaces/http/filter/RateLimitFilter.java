package com.javanc.gateway.interfaces.http.filter;

import com.javanc.gateway.application.ratelimit.RateLimitDecision;
import com.javanc.gateway.application.ratelimit.RateLimitResponseContext;
import com.javanc.gateway.application.service.ClientIpResolver;
import com.javanc.gateway.application.service.GatewayRateLimitService;
import com.javanc.gateway.application.service.RouteMatcher;
import io.vertx.core.http.HttpServerRequest;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.container.PreMatching;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

import java.io.IOException;

@Provider
@PreMatching
@Priority(Priorities.AUTHENTICATION + 10)
public class RateLimitFilter implements ContainerRequestFilter, ContainerResponseFilter {

    public static final String CLIENT_IP_PROPERTY = RateLimitFilter.class.getName() + ".clientIp";
    public static final String CLIENT_IP_HEADER = "X-Client-IP";

    private final RouteMatcher routeMatcher;
    private final GatewayRateLimitService rateLimitService;
    private final ClientIpResolver clientIpResolver;
    private final RateLimitResponseContext responseContext;

    @Context
    HttpServerRequest serverRequest;

    @Inject
    public RateLimitFilter(RouteMatcher routeMatcher, GatewayRateLimitService rateLimitService,
            ClientIpResolver clientIpResolver, RateLimitResponseContext responseContext) {
        this.routeMatcher = routeMatcher;
        this.rateLimitService = rateLimitService;
        this.clientIpResolver = clientIpResolver;
        this.responseContext = responseContext;
    }

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        String method = requestContext.getMethod();
        String path = "/" + requestContext.getUriInfo().getPath();
        String clientIp = clientIpResolver.resolve(serverRequest.remoteAddress().host(),
                requestContext.getHeaderString("X-Forwarded-For"));
        requestContext.setProperty(CLIENT_IP_PROPERTY, clientIp);
        requestContext.getHeaders().putSingle(CLIENT_IP_HEADER, clientIp);
        requestContext.getHeaders().putSingle("X-Forwarded-For", clientIp);

        if (skip(method, path)) {
            return;
        }
        routeMatcher.match(path)
                .flatMap(route -> rateLimitService.evaluateIp(method, path, route, clientIp))
                .ifPresent(decision -> {
                    responseContext.consider(decision);
                    if (decision.enforcedBlock()) {
                        requestContext.abortWith(tooManyRequests(decision));
                    }
                });
    }

    @Override
    public void filter(ContainerRequestContext requestContext, ContainerResponseContext response) throws IOException {
        RateLimitDecision decision = responseContext.selectedDecision();
        if (decision == null) {
            return;
        }
        response.getHeaders().putSingle("RateLimit-Limit", decision.policy().capacity());
        response.getHeaders().putSingle("RateLimit-Remaining", decision.remaining());
        response.getHeaders().putSingle("RateLimit-Reset", decision.resetAfterSeconds());
        if (decision.enforcedBlock()) {
            response.getHeaders().putSingle("Retry-After", decision.retryAfterSeconds());
        }
    }

    private boolean skip(String method, String path) {
        return "OPTIONS".equalsIgnoreCase(method) || path.startsWith("/q/");
    }

    private Response tooManyRequests(RateLimitDecision decision) {
        return Response.status(429)
                .type(MediaType.APPLICATION_JSON)
                .header("RateLimit-Limit", decision.policy().capacity())
                .header("RateLimit-Remaining", decision.remaining())
                .header("RateLimit-Reset", decision.resetAfterSeconds())
                .header("Retry-After", decision.retryAfterSeconds())
                .entity("{\"success\":false,\"message\":\"Too many requests\",\"data\":null}")
                .build();
    }
}
