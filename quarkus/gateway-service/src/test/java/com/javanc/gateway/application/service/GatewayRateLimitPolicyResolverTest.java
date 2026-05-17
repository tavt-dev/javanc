package com.javanc.gateway.application.service;

import com.javanc.gateway.domain.model.GatewayRoute;
import com.javanc.gateway.domain.model.RoutePolicy;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GatewayRateLimitPolicyResolverTest {

    private final GatewayRateLimitPolicyResolver resolver = new GatewayRateLimitPolicyResolver(
            60, 180, 30, 10, 600, 300, 60, 20);

    @Test
    void prefersUploadPolicyOverProtectedDefault() {
        GatewayRoute protectedRoute = new GatewayRoute("profile-service", "/profiles", "http://profile",
                RoutePolicy.PROTECTED, true);

        assertEquals("authenticated-upload-ip",
                resolver.ipPolicy("POST", "/profiles/me/avatar", protectedRoute).orElseThrow().name());
        assertEquals("authenticated-upload-user",
                resolver.userPolicy("POST", "/profiles/me/avatar", protectedRoute).orElseThrow().name());
    }

    @Test
    void resolvesPublicPolicyGroups() {
        GatewayRoute imageRoute = new GatewayRoute("image-service", "/image", "http://image", RoutePolicy.PUBLIC, true);
        GatewayRoute notificationRoute = new GatewayRoute("notification-service", "/notification", "http://notification",
                RoutePolicy.PUBLIC, true);

        assertEquals("public-upload",
                resolver.ipPolicy("POST", "/image/save", imageRoute).orElseThrow().name());
        assertEquals("public-read",
                resolver.ipPolicy("GET", "/notification/getAll", notificationRoute).orElseThrow().name());
        assertEquals("public-write",
                resolver.ipPolicy("POST", "/notification/create", notificationRoute).orElseThrow().name());
    }
}
