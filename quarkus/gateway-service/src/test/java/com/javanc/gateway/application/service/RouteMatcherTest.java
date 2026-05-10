package com.javanc.gateway.application.service;

import com.javanc.gateway.domain.model.GatewayRoute;
import com.javanc.gateway.domain.model.RoutePolicy;
import com.javanc.gateway.infrastructure.config.GatewayRouteConfig;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RouteMatcherTest {

    @Test
    void matchesEnabledRouteByPrefixBoundary() {
        RouteMatcher matcher = new RouteMatcher(new TestRouteConfig());

        assertEquals("profile-service", matcher.match("/profile/user/getAll").orElseThrow().id());
        assertTrue(matcher.match("/profileabc").isEmpty());
    }

    @Test
    void prefersLongestPrefixAndSkipsDisabledRoutes() {
        RouteMatcher matcher = new RouteMatcher(new TestRouteConfig());

        assertEquals("profile-hr-service", matcher.match("/profile-hr/user/getAll").orElseThrow().id());
        assertTrue(matcher.match("/disabled/test").isEmpty());
    }

    private static class TestRouteConfig extends GatewayRouteConfig {
        @Override
        public List<GatewayRoute> routes() {
            return List.of(
                    new GatewayRoute("profile-service", "/profile", "http://profile", RoutePolicy.PROTECTED, true),
                    new GatewayRoute("profile-hr-service", "/profile-hr", "http://profile-hr", RoutePolicy.PUBLIC, true),
                    new GatewayRoute("disabled-service", "/disabled", "", RoutePolicy.PUBLIC, false));
        }
    }
}
