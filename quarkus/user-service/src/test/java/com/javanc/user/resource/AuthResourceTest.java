package com.javanc.user.resource;

import com.javanc.user.entity.User;
import com.javanc.user.repository.UserRepository;
import com.javanc.user.security.PasswordService;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
class AuthResourceTest {

    @Inject
    UserRepository userRepository;

    @Inject
    PasswordService passwordService;

    @Test
    void signUpSuccessAndDuplicatePreserveWrapperAndStatus() {
        Map<String, Object> request = signUpBody("Jane", "resource.signup@example.com", "Password1!", "EMP-R1");

        given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/auth/signup")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("message", equalTo("Sign up successfully"))
                .body("data.statusCode", equalTo(200))
                .body("data.message", equalTo("User Saved Successfully"))
                .body("data.vaild", equalTo(true))
                .body("data.user.email", equalTo("resource.signup@example.com"))
                .body("data.user.role", equalTo("user"));

        given()
                .contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/auth/signup")
                .then()
                .statusCode(409)
                .body("success", equalTo(true))
                .body("message", equalTo("Sign up successfully"))
                .body("data.statusCode", equalTo(409))
                .body("data.message", equalTo("Email already exists"))
                .body("data.vaild", equalTo(false));
    }

    @Test
    void signInSuccessUnknownEmailAndWrongPasswordPreserveContract() {
        signUp("resource.signin@example.com", "Password1!");

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("email", "resource.signin@example.com", "password", "Password1!"))
                .when()
                .post("/auth/signin")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("message", equalTo("Sign in successfully"))
                .body("data.statusCode", equalTo(200))
                .body("data.message", equalTo("Successfully Signed In"))
                .body("data.vaild", equalTo(true))
                .body("data.token", notNullValue())
                .body("data.refreshToken", notNullValue())
                .body("data.expirationTime", equalTo("24Hr"))
                .body("data.role", equalTo("user"))
                .body("data.user.email", equalTo("resource.signin@example.com"));

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("email", "missing.resource.signin@example.com", "password", "Password1!"))
                .when()
                .post("/auth/signin")
                .then()
                .statusCode(401)
                .body("message", equalTo("Sign in successfully"))
                .body("data.statusCode", equalTo(404))
                .body("data.message", equalTo("Email not found"))
                .body("data.vaild", equalTo(false));

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("email", "resource.signin@example.com", "password", "wrong-password"))
                .when()
                .post("/auth/signin")
                .then()
                .statusCode(401)
                .body("message", equalTo("Sign in successfully"))
                .body("data.statusCode", equalTo(401))
                .body("data.message", equalTo("Invalid credentials"))
                .body("data.vaild", equalTo(false));
    }

    @Test
    void refreshAndIsValidExposeTokenContract() {
        signUp("resource.token@example.com", "Password1!");
        String refreshToken = signInToken("resource.token@example.com", "Password1!", "data.refreshToken");
        String accessToken = signInToken("resource.token@example.com", "Password1!", "data.token");

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("token", refreshToken))
                .when()
                .post("/auth/refresh")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("message", equalTo("Refresh token successfully"))
                .body("data.statusCode", equalTo(200))
                .body("data.message", equalTo("Successfully Refreshed Token"))
                .body("data.token", notNullValue())
                .body("data.refreshToken", equalTo(refreshToken))
                .body("data.expirationTime", equalTo("24Hr"));

        given()
                .contentType(ContentType.TEXT)
                .body(accessToken)
                .when()
                .post("/auth/isValid")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("message", equalTo(""))
                .body("data.vaild", equalTo(true))
                .body("data.role", equalTo("user"));

        given()
                .contentType(ContentType.TEXT)
                .body("not-a-jwt")
                .when()
                .post("/auth/isValid")
                .then()
                .statusCode(200)
                .body("data.vaild", equalTo(false));
    }

    @Test
    void findByIdCheckIdGetCurrentUserAndListEndpointsWork() {
        Integer firstId = signUp("resource.lookup.one@example.com", "Password1!");
        Integer secondId = signUp("resource.lookup.two@example.com", "Password1!");
        String token = signInToken("resource.lookup.one@example.com", "Password1!", "data.token");

        given()
                .queryParam("id", firstId)
                .when()
                .get("/auth/findbyid")
                .then()
                .statusCode(200)
                .body("message", equalTo("User retrieved successfully"))
                .body("data.email", equalTo("resource.lookup.one@example.com"));

        given()
                .queryParam("id", firstId)
                .when()
                .get("/auth/checkId")
                .then()
                .statusCode(200)
                .body("message", equalTo("Check user id successfully"))
                .body("data", equalTo(true));

        given()
                .queryParam("id", 987654321)
                .when()
                .get("/auth/checkId")
                .then()
                .statusCode(200)
                .body("data", equalTo(false));

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/auth/getCurrentUser")
                .then()
                .statusCode(200)
                .body("message", equalTo("Check user id successfully"))
                .body("data.email", equalTo("resource.lookup.one@example.com"));

        given()
                .queryParam("token", token)
                .when()
                .get("/auth/getAll")
                .then()
                .statusCode(200)
                .body("message", equalTo("All users retrieved successfully"))
                .body("data.email", hasItem("resource.lookup.one@example.com"));

        given()
                .queryParam("token", token)
                .queryParam("ids", firstId)
                .queryParam("ids", secondId)
                .when()
                .get("/auth/getlistuserbyid")
                .then()
                .statusCode(200)
                .body("message", equalTo("User retrieved successfully"))
                .body("data.email", hasItem("resource.lookup.one@example.com"))
                .body("data.email", hasItem("resource.lookup.two@example.com"));
    }

    @Test
    void updateActiveDeleteAndBrokenUserDetailsEndpointExposeExpectedContract() {
        Integer userId = signUp("resource.mutate@example.com", "Password1!");
        String token = signInToken("resource.mutate@example.com", "Password1!", "data.token");

        given()
                .contentType(ContentType.JSON)
                .queryParam("token", token)
                .body(Map.of(
                        "id", userId,
                        "name", "Updated User",
                        "email", "resource.mutate.updated@example.com",
                        "password", "NewPassword1!",
                        "idEmployee", "EMP-UPD",
                        "role", "manager",
                        "active", true))
                .when()
                .post("/auth/update")
                .then()
                .statusCode(200)
                .body("message", equalTo("User updated successfully"))
                .body("data.name", equalTo("Updated User"))
                .body("data.email", equalTo("resource.mutate.updated@example.com"))
                .body("data.role", equalTo("manager"));

        User updated = userRepository.findByIdOptional(userId).orElseThrow();
        assertNotEquals("NewPassword1!", updated.getPassword());
        assertTrue(passwordService.matches("NewPassword1!", updated.getPassword()));

        given()
                .contentType(ContentType.JSON)
                .queryParam("token", "ignored-token")
                .body(Map.of("id", userId))
                .when()
                .post("/auth/updateactive")
                .then()
                .statusCode(200)
                .body("message", equalTo("User updated successfully"))
                .body("data.active", equalTo(false));

        given()
                .queryParam("token", signInToken("resource.mutate.updated@example.com", "NewPassword1!", "data.token"))
                .queryParam("id", userId)
                .when()
                .delete("/auth/delete")
                .then()
                .statusCode(200)
                .body("message", equalTo("User deleted successfully"))
                .body("data.id", equalTo(userId));

        given()
                .when()
                .get("/auth/ourUserDetailsService")
                .then()
                .statusCode(501)
                .body("success", equalTo(false))
                .body("message", equalTo("Endpoint not implemented: Spring mapping is broken"));
    }

    private Integer signUp(String email, String password) {
        return given()
                .contentType(ContentType.JSON)
                .body(signUpBody("Resource User", email, password, "EMP-RES"))
                .when()
                .post("/auth/signup")
                .then()
                .statusCode(200)
                .extract()
                .path("data.user.id");
    }

    private String signInToken(String email, String password, String path) {
        return given()
                .contentType(ContentType.JSON)
                .body(Map.of("email", email, "password", password))
                .when()
                .post("/auth/signin")
                .then()
                .statusCode(200)
                .extract()
                .path(path);
    }

    private Map<String, Object> signUpBody(String name, String email, String password, String idEmployee) {
        return Map.of(
                "name", name,
                "email", email,
                "password", password,
                "idEmployee", idEmployee);
    }
}
