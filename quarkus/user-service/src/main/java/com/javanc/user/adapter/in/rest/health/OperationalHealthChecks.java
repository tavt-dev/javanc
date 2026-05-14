package com.javanc.user.adapter.in.rest.health;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.health.HealthCheck;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.eclipse.microprofile.health.Liveness;
import org.eclipse.microprofile.health.Readiness;

@Liveness
class ServiceLivenessCheck implements HealthCheck {

    @ConfigProperty(name = "quarkus.application.name")
    String serviceName;

    @Override
    public HealthCheckResponse call() {
        return HealthCheckResponse.up(serviceName + "-live");
    }
}

@Readiness
class ServiceReadinessCheck implements HealthCheck {

    @ConfigProperty(name = "quarkus.application.name")
    String serviceName;

    @Override
    public HealthCheckResponse call() {
        return HealthCheckResponse.up(serviceName + "-ready");
    }
}
