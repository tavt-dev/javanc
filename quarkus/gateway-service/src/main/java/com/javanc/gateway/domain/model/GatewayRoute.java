package com.javanc.gateway.domain.model;

public class GatewayRoute {

    private final String id;
    private final String prefix;
    private final String targetBaseUrl;
    private final RoutePolicy policy;
    private final boolean enabled;

    public GatewayRoute(String id, String prefix, String targetBaseUrl, RoutePolicy policy, boolean enabled) {
        this.id = id;
        this.prefix = prefix;
        this.targetBaseUrl = trimTrailingSlash(targetBaseUrl);
        this.policy = policy;
        this.enabled = enabled;
    }

    public String id() {
        return id;
    }

    public String prefix() {
        return prefix;
    }

    public String targetBaseUrl() {
        return targetBaseUrl;
    }

    public RoutePolicy policy() {
        return policy;
    }

    public boolean enabled() {
        return enabled;
    }

    public boolean matches(String path) {
        return enabled && (path.equals(prefix) || path.startsWith(prefix + "/"));
    }

    public boolean protectedRoute() {
        return policy == RoutePolicy.PROTECTED;
    }

    private static String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String trimmed = value.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }
}
