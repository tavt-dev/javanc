package com.javanc.user.resource;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.quarkus.test.junit.QuarkusTestProfile;
import io.restassured.http.ContentType;
import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Alternative;
import com.javanc.user.application.result.VerifiedGoogleIdentity;
import com.javanc.user.domain.port.EmailVerificationNotifier;
import com.javanc.user.domain.port.GoogleIdentityVerifier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;

@QuarkusTest
@TestProfile(UserServiceContractTest.ContractTestProfile.class)
class UserServiceContractTest {

    @BeforeEach
    void resetOtpNotifier() {
        TestEmailVerificationNotifier.otps.clear();
        TestEmailVerificationNotifier.sendCount = 0;
        TestGoogleIdentityVerifier.identities.clear();
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
                .body("data.user.provider", equalTo("LOCAL"))
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
                .body("data.items[0].id", notNullValue());

        given()
                .header("Authorization", "Bearer " + adminToken)
                .contentType(ContentType.JSON)
                .body(Map.of("role", "hr"))
                .when()
                .patch("/users/" + userId + "/role")
                .then()
                .statusCode(403);

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
    void adminAccountsCannotBeDisabledOrDeleted() {
        String adminToken = loginToken("test.admin@example.com", "Password1!");
        Integer protectedAdminId = createAccountAndUserId(adminToken, "contract.protected.admin@example.com",
                "EMP-CONTRACT-PROTECTED-ADMIN", "admin");

        given()
                .header("Authorization", "Bearer " + adminToken)
                .contentType(ContentType.JSON)
                .body(Map.of("active", false))
                .when()
                .patch("/users/" + protectedAdminId + "/status")
                .then()
                .statusCode(409)
                .body("message", equalTo("Admin accounts cannot be disabled or deleted"));

        given()
                .header("Authorization", "Bearer " + adminToken)
                .when()
                .delete("/users/" + protectedAdminId)
                .then()
                .statusCode(409)
                .body("message", equalTo("Admin accounts cannot be disabled or deleted"));
    }

    @Test
    void roleRequestsControlManagerAndHrPromotionWorkflows() {
        String adminToken = loginToken("test.admin@example.com", "Password1!");
        createAccountAndUserId(adminToken, "contract.manager@example.com", "EMP-CONTRACT-MANAGER", "manager");
        Integer targetUserId = createAccountAndUserId(adminToken, "contract.hr.target@example.com",
                "EMP-CONTRACT-HR-TARGET", "user");
        String targetToken = loginToken("contract.hr.target@example.com", "Password1!");
        String managerToken = loginToken("contract.manager@example.com", "Password1!");

        given()
                .header("Authorization", "Bearer " + managerToken)
                .when()
                .get("/users")
                .then()
                .statusCode(200);

        given()
                .header("Authorization", "Bearer " + adminToken)
                .contentType(ContentType.JSON)
                .body(adminAccountBody("Alice Candidate", "contract.alice.candidate@example.com", "Password1!",
                        "EMP-CONTRACT-ALICE", "user"))
                .when()
                .post("/users/admin/accounts")
                .then()
                .statusCode(200);

        given()
                .header("Authorization", "Bearer " + managerToken)
                .when()
                .get("/users/search?query=alice&role=user")
                .then()
                .statusCode(200)
                .body("data.items.email", hasItem("contract.alice.candidate@example.com"));

        given()
                .header("Authorization", "Bearer " + managerToken)
                .contentType(ContentType.JSON)
                .body(Map.of("role", "hr"))
                .when()
                .patch("/users/" + targetUserId + "/role")
                .then()
                .statusCode(403);

        Integer hrRequestId = given()
                .header("Authorization", "Bearer " + managerToken)
                .contentType(ContentType.JSON)
                .body(Map.of("targetUserId", targetUserId, "companyId", 77, "companyName", "Contract Co"))
                .when()
                .post("/users/manager/hr-promotion-requests")
                .then()
                .statusCode(200)
                .body("data.status", equalTo("PENDING_USER_CONFIRMATION"))
                .body("data.requestedRole", equalTo("hr"))
                .extract()
                .path("data.id");

        given()
                .header("Authorization", "Bearer " + targetToken)
                .when()
                .patch("/users/me/hr-promotion-requests/" + hrRequestId + "/accept")
                .then()
                .statusCode(200)
                .body("data.status", equalTo("APPROVED"));

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("email", "contract.hr.target@example.com", "password", "Password1!"))
                .when()
                .post("/auth/login")
                .then()
                .statusCode(200)
                .body("data.user.role", equalTo("hr"));
    }

