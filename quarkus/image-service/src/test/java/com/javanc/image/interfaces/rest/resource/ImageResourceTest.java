package com.javanc.image.interfaces.rest.resource;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;

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
    void previewReturnsLowResolutionCloudinaryUrl() {
        given()
                .queryParam("url", "https://res.cloudinary.com/demo/image/upload/v1/javanc/profile/avatar.png")
                .queryParam("width", 96)
                .when().get("/image/preview")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("data", equalTo("https://res.cloudinary.com/demo/image/upload/c_fill,w_96,h_96,q_auto,f_auto/v1/javanc/profile/avatar.png"));
    }

    @Test
    void previewKeepsLocalUrlUnchanged() {
        given()
                .queryParam("url", "http://localhost:8083/image/files/avatar.png")
                .when().get("/image/preview")
                .then()
                .statusCode(200)
                .body("data", equalTo("http://localhost:8083/image/files/avatar.png"));
    }

    @Test
    void saveImageReturnsMetadataWrapper() {
        given()
                .multiPart("image", "avatar.png",
                        new byte[] { (byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a }, "image/png")
                .when().post("/image/save")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("message", equalTo("Image uploaded successfully"))
                .body("data.id", notNullValue())
                .body("data.url", equalTo("https://cdn.test/image.png"))
                .body("data.publicId", equalTo("javanc/test/image"))
                .body("data.secureUrl", equalTo("https://cdn.test/image.png"));
    }

    @Test
    void saveOctetStreamWithValidImageBytesSupportsServiceToServiceUpload() {
        given()
                .multiPart("image", "avatar.bin",
                        new byte[] { (byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a },
                        "application/octet-stream")
                .when().post("/image/save")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("data.url", equalTo("https://cdn.test/image.png"));
    }

    @Test
    void saveWithoutImageReturnsBadRequestWrapper() {
        given()
                .multiPart("other", "value")
                .when().post("/image/save")
                .then()
                .statusCode(400)
                .body("success", equalTo(false))
                .body("message", equalTo("Image is required"))
                .body("data", equalTo(null));
    }

    @Test
    void saveEmptyImageReturnsBadRequestWrapper() {
        given()
                .multiPart("image", "empty.png", new byte[0], "image/png")
                .when().post("/image/save")
                .then()
                .statusCode(400)
                .body("success", equalTo(false))
                .body("message", equalTo("Image must not be empty"))
                .body("data", equalTo(null));
    }

    @Test
    void saveUnsupportedMimeTypeReturnsBadRequestWrapper() {
        given()
                .multiPart("image", "avatar.gif", new byte[] { 0x47, 0x49, 0x46, 0x38 }, "image/gif")
                .when().post("/image/save")
                .then()
                .statusCode(400)
                .body("success", equalTo(false))
                .body("message", equalTo("Only jpeg, png, and webp images are allowed"))
                .body("data", equalTo(null));
    }
}
