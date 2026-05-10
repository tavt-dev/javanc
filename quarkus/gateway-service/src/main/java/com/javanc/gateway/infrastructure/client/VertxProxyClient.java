package com.javanc.gateway.infrastructure.client;

import com.javanc.gateway.application.model.ForwardRequest;
import com.javanc.gateway.application.model.ForwardResponse;
import com.javanc.gateway.application.port.RequestForwardingPort;
import io.smallrye.mutiny.Uni;
import io.vertx.core.Vertx;
import io.vertx.core.buffer.Buffer;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.client.WebClient;
import jakarta.annotation.PreDestroy;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

@ApplicationScoped
public class VertxProxyClient implements RequestForwardingPort {

    private static final Logger LOG = Logger.getLogger(VertxProxyClient.class);

    private static final Set<String> HOP_BY_HOP_HEADERS = Set.of(
            "connection",
            "keep-alive",
            "proxy-authenticate",
            "proxy-authorization",
            "te",
            "trailer",
            "transfer-encoding",
            "upgrade",
            "host",
            "content-length");

    private final WebClient webClient;
    private final long timeoutMillis;

    public VertxProxyClient(Vertx vertx,
            @ConfigProperty(name = "gateway.request-timeout-millis") long timeoutMillis) {
        this.webClient = WebClient.create(vertx);
        this.timeoutMillis = timeoutMillis;
    }

    @Override
    public Uni<ForwardResponse> forward(ForwardRequest request) {
        LOG.debugf("Proxy request method=%s url=%s", request.method(), request.targetUrl());
        var outbound = webClient.requestAbs(HttpMethod.valueOf(request.method()), request.targetUrl())
                .timeout(timeoutMillis);
        request.headers().forEach((name, values) -> {
            if (forwardableHeader(name)) {
                values.forEach(value -> outbound.putHeader(name, value));
            }
        });

        byte[] body = request.body();
        var responseUni = body == null || body.length == 0
                ? outbound.send()
                : outbound.sendBuffer(Buffer.buffer(body));

        return Uni.createFrom().completionStage(responseUni.toCompletionStage())
                .map(response -> {
                    LOG.debugf("Proxy response url=%s status=%d", request.targetUrl(), response.statusCode());
                    return new ForwardResponse(response.statusCode(), responseHeaders(response.headers().entries()),
                            response.body() == null ? new byte[0] : response.body().getBytes());
                })
                .onFailure().recoverWithItem(throwable -> {
                    LOG.warnf(throwable, "Proxy request failed url=%s", request.targetUrl());
                    return new ForwardResponse(503, Map.of("Content-Type", List.of("text/plain")),
                            "Downstream service unavailable".getBytes());
                });
    }

    @PreDestroy
    void close() {
        webClient.close();
    }

    private Map<String, List<String>> responseHeaders(Iterable<Map.Entry<String, String>> entries) {
        Map<String, List<String>> headers = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        for (Map.Entry<String, String> entry : entries) {
            if (forwardableHeader(entry.getKey())) {
                headers.merge(entry.getKey(), List.of(entry.getValue()), (left, right) -> {
                    java.util.ArrayList<String> merged = new java.util.ArrayList<>(left);
                    merged.addAll(right);
                    return merged;
                });
            }
        }
        return headers;
    }

    private boolean forwardableHeader(String name) {
        return name != null && !HOP_BY_HOP_HEADERS.contains(name.toLowerCase());
    }
}
