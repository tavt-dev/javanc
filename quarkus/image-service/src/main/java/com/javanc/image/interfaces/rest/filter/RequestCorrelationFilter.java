package com.javanc.image.interfaces.rest.filter;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tags;
import io.micrometer.core.instrument.Timer;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import org.jboss.logging.MDC;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Provider
@Priority(Priorities.AUTHENTICATION)
public class RequestCorrelationFilter implements ContainerRequestFilter, ContainerResponseFilter {

    public static final String REQUEST_ID_HEADER = "X-Request-Id";

    private static final Logger LOG = Logger.getLogger(RequestCorrelationFilter.class);
    private static final String REQUEST_ID_PROPERTY = RequestCorrelationFilter.class.getName() + ".requestId";
    private static final String START_NANOS_PROPERTY = RequestCorrelationFilter.class.getName() + ".startNanos";
    private static final String SAFE_REQUEST_ID = "^[A-Za-z0-9._:-]{1,128}$";

    @ConfigProperty(name = "quarkus.application.name")
    String serviceName;

    @Inject
    MeterRegistry meterRegistry;

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        String requestId = normalizeRequestId(requestContext.getHeaderString(REQUEST_ID_HEADER));
        requestContext.setProperty(REQUEST_ID_PROPERTY, requestId);
        requestContext.setProperty(START_NANOS_PROPERTY, System.nanoTime());
        requestContext.getHeaders().putSingle(REQUEST_ID_HEADER, requestId);
        MDC.put("requestId", requestId);
    }

    @Override
    public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext)
            throws IOException {
        String requestId = (String) requestContext.getProperty(REQUEST_ID_PROPERTY);
        if (requestId == null || requestId.isBlank()) {
            requestId = normalizeRequestId(null);
        }
        responseContext.getHeaders().putSingle(REQUEST_ID_HEADER, requestId);
        long latencyNanos = elapsedNanos(requestContext);
        String method = requestContext.getMethod();
        String path = requestContext.getUriInfo().getPath();
        int status = responseContext.getStatus();
        LOG.infof("http_request service=%s requestId=%s method=%s path=/%s status=%d latencyMs=%d",
                serviceName, requestId, method, path, status, TimeUnit.NANOSECONDS.toMillis(latencyNanos));
        recordMetric(method, path, status, latencyNanos);
        MDC.remove("requestId");
    }

    private long elapsedNanos(ContainerRequestContext requestContext) {
        Object start = requestContext.getProperty(START_NANOS_PROPERTY);
        return start instanceof Long startNanos ? System.nanoTime() - startNanos : 0L;
    }

    private void recordMetric(String method, String path, int status, long latencyNanos) {
        Timer.builder("javanc_http_server_requests")
                .tags(Tags.of("service", serviceName, "method", method, "path", "/" + path, "status",
                        Integer.toString(status), "statusClass", (status / 100) + "xx"))
                .register(meterRegistry)
                .record(Math.max(0L, latencyNanos), TimeUnit.NANOSECONDS);
    }

    private String normalizeRequestId(String candidate) {
        if (candidate != null) {
            String trimmed = candidate.trim();
            if (trimmed.matches(SAFE_REQUEST_ID)) {
                return trimmed;
            }
        }
        return UUID.randomUUID().toString();
    }
}
