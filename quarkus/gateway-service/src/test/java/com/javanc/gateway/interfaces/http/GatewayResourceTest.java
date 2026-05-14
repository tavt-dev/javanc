package com.javanc.gateway.interfaces.http;

import com.javanc.gateway.application.model.ForwardRequest;
import com.javanc.gateway.application.model.ForwardResponse;
import com.javanc.gateway.application.port.RequestForwardingPort;
import com.javanc.gateway.application.port.TokenValidationPort;
import io.quarkus.test.junit.QuarkusTest;
import io.smallrye.mutiny.Uni;
import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Alternative;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.anyOf;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;

@QuarkusTest
class GatewayResourceTest {

    @BeforeEach
    void reset() {
        TestForwardingPort.lastRequest = null;
        TestTokenValidationPort.lastToken = null;
    }

    @Test
    void publicRouteForwardsWithoutAuth() {
        given()
                .when().get("/image/getAll?size=1")
                .then()
                .statusCode(200)
                .header("X-Request-Id", notNullValue())
                .body("routed", equalTo(true))
                .body("route", equalTo("image-service"));

        assertEquals("/image/getAll", TestForwardingPort.lastRequest.rawPath());
        assertEquals("size=1", TestForwardingPort.lastRequest.rawQuery());
        assertEquals("http://image-service.test/image/getAll?size=1", TestForwardingPort.lastRequest.targetUrl());
        org.junit.jupiter.api.Assertions.assertNull(TestTokenValidationPort.lastToken);
    }

    @Test
    void requestIdHeaderIsPreservedAndForwarded() {
        given()
                .header("X-Request-Id", "phase3-request-1")
                .when().get("/image/getAll")
                .then()
                .statusCode(200)
                .header("X-Request-Id", "phase3-request-1");

        assertEquals("phase3-request-1", TestForwardingPort.lastRequest.headers().get("X-Request-Id").get(0));
    }

    @Test
    void invalidRequestIdHeaderIsReplaced() {
        given()
                .header("X-Request-Id", "invalid request id")
                .when().get("/image/getAll")
                .then()
                .statusCode(200)
                .header("X-Request-Id", not("invalid request id"));

        org.junit.jupiter.api.Assertions.assertNotEquals("invalid request id",
                TestForwardingPort.lastRequest.headers().get("X-Request-Id").get(0));
    }

    @Test
    void notificationRouteForwardsWithoutGatewayAuth() {
        given()
                .when().get("/notification/getAll")
                .then()
                .statusCode(200)
                .body("routed", equalTo(true))
                .body("route", equalTo("notification-service"));

        assertEquals("/notification/getAll", TestForwardingPort.lastRequest.rawPath());
        org.junit.jupiter.api.Assertions.assertNull(TestTokenValidationPort.lastToken);
    }

    @Test
    void protectedRouteRejectsMissingToken() {
        given()
                .when().get("/profiles")
                .then()
                .statusCode(401)
                .body("statusCode", equalTo(1041))
                .body("error", equalTo("Unauthenticated"));

        org.junit.jupiter.api.Assertions.assertNull(TestForwardingPort.lastRequest);
    }

    @Test
    void protectedRouteRejectsInvalidToken() {
        given()
                .header("Authorization", "Bearer invalid")
                .when().get("/manager/user/job/getall")
                .then()
                .statusCode(401)
                .body("error", equalTo("Unauthenticated"));

        assertEquals("invalid", TestTokenValidationPort.lastToken);
        org.junit.jupiter.api.Assertions.assertNull(TestForwardingPort.lastRequest);
    }

    @Test
    void protectedRouteForwardsWhenTokenIsValid() {
        given()
                .header("Authorization", "Bearer valid")
                .when().get("/manager/user/job/getall")
                .then()
                .statusCode(200)
                .body("route", equalTo("manager-service"));

        assertEquals("valid", TestTokenValidationPort.lastToken);
        assertEquals("/manager/user/job/getall", TestForwardingPort.lastRequest.rawPath());
    }

