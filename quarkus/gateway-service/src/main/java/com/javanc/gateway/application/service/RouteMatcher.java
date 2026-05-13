package com.javanc.gateway.application.service;

import com.javanc.gateway.domain.model.GatewayRoute;
import com.javanc.gateway.infrastructure.config.GatewayRouteConfig;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class RouteMatcher {

    private final List<GatewayRoute> routes;

    @Inject
    public RouteMatcher(GatewayRouteConfig routeConfig) {
        this.routes = routeConfig.routes().stream()
                .sorted(Comparator.comparingInt((GatewayRoute route) -> route.prefix().length()).reversed())
                .toList();
    }

    public Optional<GatewayRoute> match(String rawPath) {
        String path = rawPath == null || rawPath.isBlank() ? "/" : rawPath;
        return routes.stream()
                .filter(route -> route.matches(path))
                .findFirst();
    }
}
