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
                .body("routed", equalTo(true))
                .body("route", equalTo("image-service"));

        assertEquals("/image/getAll", TestForwardingPort.lastRequest.rawPath());
        assertEquals("size=1", TestForwardingPort.lastRequest.rawQuery());
        assertEquals("http://image-service.test/image/getAll?size=1", TestForwardingPort.lastRequest.targetUrl());
        org.junit.jupiter.api.Assertions.assertNull(TestTokenValidationPort.lastToken);
    }

    @Test
    void publicProfileListForwardsWithoutAuth() {
        given()
                .when().get("/profiles")
                .then()
                .statusCode(200)
                .body("route", equalTo("profile-service"));

        assertEquals("/profiles", TestForwardingPort.lastRequest.rawPath());
        org.junit.jupiter.api.Assertions.assertNull(TestTokenValidationPort.lastToken);
    }

    @Test
    void publicProfileDetailAndByUserForwardWithoutAuth() {
        given()
                .when().get("/profiles/44")
                .then()
                .statusCode(200)
                .body("route", equalTo("profile-service"));

        assertEquals("/profiles/44", TestForwardingPort.lastRequest.rawPath());
        org.junit.jupiter.api.Assertions.assertNull(TestTokenValidationPort.lastToken);

        reset();

        given()
                .when().get("/profiles/by-user/5")
                .then()
                .statusCode(200)
                .body("route", equalTo("profile-by-user-service"));

        assertEquals("/profiles/by-user/5", TestForwardingPort.lastRequest.rawPath());
        org.junit.jupiter.api.Assertions.assertNull(TestTokenValidationPort.lastToken);
    }

    @Test
    void protectedProfileMeRejectsMissingToken() {
        given()
                .when().get("/profiles/me")
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
                .when().post("/manager/hr/job/create")
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
                .when().post("/manager/hr/job/create")
                .then()
                .statusCode(200)
                .body("route", equalTo("manager-service"));

        assertEquals("valid", TestTokenValidationPort.lastToken);
        assertEquals("/manager/hr/job/create", TestForwardingPort.lastRequest.rawPath());
    }

    @Test
    void publicJobListForwardsWithoutAuth() {
        given()
                .when().get("/manager/user/job/getall")
                .then()
                .statusCode(200)
                .body("route", equalTo("public-job-list-service"));

        assertEquals("/manager/user/job/getall", TestForwardingPort.lastRequest.rawPath());
        org.junit.jupiter.api.Assertions.assertNull(TestTokenValidationPort.lastToken);
    }

    @Test
    void publicCompanyListForwardsWithoutAuth() {
        given()
                .when().get("/manager/user/company/getcompany")
                .then()
                .statusCode(200)
                .body("route", equalTo("public-company-list-service"));

        assertEquals("/manager/user/company/getcompany", TestForwardingPort.lastRequest.rawPath());
        org.junit.jupiter.api.Assertions.assertNull(TestTokenValidationPort.lastToken);
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