    @Test
    void managerUpgradeRequiresAdminApproval() {
        String adminToken = loginToken("test.admin@example.com", "Password1!");
        String userToken = registerVerifyAndToken("contract.manager.request@example.com");

        Integer requestId = given()
                .header("Authorization", "Bearer " + userToken)
                .contentType(ContentType.JSON)
                .body(Map.of("reason", "I manage a company"))
                .when()
                .post("/users/me/manager-upgrade-requests")
                .then()
                .statusCode(200)
                .body("data.status", equalTo("PENDING_SYSADMIN"))
                .body("data.requestedRole", equalTo("manager"))
                .extract()
                .path("data.id");

        given()
                .header("Authorization", "Bearer " + adminToken)
                .when()
                .get("/users/admin/role-requests?status=PENDING_SYSADMIN")
                .then()
                .statusCode(200)
                .body("data.items[0].id", notNullValue());

        given()
                .header("Authorization", "Bearer " + adminToken)
                .when()
                .patch("/users/admin/role-requests/" + requestId + "/approve")
                .then()
                .statusCode(200)
                .body("data.status", equalTo("APPROVED"));

        given()
                .header("Authorization", "Bearer " + userToken)
                .when()
                .get("/users/me")
                .then()
                .statusCode(200)
                .body("data.role", equalTo("manager"));
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

    @Test
    void googleLoginCreatesActiveUserAndReturnsInternalSession() {
        TestGoogleIdentityVerifier.identities.put("google-token-new",
                new VerifiedGoogleIdentity("google-subject-new", "google.user@example.com", "Google User",
                        "https://example.com/avatar.png", true));

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("idToken", "google-token-new"))
                .when()
                .post("/auth/google")
                .then()
                .statusCode(200)
                .body("data.accessToken", notNullValue())
                .body("data.refreshToken", notNullValue())
                .body("data.user.email", equalTo("google.user@example.com"))
                .body("data.user.name", equalTo("Google User"))
                .body("data.user.avatarUrl", equalTo("https://example.com/avatar.png"))
                .body("data.user.provider", equalTo("GOOGLE"))
                .body("data.user.status", equalTo("ACTIVE"));
    }

    @Test
    void googleLoginRejectsMissingToken() {
        given()
                .contentType(ContentType.JSON)
                .body(Map.of())
                .when()
                .post("/auth/google")
                .then()
                .statusCode(400)
                .body("message", equalTo("Google ID token is required"))
                .body("data", nullValue());
    }