    @Test
    void postBodyAndHeadersArePassedToForwardingPort() {
        given()
                .header("Authorization", "Bearer valid")
                .contentType("application/json")
                .body("{\"title\":\"Java Dev\"}")
                .when().post("/project/user/save")
                .then()
                .statusCode(200)
                .body("route", equalTo("project-service"));

        assertEquals("POST", TestForwardingPort.lastRequest.method());
        assertEquals("{\"title\":\"Java Dev\"}",
                new String(TestForwardingPort.lastRequest.body(), StandardCharsets.UTF_8));
        assertEquals("application/json", TestForwardingPort.lastRequest.headers().get("Content-Type").get(0));
    }

    @Test
    void emailRouteIsNotExposedInBaseline() {
        given()
                .when().post("/email/create")
                .then()
                .statusCode(404);
    }

    @Test
    void authOtpRoutesRemainPublic() {
        given()
                .contentType("application/json")
                .body("{\"email\":\"user@example.test\",\"otp\":\"123456\"}")
                .when().post("/auth/verify-email")
                .then()
                .statusCode(200)
                .body("route", equalTo("auth-service"));

        assertEquals("/auth/verify-email", TestForwardingPort.lastRequest.rawPath());
        org.junit.jupiter.api.Assertions.assertNull(TestTokenValidationPort.lastToken);
    }

    @Test
    void internalEmailRouteIsNotExposed() {
        given()
                .contentType("application/json")
                .body("{\"to\":\"user@example.test\",\"otp\":\"123456\"}")
                .when().post("/internal/emails/verification-otp")
                .then()
                .statusCode(404);
    }

    @Test
    void healthEndpointRemainsAvailable() {
        given()
                .when().get("/q/health")
                .then()
                .statusCode(200)
                .body("status", equalTo("UP"));
    }

    @Test
    void operationalEndpointsRemainAvailable() {
        given().when().get("/q/health/live").then().statusCode(200).body("status", equalTo("UP"));
        given().when().get("/q/health/ready").then().statusCode(200).body("status", equalTo("UP"));
        given().when().get("/q/metrics").then().statusCode(200);
    }

    @Test
    void corsPreflightDoesNotRequireAuthentication() {
        given()
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "authorization,content-type")
                .when().options("/profiles")
                .then()
                .statusCode(anyOf(is(200), is(204)))
                .header("Access-Control-Allow-Origin", "http://localhost:3000")
                .header("Access-Control-Allow-Credentials", "true");

        org.junit.jupiter.api.Assertions.assertNull(TestForwardingPort.lastRequest);
        org.junit.jupiter.api.Assertions.assertNull(TestTokenValidationPort.lastToken);
    }

    @Test
    void corsHeadersArePresentOnGatewayErrorResponses() {
        given()
                .header("Origin", "http://localhost:3000")
                .when().post("/email/create")
                .then()
                .statusCode(404)
                .header("Access-Control-Allow-Origin", "http://localhost:3000")
                .header("Access-Control-Allow-Credentials", "true");
    }

    @Alternative
    @Priority(1)
    @ApplicationScoped
    public static class TestForwardingPort implements RequestForwardingPort {
        private static ForwardRequest lastRequest;

        @Override
        public Uni<ForwardResponse> forward(ForwardRequest request) {
            lastRequest = request;
            String body = "{\"routed\":true,\"route\":\"" + request.route().id() + "\"}";
            return Uni.createFrom().item(new ForwardResponse(200,
                    Map.of("Content-Type", List.of("application/json"), "X-Gateway-Test", List.of("true")),
                    body.getBytes(StandardCharsets.UTF_8)));
        }
    }

    @Alternative
    @Priority(1)
    @ApplicationScoped
    public static class TestTokenValidationPort implements TokenValidationPort {
        private static String lastToken;

        @Override
        public Uni<Boolean> isValid(String token) {
            lastToken = token;
            return Uni.createFrom().item("valid".equals(token));
        }
    }
}
