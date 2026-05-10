package com.javanc.gateway.interfaces.http;

import jakarta.annotation.Priority;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.container.PreMatching;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Provider
@PreMatching
@Priority(Priorities.AUTHENTICATION)
public class CorsFilter implements ContainerRequestFilter, ContainerResponseFilter {

    private static final String ACCESS_CONTROL_REQUEST_METHOD = "Access-Control-Request-Method";
    private static final String ACCESS_CONTROL_REQUEST_HEADERS = "Access-Control-Request-Headers";
    private static final String ORIGIN = "Origin";
    private static final String ACCESS_CONTROL_ALLOW_ORIGIN = "Access-Control-Allow-Origin";
    private static final String ACCESS_CONTROL_ALLOW_CREDENTIALS = "Access-Control-Allow-Credentials";
    private static final String ACCESS_CONTROL_ALLOW_METHODS = "Access-Control-Allow-Methods";
    private static final String ACCESS_CONTROL_ALLOW_HEADERS = "Access-Control-Allow-Headers";
    private static final String ACCESS_CONTROL_EXPOSE_HEADERS = "Access-Control-Expose-Headers";
    private static final String ACCESS_CONTROL_MAX_AGE = "Access-Control-Max-Age";
    private static final String VARY = "Vary";

    private final Set<String> allowedOrigins;
    private final String allowedMethods;
    private final String allowedHeaders;
    private final String exposedHeaders;

    public CorsFilter(
            @ConfigProperty(name = "gateway.cors.origins") String origins,
            @ConfigProperty(name = "gateway.cors.methods") String methods,
            @ConfigProperty(name = "gateway.cors.headers") String headers,
            @ConfigProperty(name = "gateway.cors.exposed-headers") String exposedHeaders) {
        this.allowedOrigins = Arrays.stream(origins.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(Collectors.toUnmodifiableSet());
        this.allowedMethods = methods;
        this.allowedHeaders = headers;
        this.exposedHeaders = exposedHeaders;
    }

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        if ("OPTIONS".equalsIgnoreCase(requestContext.getMethod())
                && requestContext.getHeaderString(ACCESS_CONTROL_REQUEST_METHOD) != null) {
            Response.ResponseBuilder builder = Response.noContent();
            addCorsHeaders(builder, requestContext.getHeaderString(ORIGIN),
                    requestContext.getHeaderString(ACCESS_CONTROL_REQUEST_HEADERS));
            requestContext.abortWith(builder.build());
        }
    }

    @Override
    public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext)
            throws IOException {
        String origin = requestContext.getHeaderString(ORIGIN);
        if (!isAllowed(origin)) {
            return;
        }
        responseContext.getHeaders().putSingle(ACCESS_CONTROL_ALLOW_ORIGIN, origin);
        responseContext.getHeaders().putSingle(ACCESS_CONTROL_ALLOW_CREDENTIALS, "true");
        responseContext.getHeaders().putSingle(ACCESS_CONTROL_ALLOW_METHODS, allowedMethods);
        responseContext.getHeaders().putSingle(ACCESS_CONTROL_ALLOW_HEADERS, requestedOrDefaultHeaders(requestContext));
        responseContext.getHeaders().putSingle(ACCESS_CONTROL_EXPOSE_HEADERS, exposedHeaders);
        responseContext.getHeaders().putSingle(ACCESS_CONTROL_MAX_AGE, "86400");
        responseContext.getHeaders().add(VARY, "Origin");
        responseContext.getHeaders().add(VARY, ACCESS_CONTROL_REQUEST_METHOD);
        responseContext.getHeaders().add(VARY, ACCESS_CONTROL_REQUEST_HEADERS);
    }

    private void addCorsHeaders(Response.ResponseBuilder builder, String origin, String requestedHeaders) {
        if (!isAllowed(origin)) {
            return;
        }
        builder.header(ACCESS_CONTROL_ALLOW_ORIGIN, origin)
                .header(ACCESS_CONTROL_ALLOW_CREDENTIALS, "true")
                .header(ACCESS_CONTROL_ALLOW_METHODS, allowedMethods)
                .header(ACCESS_CONTROL_ALLOW_HEADERS, requestedHeaders == null || requestedHeaders.isBlank()
                        ? allowedHeaders
                        : requestedHeaders)
                .header(ACCESS_CONTROL_EXPOSE_HEADERS, exposedHeaders)
                .header(ACCESS_CONTROL_MAX_AGE, "86400")
                .header(VARY, "Origin")
                .header(VARY, ACCESS_CONTROL_REQUEST_METHOD)
                .header(VARY, ACCESS_CONTROL_REQUEST_HEADERS);
    }

    private String requestedOrDefaultHeaders(ContainerRequestContext requestContext) {
        String requestedHeaders = requestContext.getHeaderString(ACCESS_CONTROL_REQUEST_HEADERS);
        return requestedHeaders == null || requestedHeaders.isBlank() ? allowedHeaders : requestedHeaders;
    }

    private boolean isAllowed(String origin) {
        return origin != null && (allowedOrigins.contains("*") || allowedOrigins.contains(origin));
    }
}
