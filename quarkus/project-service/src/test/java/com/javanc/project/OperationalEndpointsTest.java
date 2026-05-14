package com.javanc.project;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

@QuarkusTest
class OperationalEndpointsTest {

    @Test
    void healthAndMetricsEndpointsAreAvailable() {
        given().when().get("/q/health").then().statusCode(200).body("status", equalTo("UP"));
        given().when().get("/q/health/live").then().statusCode(200).body("status", equalTo("UP"));
        given().when().get("/q/health/ready").then().statusCode(200).body("status", equalTo("UP"));
        given().when().get("/q/metrics").then().statusCode(200);
    }
}
