package com.javanc.image.interfaces.rest.resource;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.emptyString;

@QuarkusTest
class ImageResourceTest {

    @Test
    void getAllPreservesCurrentCompatibilityResponse() {
        given()
                .when().get("/image/getAll")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("message", equalTo("Get all is successfully"))
                .body("data", equalTo("ok"));
    }

    @Test
    void saveWithoutImageReturnsBadRequestWithEmptyBody() {
        given()
                .multiPart("other", "value")
                .when().post("/image/save")
                .then()
                .statusCode(400)
                .body(emptyString());
    }

    @Test
    void saveEmptyImageReturnsBadRequestWithEmptyBody() {
        given()
                .multiPart("image", "empty.png", new byte[0])
                .when().post("/image/save")
                .then()
                .statusCode(400)
                .body(emptyString());
    }
}
