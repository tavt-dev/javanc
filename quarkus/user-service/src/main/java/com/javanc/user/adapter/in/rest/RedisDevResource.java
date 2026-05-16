package com.javanc.user.adapter.in.rest;

import com.javanc.user.adapter.in.rest.dto.ApiResponse;
import com.javanc.user.adapter.out.redis.RedisHealthService;
import com.javanc.user.adapter.out.redis.RedisHealthService.RedisHealthStatus;

import io.quarkus.arc.profile.IfBuildProfile;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@IfBuildProfile("dev")
@Path("/dev/redis")
@Produces(MediaType.APPLICATION_JSON)
public class RedisDevResource {

    @Inject
    RedisHealthService redisHealthService;

    @GET
    @Path("/ping")
    public Response ping() {
        RedisHealthStatus status = redisHealthService.status();
        return switch (status) {
            case UP -> Response.ok(response(true, "Redis is reachable", true, status)).build();
            case DISABLED -> Response.ok(response(true, "Redis is disabled", false, status)).build();
            case DOWN -> Response.status(Response.Status.SERVICE_UNAVAILABLE)
                    .entity(response(false, "Redis is unavailable", true, status))
                    .build();
        };
    }

    private static ApiResponse<RedisPingStatus> response(boolean success, String message, boolean enabled,
            RedisHealthStatus status) {
        return new ApiResponse<>(success, message, new RedisPingStatus(enabled, status.name()));
    }

    public record RedisPingStatus(boolean enabled, String status) {
    }
}
