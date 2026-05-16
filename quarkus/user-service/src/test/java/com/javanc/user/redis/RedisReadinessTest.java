package com.javanc.user.redis;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

import java.util.Map;

import org.junit.jupiter.api.Test;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.QuarkusTestProfile;
import io.quarkus.test.junit.TestProfile;

@QuarkusTest
@TestProfile(RedisReadinessTest.RedisUnavailableProfile.class)
class RedisReadinessTest {

    @Test
    void readinessIsDownWhenEnabledRedisIsUnavailable() {
        given()
                .when()
                .get("/q/health/ready")
                .then()
                .statusCode(503)
                .body("status", equalTo("DOWN"));
    }

    public static class RedisUnavailableProfile implements QuarkusTestProfile {
        @Override
        public Map<String, String> getConfigOverrides() {
            return Map.of(
                    "redis.enabled", "true",
                    "quarkus.redis.health.enabled", "true",
                    "quarkus.redis.devservices.enabled", "false",
                    "quarkus.redis.foundation.hosts", "redis://localhost:6399/0",
                    "quarkus.redis.foundation.devservices.enabled", "false");
        }
    }
}