    @Test
    void googleLoginReusesExistingGoogleIdentity() {
        TestGoogleIdentityVerifier.identities.put("google-token-existing",
                new VerifiedGoogleIdentity("google-subject-existing", "google.existing@example.com", "Google Existing",
                        "https://example.com/existing.png", true));

        Integer firstUserId = given()
                .contentType(ContentType.JSON)
                .body(Map.of("idToken", "google-token-existing"))
                .when()
                .post("/auth/google")
                .then()
                .statusCode(200)
                .extract()
                .path("data.user.id");

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("idToken", "google-token-existing"))
                .when()
                .post("/auth/google")
                .then()
                .statusCode(200)
                .body("data.user.id", equalTo(firstUserId))
                .body("data.user.provider", equalTo("GOOGLE"));
    }

    @Test
    void googleLoginLinksVerifiedLocalAccountAndKeepsPasswordLogin() {
        String email = "google.link.local@example.com";
        registerVerifyAndToken(email);
        TestGoogleIdentityVerifier.identities.put("google-token-link",
                new VerifiedGoogleIdentity("google-subject-link", email, "Google Linked",
                        "https://example.com/linked.png", true));

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("idToken", "google-token-link"))
                .when()
                .post("/auth/google")
                .then()
                .statusCode(200)
                .body("data.user.email", equalTo(email))
                .body("data.user.provider", equalTo("GOOGLE"));

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("email", email, "password", "Password1!"))
                .when()
                .post("/auth/login")
                .then()
                .statusCode(200)
                .body("data.user.provider", equalTo("LOCAL"));
    }

    @Test
    void googleRefreshKeepsGoogleProvider() {
        TestGoogleIdentityVerifier.identities.put("google-token-refresh",
                new VerifiedGoogleIdentity("google-subject-refresh", "google.refresh@example.com", "Google Refresh",
                        null, true));

        String refreshToken = given()
                .contentType(ContentType.JSON)
                .body(Map.of("idToken", "google-token-refresh"))
                .when()
                .post("/auth/google")
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
                .body("data.user.provider", equalTo("GOOGLE"));
    }

    @Test
    void googleLoginRejectsUnverifiedLocalAccountWithVerificationError() {
        String email = "google.pending.local@example.com";
        given()
                .contentType(ContentType.JSON)
                .body(registerBody("Google Pending", email, "Password1!"))
                .when()
                .post("/auth/register")
                .then()
                .statusCode(200);

        TestGoogleIdentityVerifier.identities.put("google-token-pending-local",
                new VerifiedGoogleIdentity("google-subject-pending-local", email, "Google Pending",
                        null, true));

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("idToken", "google-token-pending-local"))
                .when()
                .post("/auth/google")
                .then()
                .statusCode(403)
                .body("message", equalTo("Google email is not verified"));
    }

    @Test
    void googleLoginRejectsUnverifiedGoogleEmailAndInvalidToken() {
        TestGoogleIdentityVerifier.identities.put("google-token-unverified",
                new VerifiedGoogleIdentity("google-subject-unverified", "google.unverified@example.com",
                        "Google Unverified", null, false));

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("idToken", "google-token-unverified"))
                .when()
                .post("/auth/google")
                .then()
                .statusCode(403)
                .body("message", equalTo("Google email is not verified"));

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("idToken", "google-token-invalid"))
                .when()
                .post("/auth/google")
                .then()
                .statusCode(401)
                .body("message", equalTo("Invalid Google ID token"));
    }

    @Test
    void googleLoginRejectsInactiveLinkedUser() {
        String adminToken = loginToken("test.admin@example.com", "Password1!");
        TestGoogleIdentityVerifier.identities.put("google-token-disabled",
                new VerifiedGoogleIdentity("google-subject-disabled", "google.disabled@example.com", "Google Disabled",
                        null, true));

        Integer userId = given()
                .contentType(ContentType.JSON)
                .body(Map.of("idToken", "google-token-disabled"))
                .when()
                .post("/auth/google")
                .then()
                .statusCode(200)
                .extract()
                .path("data.user.id");

        given()
                .header("Authorization", "Bearer " + adminToken)
                .contentType(ContentType.JSON)
                .body(Map.of("active", false))
                .when()
                .patch("/users/" + userId + "/status")
                .then()
                .statusCode(200);

        given()
                .contentType(ContentType.JSON)
                .body(Map.of("idToken", "google-token-disabled"))
                .when()
                .post("/auth/google")
                .then()
                .statusCode(403)
                .body("message", equalTo("User is inactive"));
    }

    @Alternative
    @Priority(1)
    @ApplicationScoped
    public static class TestGoogleIdentityVerifier implements GoogleIdentityVerifier {
        private static final Map<String, VerifiedGoogleIdentity> identities = new HashMap<>();

        @Override
        public VerifiedGoogleIdentity verify(String idToken) {
            VerifiedGoogleIdentity identity = identities.get(idToken);
            if (identity == null) {
                throw new com.javanc.user.shared.exception.ApplicationException(
                        com.javanc.user.shared.exception.ErrorCode.GOOGLE_TOKEN_INVALID);
            }
            return identity;
        }
    }

    public static class ContractTestProfile implements QuarkusTestProfile {
        @Override
        public Map<String, String> getConfigOverrides() {
            return Map.of(
                    "user.admin.bootstrap.enabled", "true",
                    "user.admin.email", "test.admin@example.com",
                    "user.admin.password", "Password1!",
                    "user.admin.name", "Test Admin");
        }
    }
}
