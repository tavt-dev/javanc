package com.javanc.gateway.infrastructure.config;

import com.javanc.gateway.domain.model.GatewayRoute;
import com.javanc.gateway.domain.model.RoutePolicy;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class GatewayRouteConfig {

    @ConfigProperty(name = "services.user.url")
    String userUrl;

    @ConfigProperty(name = "services.profile.url")
    String profileUrl;

    @ConfigProperty(name = "services.project.url")
    String projectUrl;

    @ConfigProperty(name = "services.notification.url")
    String notificationUrl;

    @ConfigProperty(name = "services.manager.url")
    String managerUrl;

    @ConfigProperty(name = "services.image.url")
    String imageUrl;

    @ConfigProperty(name = "services.profile-hr.url")
    Optional<String> profileHrUrl;

    @ConfigProperty(name = "gateway.auth.protected-prefixes")
    String protectedPrefixes;

    public List<GatewayRoute> routes() {
        Set<String> protectedRoutePrefixes = protectedRoutePrefixes();
        return List.of(
                route("auth-service", "/auth", userUrl, protectedRoutePrefixes),
                route("user-service", "/users", userUrl, protectedRoutePrefixes),
                route("profile-service", "/profiles", profileUrl, protectedRoutePrefixes),
                route("project-service", "/project", projectUrl, protectedRoutePrefixes),
                optionalRoute("profile-hr-service", "/profile-hr", profileHrUrl, protectedRoutePrefixes),
                route("notification-service", "/notification", notificationUrl, protectedRoutePrefixes),
                route("manager-service", "/manager", managerUrl, protectedRoutePrefixes),
                route("image-service", "/image", imageUrl, protectedRoutePrefixes));
    }

    private GatewayRoute optionalRoute(String id, String prefix, Optional<String> baseUrl, Set<String> protectedRoutePrefixes) {
        String value = baseUrl.orElse("").trim();
        return new GatewayRoute(id, prefix, value, policy(prefix, protectedRoutePrefixes), !value.isBlank());
    }

    private GatewayRoute route(String id, String prefix, String baseUrl, Set<String> protectedRoutePrefixes) {
        return new GatewayRoute(id, prefix, baseUrl, policy(prefix, protectedRoutePrefixes), true);
    }

    private RoutePolicy policy(String prefix, Set<String> protectedRoutePrefixes) {
        if ("/profiles".equals(prefix) && protectedRoutePrefixes.contains("/profile")) {
            return RoutePolicy.PROTECTED;
        }
        return protectedRoutePrefixes.contains(prefix) ? RoutePolicy.PROTECTED : RoutePolicy.PUBLIC;
    }

    private Set<String> protectedRoutePrefixes() {
        return Arrays.stream(protectedPrefixes.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .collect(Collectors.toUnmodifiableSet());
    }
}
