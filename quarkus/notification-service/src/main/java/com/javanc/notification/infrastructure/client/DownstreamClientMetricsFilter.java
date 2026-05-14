package com.javanc.notification.infrastructure.client;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tags;
import io.micrometer.core.instrument.Timer;
import jakarta.inject.Inject;
import jakarta.ws.rs.client.ClientRequestContext;
import jakarta.ws.rs.client.ClientRequestFilter;
import jakarta.ws.rs.client.ClientResponseContext;
import jakarta.ws.rs.client.ClientResponseFilter;
import jakarta.ws.rs.ext.Provider;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Provider
public class DownstreamClientMetricsFilter implements ClientRequestFilter, ClientResponseFilter {

    private static final String START_NANOS_PROPERTY = DownstreamClientMetricsFilter.class.getName() + ".startNanos";

    @Inject
    MeterRegistry meterRegistry;

    @Override
    public void filter(ClientRequestContext requestContext) throws IOException {
        requestContext.setProperty(START_NANOS_PROPERTY, System.nanoTime());
    }

    @Override
    public void filter(ClientRequestContext requestContext, ClientResponseContext responseContext) throws IOException {
        long latencyNanos = elapsedNanos(requestContext);
        int status = responseContext.getStatus();
        Timer.builder("javanc_downstream_http_client_requests")
                .tags(Tags.of("service", "notification-service", "targetService", targetService(requestContext),
                        "method", requestContext.getMethod(), "status", Integer.toString(status), "statusClass",
                        (status / 100) + "xx"))
                .register(meterRegistry)
                .record(Math.max(0L, latencyNanos), TimeUnit.NANOSECONDS);
    }

    private long elapsedNanos(ClientRequestContext requestContext) {
        Object start = requestContext.getProperty(START_NANOS_PROPERTY);
        return start instanceof Long startNanos ? System.nanoTime() - startNanos : 0L;
    }

    private String targetService(ClientRequestContext requestContext) {
        String host = requestContext.getUri() == null ? null : requestContext.getUri().getHost();
        return host == null || host.isBlank() ? "unknown" : host;
    }
}
