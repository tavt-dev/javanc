package com.javanc.user.service;

import com.javanc.user.dto.request.AuthenticationRequest;
import com.javanc.user.dto.response.AuthenticationResponse;
import com.javanc.user.entity.Role;
import com.javanc.user.entity.User;
import com.javanc.user.repository.UserRepository;
import com.javanc.user.security.JwtService;
import com.javanc.user.security.PasswordService;
import io.quarkus.test.TestTransaction;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
class AuthServiceTest {

    @Inject
    AuthService authService;

    @Inject
    UserRepository userRepository;

    @Inject
    PasswordService passwordService;

    @Inject
    JwtService jwtService;

    @Test
    @TestTransaction
    void signUpPersistsActiveUserWithDefaultRoleAndHashedPassword() {
        AuthenticationRequest request = request("Jane", "jane.signup@example.com", null, "Password1!", "EMP-1");

        AuthenticationResponse response = authService.signUp(request);
        User persisted = userRepository.findByEmail("jane.signup@example.com").orElseThrow();

        assertEquals(200, response.getStatusCode());
        assertEquals("User Saved Successfully", response.getMessage());
        assertTrue(response.isVaild());
        assertNotNull(response.getUser().getId());
        assertEquals("jane.signup@example.com", response.getUser().getEmail());
        assertEquals("user", response.getUser().getRole());
        assertTrue(response.getUser().isActive());
        assertNotEquals("Password1!", persisted.getPassword());
        assertTrue(passwordService.matches("Password1!", persisted.getPassword()));
        assertEquals(Role.user, persisted.getRole());
        assertTrue(persisted.isActive());
    }

    @Test
    @TestTransaction
    void duplicateSignUpReturnsConflictPayloadWithoutCreatingAnotherUser() {
        AuthenticationRequest request = request("Jane", "dup.signup@example.com", null, "Password1!", "EMP-1");

        authService.signUp(request);
        AuthenticationResponse duplicate = authService.signUp(request);

        assertEquals(409, duplicate.getStatusCode());
        assertEquals("Email already exists", duplicate.getMessage());
        assertFalse(duplicate.isVaild());
        assertEquals(1, userRepository.count("email", "dup.signup@example.com"));
    }

    @Test
    @TestTransaction
    void signUpPreservesExplicitRole() {
        AuthenticationResponse response = authService.signUp(
                request("Manager", "manager.signup@example.com", "manager", "Password1!", "EMP-MGR"));
        User persisted = userRepository.findByEmail("manager.signup@example.com").orElseThrow();

        assertTrue(response.isVaild());
        assertEquals("manager", response.getUser().getRole());
        assertEquals(Role.manager, persisted.getRole());
    }

    @Test
    @TestTransaction
    void signInReturnsCurrentFailurePayloads() {
        AuthenticationResponse missing = authService.signIn(
                request(null, "missing.signin@example.com", null, "Password1!", null));

        authService.signUp(request("Jane", "wrong.signin@example.com", null, "Password1!", "EMP-1"));
        AuthenticationResponse wrongPassword = authService.signIn(
                request(null, "wrong.signin@example.com", null, "wrong-password", null));

        assertEquals(404, missing.getStatusCode());
        assertEquals("Email not found", missing.getMessage());
        assertFalse(missing.isVaild());
        assertEquals(401, wrongPassword.getStatusCode());
        assertEquals("Invalid credentials", wrongPassword.getMessage());
        assertFalse(wrongPassword.isVaild());
    }

    @Test
    @TestTransaction
    void signInSuccessReturnsTokensRoleUserAndExpiration() {
        authService.signUp(request("Jane", "jane.signin@example.com", null, "Password1!", "EMP-1"));
        AuthenticationResponse response = authService.signIn(
                request(null, "jane.signin@example.com", null, "Password1!", null));
        User persisted = userRepository.findByEmail("jane.signin@example.com").orElseThrow();

        assertEquals(200, response.getStatusCode());
        assertEquals("Successfully Signed In", response.getMessage());
        assertTrue(response.isVaild());
        assertNotNull(response.getToken());
        assertNotNull(response.getRefreshToken());
        assertEquals("24Hr", response.getExpirationTime());
        assertEquals("user", response.getRole());
        assertEquals("jane.signin@example.com", response.getUser().getEmail());
        assertTrue(jwtService.isTokenValid(response.getToken(), persisted));
        assertTrue(jwtService.isTokenValid(response.getRefreshToken(), persisted));
    }

    @Test
    @TestTransaction
    void refreshTokenReturnsNewAccessTokenAndOriginalRefreshToken() {
        authService.signUp(request("Jane", "jane.refresh@example.com", null, "Password1!", "EMP-1"));
        AuthenticationResponse signIn = authService.signIn(
                request(null, "jane.refresh@example.com", null, "Password1!", null));
        AuthenticationRequest refreshRequest = new AuthenticationRequest();
        refreshRequest.setToken(signIn.getRefreshToken());

        AuthenticationResponse refreshed = authService.refreshToken(refreshRequest);
        User persisted = userRepository.findByEmail("jane.refresh@example.com").orElseThrow();

        assertEquals(200, refreshed.getStatusCode());
        assertEquals("Successfully Refreshed Token", refreshed.getMessage());
        assertEquals("24Hr", refreshed.getExpirationTime());
        assertEquals(signIn.getRefreshToken(), refreshed.getRefreshToken());
        assertNotNull(refreshed.getToken());
        assertTrue(jwtService.isTokenValid(refreshed.getToken(), persisted));
    }

    @Test
    @TestTransaction
    void isValidReturnsRoleForValidTokenAndFalseForInvalidToken() {
        authService.signUp(request("Jane", "jane.valid@example.com", null, "Password1!", "EMP-1"));
        AuthenticationResponse signIn = authService.signIn(
                request(null, "jane.valid@example.com", null, "Password1!", null));

        AuthenticationResponse valid = authService.isValid(signIn.getToken());
        AuthenticationResponse invalid = authService.isValid("not-a-jwt");

        assertTrue(valid.isVaild());
        assertEquals("user", valid.getRole());
        assertFalse(invalid.isVaild());
    }

    private AuthenticationRequest request(String name, String email, String role, String password, String idEmployee) {
        return new AuthenticationRequest(name, email, role, null, password, idEmployee);
    }
}
