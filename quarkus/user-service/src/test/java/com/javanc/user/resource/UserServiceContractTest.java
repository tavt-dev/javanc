package com.javanc.user.resource;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Alternative;
import com.javanc.user.domain.port.EmailVerificationNotifier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;

@QuarkusTest
class UserServiceContractTest {

    @BeforeEach
    void resetOtpNotifier() {
        TestEmailVerificationNotifier.otps.clear();
        TestEmailVerificationNotifier.sendCount = 0;
    }

    @Test
    void registerLoginRefreshIntrospectAndMeUseProductionContract() {
        String email = "contract.user@example.com";

        given()
                .contentType(ContentType.JSON)
                .body(registerBody("Contract User", email, "Password1!"))
                .when()
                .post("/auth/register")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("data.email", equalTo(email))
                .body("data.status", equalTo("PENDING_VERIFICATION"))
                .body("data.expiresInSeconds", equalTo(600))
                .body("data.accessToken", nullValue())
                .body("data.refreshToken", nullValue());

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("email", email, "password", "Password1!"))
                .when()
                .post("/auth/login")
                .then()
                .statusCode(403)
                .body("message", equalTo("Email verification required"));

        Integer userId = given()
                .contentType(ContentType.JSON)
                .body(Map.of("email", email, "otp", TestEmailVerificationNotifier.otps.get(email)))
                .when()
                .post("/auth/verify-email")
                .then()
                .statusCode(200)
                .body("data.accessToken", notNullValue())
                .body("data.refreshToken", notNullValue())
                .body("data.tokenType", equalTo("Bearer"))
                .body("data.expiresInSeconds", equalTo(3600))
                .body("data.user.email", equalTo(email))
                .body("data.user.role", equalTo("user"))
                .body("data.user.status", equalTo("ACTIVE"))
                .body("data.user.password", nullValue())
                .extract()
                .path("data.user.id");

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("email", email, "otp", TestEmailVerificationNotifier.otps.get(email)))
                .when()
                .post("/auth/verify-email")
                .then()
                .statusCode(400)
                .body("data", nullValue());

        given()
                .contentType(ContentType.JSON)
                .body(registerBody("Duplicate User", email, "Password1!"))
                .when()
                .post("/auth/register")
                .then()
                .statusCode(409)
                .body("success", equalTo(false))
                .body("data", nullValue());

        String accessToken = given()
                .contentType(ContentType.JSON)
                .body(Map.of("email", email, "password", "Password1!"))
                .when()
                .post("/auth/login")
                .then()
                .statusCode(200)
                .body("data.accessToken", notNullValue())
                .body("data.user.id", equalTo(userId))
                .extract()
                .path("data.accessToken");

        String refreshToken = given()
                .contentType(ContentType.JSON)
                .body(Map.of("email", email, "password", "Password1!"))
                .when()
                .post("/auth/login")
                .then()
                .statusCode(200)
                .extract()
                .path("data.refreshToken");

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("refreshToken", refreshToken))
                .when()
                .post("/auth/refresh")
                .then()
                .statusCode(200)
                .body("data.accessToken", notNullValue())
                .body("data.refreshToken", notNullValue());

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("token", accessToken))
                .when()
                .post("/auth/introspect")
                .then()
                .statusCode(200)
                .body("data.active", equalTo(true))
                .body("data.subject", equalTo(email))
                .body("data.userId", equalTo(userId))
                .body("data.role", equalTo("user"));

        given()
                .header("Authorization", "Bearer " + accessToken)
                .when()
                .get("/users/me")
                .then()
                .statusCode(200)
                .body("data.id", equalTo(userId))
                .body("data.email", equalTo(email));

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("token", "not-a-jwt"))
                .when()
                .post("/auth/introspect")
                .then()
                .statusCode(200)
                .body("data.active", equalTo(false));
    }

    @Test
    void usersEndpointsEnforceBearerTokenAndAdminAuthorization() {
        String adminToken = loginToken("test.admin@example.com", "Password1!");
        String userToken = registerVerifyAndToken("contract.basic@example.com");
        Integer userId = createAccountAndUserId(adminToken, "contract.target@example.com", "EMP-CONTRACT-TARGET", "user");

        given()
                .when()
                .get("/users")
                .then()
                .statusCode(401);

        given()
                .header("Authorization", "Bearer " + userToken)
                .contentType(ContentType.JSON)
                .body(adminAccountBody("Forbidden Admin", "contract.forbidden@example.com", "Password1!",
                        "EMP-FORBIDDEN", "admin"))
                .when()
                .post("/users/admin/accounts")
                .then()
                .statusCode(403);

        given()
                .header("Authorization", "Bearer " + adminToken)
                .when()
                .get("/users")
                .then()
                .statusCode(200)
                .body("data[0].id", notNullValue());

        given()
                .header("Authorization", "Bearer " + adminToken)
                .contentType(ContentType.JSON)
                .body(Map.of("role", "hr"))
                .when()
                .patch("/users/" + userId + "/role")
                .then()
                .statusCode(200)
                .body("data.role", equalTo("hr"));

        given()
                .header("Authorization", "Bearer " + adminToken)
                .contentType(ContentType.JSON)
                .body(Map.of("active", false))
                .when()
                .patch("/users/" + userId + "/status")
                .then()
                .statusCode(200)
                .body("data.active", equalTo(false))
                .body("data.status", equalTo("DISABLED"));

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("email", "contract.target@example.com", "password", "Password1!"))
                .when()
                .post("/auth/login")
                .then()
                .statusCode(401);
    }

    @Test
    void profileUpdatesRejectDuplicateEmailAndEmployeeId() {
        String adminToken = loginToken("test.admin@example.com", "Password1!");
        createAccountAndUserId(adminToken, "contract.unique.first@example.com", "EMP-CONTRACT-UNIQUE-1", "user");
        Integer secondUserId = createAccountAndUserId(adminToken, "contract.unique.second@example.com",
                "EMP-CONTRACT-UNIQUE-2", "user");

        given()
                .header("Authorization", "Bearer " + adminToken)
                .contentType(ContentType.JSON)
                .body(Map.of("email", "contract.unique.first@example.com"))
                .when()
                .patch("/users/" + secondUserId)
                .then()
                .statusCode(409)
                .body("message", equalTo("User already exists"));

        given()
                .header("Authorization", "Bearer " + adminToken)
                .contentType(ContentType.JSON)
                .body(Map.of("employeeId", "EMP-CONTRACT-UNIQUE-1"))
                .when()
                .patch("/users/" + secondUserId)
                .then()
                .statusCode(409)
                .body("message", equalTo("Employee ID already exists"));

        Map<String, Object> clearEmployeeId = new HashMap<>();
        clearEmployeeId.put("employeeId", "");
        given()
                .header("Authorization", "Bearer " + adminToken)
                .contentType(ContentType.JSON)
                .body(clearEmployeeId)
                .when()
                .patch("/users/" + secondUserId)
                .then()
                .statusCode(200)
                .body("data.idEmployee", nullValue());
    }

    @Test
    void verificationOtpRejectsWrongCodeAndResendIsRateLimited() {
        String email = "contract.otp@example.com";
        given()
                .contentType(ContentType.JSON)
                .body(registerBody("OTP User", email, "Password1!"))
                .when()
                .post("/auth/register")
                .then()
                .statusCode(200);

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("email", email, "otp", "000000"))
                .when()
                .post("/auth/verify-email")
                .then()
                .statusCode(400);

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("email", email))
                .when()
                .post("/auth/resend-verification-otp")
                .then()
                .statusCode(429);

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("email", "unknown@example.com"))
                .when()
                .post("/auth/resend-verification-otp")
                .then()
                .statusCode(200);
    }

    @Test
    void publicRegisterRejectsRoleAndEmployeeId() {
        given()
                .contentType(ContentType.JSON)
                .body(Map.of(
                        "name", "Bad Admin",
                        "email", "bad.admin@example.com",
                        "password", "Password1!",
                        "role", "admin"))
                .when()
                .post("/auth/register")
                .then()
                .statusCode(400);

        given()
                .contentType(ContentType.JSON)
                .body(Map.of(
                        "name", "Bad Employee",
                        "email", "bad.employee@example.com",
                        "password", "Password1!",
                        "employeeId", "EMP-BAD"))
                .when()
                .post("/auth/register")
                .then()
                .statusCode(400);
    }

    @Test
    void legacyEndpointsAreRemoved() {
        given().contentType(ContentType.JSON).body(Map.of()).when().post("/auth/signup").then().statusCode(404);
        given().contentType(ContentType.JSON).body(Map.of()).when().post("/auth/signin").then().statusCode(404);
        given().contentType(ContentType.JSON).body(Map.of()).when().post("/auth/isValid").then().statusCode(404);
        given().when().get("/auth/ourUserDetailsService").then().statusCode(404);
    }

    private String registerVerifyAndToken(String email) {
        given()
                .contentType(ContentType.JSON)
                .body(registerBody("Contract User", email, "Password1!"))
                .when()
                .post("/auth/register")
                .then()
                .statusCode(200);

        return given()
                .contentType(ContentType.JSON)
                .body(Map.of("email", email, "otp", TestEmailVerificationNotifier.otps.get(email)))
                .when()
                .post("/auth/verify-email")
                .then()
                .statusCode(200)
                .extract()
                .path("data.accessToken");
    }

    private String loginToken(String email, String password) {
        return given()
                .contentType(ContentType.JSON)
                .body(Map.of("email", email, "password", password))
                .when()
                .post("/auth/login")
                .then()
                .statusCode(200)
                .extract()
                .path("data.accessToken");
    }

    private Integer createAccountAndUserId(String adminToken, String email, String employeeId, String role) {
        return given()
                .header("Authorization", "Bearer " + adminToken)
                .contentType(ContentType.JSON)
                .body(adminAccountBody("Contract Account", email, "Password1!", employeeId, role))
                .when()
                .post("/users/admin/accounts")
                .then()
                .statusCode(200)
                .body("data.role", equalTo(role))
                .extract()
                .path("data.id");
    }

    private Map<String, Object> registerBody(String name, String email, String password) {
        return Map.of(
                "name", name,
                "email", email,
                "password", password);
    }

    private Map<String, Object> adminAccountBody(String name, String email, String password, String employeeId, String role) {
        return Map.of(
                "name", name,
                "email", email,
                "password", password,
                "employeeId", employeeId,
                "role", role);
    }

    @Alternative
    @Priority(1)
    @ApplicationScoped
    public static class TestEmailVerificationNotifier implements EmailVerificationNotifier {
        private static final Map<String, String> otps = new HashMap<>();
        private static int sendCount;

        @Override
        public void sendOtp(String email, String name, String otp, long expiresInMinutes) {
            otps.put(email, otp);
            sendCount++;
        }
    }
}
