package com.javanc.gateway.application.model;

import com.javanc.gateway.domain.model.GatewayRoute;

import java.util.List;
import java.util.Map;

public class ForwardRequest {

    private final GatewayRoute route;
    private final String method;
    private final String rawPath;
    private final String rawQuery;
    private final Map<String, List<String>> headers;
    private final byte[] body;

    public ForwardRequest(GatewayRoute route, String method, String rawPath, String rawQuery,
            Map<String, List<String>> headers, byte[] body) {
        this.route = route;
        this.method = method;
        this.rawPath = rawPath;
        this.rawQuery = rawQuery;
        this.headers = headers;
        this.body = body;
    }

    public GatewayRoute route() {
        return route;
    }

    public String method() {
        return method;
    }

    public String rawPath() {
        return rawPath;
    }

    public String rawQuery() {
        return rawQuery;
    }

    public Map<String, List<String>> headers() {
        return headers;
    }

    public byte[] body() {
        return body;
    }

    public String targetUrl() {
        StringBuilder builder = new StringBuilder(route.targetBaseUrl()).append(rawPath);
        if (rawQuery != null && !rawQuery.isBlank()) {
            builder.append('?').append(rawQuery);
        }
        return builder.toString();
    }
}
