package com.javanc.gateway.application.service;

import com.javanc.gateway.application.ratelimit.RateLimitPolicy;
import com.javanc.gateway.domain.model.GatewayRoute;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Duration;
import java.util.Optional;

@ApplicationScoped
public class GatewayRateLimitPolicyResolver {

    private final RateLimitPolicy authPublic;
    private final RateLimitPolicy publicRead;
    private final RateLimitPolicy publicWrite;
    private final RateLimitPolicy publicUpload;
    private final RateLimitPolicy authenticatedDefaultIp;
    private final RateLimitPolicy authenticatedDefaultUser;
    private final RateLimitPolicy authenticatedUploadIp;
    private final RateLimitPolicy authenticatedUploadUser;

    public GatewayRateLimitPolicyResolver(
            @ConfigProperty(name = "gateway.rate-limit.auth-public.capacity") long authPublicCapacity,
            @ConfigProperty(name = "gateway.rate-limit.public-read.capacity") long publicReadCapacity,
            @ConfigProperty(name = "gateway.rate-limit.public-write.capacity") long publicWriteCapacity,
            @ConfigProperty(name = "gateway.rate-limit.public-upload.capacity") long publicUploadCapacity,
            @ConfigProperty(name = "gateway.rate-limit.authenticated-default.ip-capacity") long authenticatedDefaultIpCapacity,
            @ConfigProperty(name = "gateway.rate-limit.authenticated-default.user-capacity") long authenticatedDefaultUserCapacity,
            @ConfigProperty(name = "gateway.rate-limit.authenticated-upload.ip-capacity") long authenticatedUploadIpCapacity,
            @ConfigProperty(name = "gateway.rate-limit.authenticated-upload.user-capacity") long authenticatedUploadUserCapacity) {
        this.authPublic = new RateLimitPolicy("auth-public", authPublicCapacity, Duration.ofMinutes(1));
        this.publicRead = new RateLimitPolicy("public-read", publicReadCapacity, Duration.ofMinutes(1));
        this.publicWrite = new RateLimitPolicy("public-write", publicWriteCapacity, Duration.ofMinutes(1));
        this.publicUpload = new RateLimitPolicy("public-upload", publicUploadCapacity, Duration.ofMinutes(1));
        this.authenticatedDefaultIp = new RateLimitPolicy("authenticated-default-ip", authenticatedDefaultIpCapacity,
                Duration.ofMinutes(1));
        this.authenticatedDefaultUser = new RateLimitPolicy("authenticated-default-user",
                authenticatedDefaultUserCapacity, Duration.ofMinutes(1));
        this.authenticatedUploadIp = new RateLimitPolicy("authenticated-upload-ip", authenticatedUploadIpCapacity,
                Duration.ofHours(1));
        this.authenticatedUploadUser = new RateLimitPolicy("authenticated-upload-user",
                authenticatedUploadUserCapacity, Duration.ofHours(1));
    }

    public Optional<RateLimitPolicy> ipPolicy(String method, String path, GatewayRoute route) {
        if (route.protectedRoute()) {
            return Optional.of(uploadPath(method, path) ? authenticatedUploadIp : authenticatedDefaultIp);
        }
        if (path.startsWith("/auth")) {
            return Optional.of(authPublic);
        }
        if ("POST".equals(method) && "/image/save".equals(path)) {
            return Optional.of(publicUpload);
        }
        if ("GET".equals(method) && (path.startsWith("/image") || path.startsWith("/notification"))) {
            return Optional.of(publicRead);
        }
        if (("POST".equals(method) || "PUT".equals(method)) && path.startsWith("/notification")) {
            return Optional.of(publicWrite);
        }
        return Optional.empty();
    }

    public Optional<RateLimitPolicy> userPolicy(String method, String path, GatewayRoute route) {
        if (!route.protectedRoute()) {
            return Optional.empty();
        }
        return Optional.of(uploadPath(method, path) ? authenticatedUploadUser : authenticatedDefaultUser);
    }

    private boolean uploadPath(String method, String path) {
        return ("POST".equals(method) && "/profiles/me/avatar".equals(path))
                || ("POST".equals(method) && "/manager/admin/company/create".equals(path));
    }
}
