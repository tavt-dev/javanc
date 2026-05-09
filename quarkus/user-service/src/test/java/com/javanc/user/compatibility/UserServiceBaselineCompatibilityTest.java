package com.javanc.user.compatibility;

import com.javanc.user.adapter.out.persistence.JpaUserPanacheRepository;
import com.javanc.user.adapter.out.security.BcryptPasswordHasher;
import com.javanc.user.domain.model.User;
import com.javanc.user.domain.model.UserId;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
class UserServiceBaselineCompatibilityTest {

    @Inject
    JpaUserPanacheRepository userRepository;

    @Inject
    BcryptPasswordHasher passwordHasher;

    @Test
    void authSignupSigninAndPasswordBaselineMatchesSpringContract() {
        Map<String, Object> defaultRoleRequest = signUpRequest("Baseline User",
                "baseline.signup.default@example.com", "Password1!", "EMP-BL-1");

        Integer userId = given()
                .contentType(ContentType.JSON)
                .body(defaultRoleRequest)
                .when()
                .post("/auth/signup")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("message", equalTo("Sign up successfully"))
                .body("data.statusCode", equalTo(200))
                .body("data.message", equalTo("User Saved Successfully"))
                .body("data.vaild", equalTo(true))
                .body("data", not(Map.of()))
                .body("data.user.id", notNullValue())
                .body("data.user.email", equalTo("baseline.signup.default@example.com"))
                .body("data.user.role", equalTo("user"))
                .body("data.user.active", equalTo(true))
                .extract()
                .path("data.user.id");

        User persisted = userRepository.findById(new UserId(userId)).orElseThrow();
        assertNotEquals("Password1!", persisted.passwordHash().value());
        assertTrue(passwordHasher.matches("Password1!", persisted.passwordHash()));

        given()
                .contentType(ContentType.JSON)
                .body(defaultRoleRequest)
                .when()
                .post("/auth/signup")
                .then()
                .statusCode(409)
                .body("success", equalTo(true))
                .body("message", equalTo("Sign up successfully"))
                .body("data.statusCode", equalTo(409))
                .body("data.message", equalTo("Email already exists"))
                .body("data.vaild", equalTo(false));

        given()
                .contentType(ContentType.JSON)
                .body(signUpRequest("Baseline Manager", "baseline.signup.manager@example.com",
                        "Password1!", "EMP-BL-2", "manager"))
                .when()
                .post("/auth/signup")
                .then()
                .statusCode(200)
                .body("data.user.role", equalTo("manager"));

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("email", "baseline.signup.default@example.com", "password", "Password1!"))
                .when()
                .post("/auth/signin")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("message", equalTo("Sign in successfully"))
                .body("data.statusCode", equalTo(200))
                .body("data.message", equalTo("Successfully Signed In"))
                .body("data.token", notNullValue())
                .body("data.refreshToken", notNullValue())
                .body("data.expirationTime", equalTo("24Hr"))
                .body("data.role", equalTo("user"))
                .body("data.vaild", equalTo(true))
                .body("data.isVaild", equalTo(null));

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("email", "baseline.missing@example.com", "password", "Password1!"))
                .when()
                .post("/auth/signin")
                .then()
                .statusCode(401)
                .body("data.statusCode", equalTo(404))
                .body("data.message", equalTo("Email not found"))
                .body("data.vaild", equalTo(false));

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("email", "baseline.signup.default@example.com", "password", "wrong-password"))
                .when()
                .post("/auth/signin")
                .then()
                .statusCode(401)
                .body("data.statusCode", equalTo(401))
                .body("data.message", equalTo("Invalid credentials"))
                .body("data.vaild", equalTo(false));
    }

    @Test
    void tokenBaselineKeepsRefreshAndIsValidContracts() {
        signUp("baseline.token@example.com", "Password1!");
        String token = signInValue("baseline.token@example.com", "Password1!", "data.token");
        String refreshToken = signInValue("baseline.token@example.com", "Password1!", "data.refreshToken");

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("token", refreshToken))
                .when()
                .post("/auth/refresh")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("message", equalTo("Refresh token successfully"))
                .body("data.token", notNullValue())
                .body("data.refreshToken", equalTo(refreshToken))
                .body("data.expirationTime", equalTo("24Hr"));

        given()
                .contentType(ContentType.TEXT)
                .body(token)
                .when()
                .post("/auth/isValid")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("data.vaild", equalTo(true))
                .body("data.role", equalTo("user"));

        given()
                .contentType(ContentType.TEXT)
                .body("not-a-jwt")
                .when()
                .post("/auth/isValid")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("data.vaild", equalTo(false));

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
    void userEndpointBaselineCoversLookupListUpdateActiveAndDelete() {
        Integer firstId = signUp("baseline.user.one@example.com", "Password1!");
        Integer secondId = signUp("baseline.user.two@example.com", "Password1!");
        String token = signInValue("baseline.user.one@example.com", "Password1!", "data.token");

        given()
                .queryParam("id", firstId)
                .when()
                .get("/auth/findbyid")
                .then()
                .statusCode(200)
                .body("message", equalTo("User retrieved successfully"))
                .body("data.email", equalTo("baseline.user.one@example.com"))
                .body("data.active", equalTo(true));

        given()
                .queryParam("id", 987654321)
                .when()
                .get("/auth/findbyid")
                .then()
                .statusCode(404)
                .body("success", equalTo(false))
                .body("message", equalTo("User not found"))
                .body("data", equalTo(""));

        given()
                .queryParam("id", firstId)
                .when()
                .get("/auth/checkId")
                .then()
                .statusCode(200)
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
                .body("data.email", equalTo("baseline.user.one@example.com"));

        given()
                .when()
                .get("/auth/getCurrentUser")
                .then()
                .statusCode(401)
                .body("success", equalTo(false))
                .body("message", equalTo("Unauthorized"));

        given()
                .queryParam("token", token)
                .when()
                .get("/auth/getAll")
                .then()
                .statusCode(200)
                .body("message", equalTo("All users retrieved successfully"))
                .body("data.email", hasItem("baseline.user.one@example.com"));

        given()
                .queryParam("token", token)
                .queryParam("ids", firstId)
                .queryParam("ids", secondId)
                .when()
                .get("/auth/getlistuserbyid")
                .then()
                .statusCode(200)
                .body("message", equalTo("User retrieved successfully"))
                .body("data.email", hasItem("baseline.user.one@example.com"))
                .body("data.email", hasItem("baseline.user.two@example.com"));

        given()
                .contentType(ContentType.JSON)
                .queryParam("token", token)
                .body(Map.of(
                        "id", firstId,
                        "name", "Baseline Updated",
                        "email", "baseline.user.updated@example.com",
                        "password", "NewPassword1!",
                        "idEmployee", "EMP-BASE-UPD",
                        "role", "manager",
                        "active", true))
                .when()
                .post("/auth/update")
                .then()
                .statusCode(200)
                .body("message", equalTo("User updated successfully"))
                .body("data.name", equalTo("Baseline Updated"))
                .body("data.email", equalTo("baseline.user.updated@example.com"))
                .body("data.role", equalTo("manager"));

        User updated = userRepository.findById(new UserId(firstId)).orElseThrow();
        assertNotEquals("NewPassword1!", updated.passwordHash().value());
        assertTrue(passwordHasher.matches("NewPassword1!", updated.passwordHash()));

        given()
                .contentType(ContentType.JSON)
                .queryParam("token", signInValue("baseline.user.updated@example.com", "NewPassword1!", "data.token"))
                .body(Map.of("id", firstId))
                .when()
                .post("/auth/updateactive")
                .then()
                .statusCode(200)
                .body("message", equalTo("User updated successfully"))
                .body("data.active", equalTo(false));

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("id", firstId))
                .when()
                .post("/auth/updateactive")
                .then()
                .statusCode(401)
                .body("success", equalTo(false))
                .body("message", equalTo("Unauthorized"));

        String updatedToken = signInValue("baseline.user.updated@example.com", "NewPassword1!", "data.token");
        given()
                .queryParam("token", updatedToken)
                .queryParam("id", firstId)
                .when()
                .delete("/auth/delete")
                .then()
                .statusCode(200)
                .body("message", equalTo("User deleted successfully"))
                .body("data.id", equalTo(firstId));

        given()
                .queryParam("id", firstId)
                .when()
                .get("/auth/checkId")
                .then()
                .statusCode(200)
                .body("data", equalTo(false));
    }

    @Test
    void wireAndSecurityBaselineKeepsPublicHealthAndKnownCompatibilityDecisions() {
        given()
                .when()
                .get("/q/health")
                .then()
                .statusCode(200);

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
                .get("/auth/ourUserDetailsService")
                .then()
                .statusCode(501)
                .body("success", equalTo(false))
                .body("message", equalTo("Endpoint not implemented: Spring mapping is broken"));
    }

    private Integer signUp(String email, String password) {
        return given()
                .contentType(ContentType.JSON)
                .body(signUpRequest("Baseline User", email, password, "EMP-BASE"))
                .when()
                .post("/auth/signup")
                .then()
                .statusCode(200)
                .extract()
                .path("data.user.id");
    }

    private String signInValue(String email, String password, String path) {
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

    private Map<String, Object> signUpRequest(String name, String email, String password, String idEmployee) {
        return Map.of(
                "name", name,
                "email", email,
                "password", password,
                "idEmployee", idEmployee);
    }

    private Map<String, Object> signUpRequest(String name, String email, String password, String idEmployee,
            String role) {
        return Map.of(
                "name", name,
                "email", email,
                "password", password,
                "idEmployee", idEmployee,
                "role", role);
    }
}
