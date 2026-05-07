package com.javanc.user.exception;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

@QuarkusTest
class ExceptionMapperTest {

    @Test
    void missingUserReturnsSpringCompatibleErrorWrapper() {
        given()
                .queryParam("id", 987654321)
                .when()
                .get("/auth/findbyid")
                .then()
                .statusCode(404)
                .body("success", equalTo(false))
                .body("message", equalTo("User not found"))
                .body("data", equalTo(""));
    }

    @Test
    void invalidTokenOnQueryProtectedEndpointReturnsJwtErrorWrapper() {
        given()
                .queryParam("token", "not-a-jwt")
                .when()
                .get("/auth/getAll")
                .then()
                .statusCode(401)
                .body("success", equalTo(false))
                .body("message", equalTo("Invalid JWT token"))
                .body("data", equalTo(""));
    }

    @Test
    void getCurrentUserReturnsUnauthorizedForMissingHeaderAndInvalidJwtForMalformedBearerToken() {
        given()
                .when()
                .get("/auth/getCurrentUser")
                .then()
                .statusCode(401)
                .body("success", equalTo(false))
                .body("message", equalTo("Unauthorized"))
                .body("data", equalTo(""));

        given()
                .header("Authorization", "Bearer not-a-jwt")
                .when()
                .get("/auth/getCurrentUser")
                .then()
                .statusCode(401)
                .body("success", equalTo(false))
                .body("message", equalTo("Invalid JWT token"))
                .body("data", equalTo(""));
    }

    @Test
    void refreshInvalidTokenUsesJwtExceptionMapper() {
        given()
                .contentType(ContentType.JSON)
                .body(Map.of("token", "not-a-jwt"))
                .when()
                .post("/auth/refresh")
                .then()
                .statusCode(401)
                .body("success", equalTo(false))
                .body("message", equalTo("Invalid JWT token"))
                .body("data", equalTo(""));
    }

    @Test
    void unknownAuthRouteReturnsWrappedNotFoundAndHealthRemainsPublic() {
        given()
                .when()
                .get("/auth/unknown-route")
                .then()
                .statusCode(404)
                .body("success", equalTo(false))
                .body("message", equalTo("Resource not found"))
                .body("data", equalTo(""));

        given()
                .when()
                .get("/q/health")
                .then()
                .statusCode(200);
    }

    @Test
    void isValidInvalidTokenStillReturnsValidationPayload() {
        given()
                .contentType(ContentType.TEXT)
                .body("not-a-jwt")
                .when()
                .post("/auth/isValid")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("data.vaild", equalTo(false));
    }
}
