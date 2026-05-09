package com.javanc.user.application.usecase;

import com.javanc.user.adapter.out.persistence.JpaUserPanacheRepository;
import com.javanc.user.adapter.out.security.BcryptPasswordHasher;
import com.javanc.user.adapter.out.security.JwtTokenService;
import com.javanc.user.application.command.RefreshTokenCommand;
import com.javanc.user.application.command.SignInCommand;
import com.javanc.user.application.command.SignUpCommand;
import com.javanc.user.application.result.AuthenticationResult;
import com.javanc.user.domain.model.EmailAddress;
import com.javanc.user.domain.model.Role;
import com.javanc.user.domain.model.User;
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
class AuthUseCaseTest {

    @Inject
    AuthUseCase authUseCase;

    @Inject
    JpaUserPanacheRepository userRepository;

    @Inject
    BcryptPasswordHasher passwordHasher;

    @Inject
    JwtTokenService jwtTokenService;

    @Test
    @TestTransaction
    void signUpPersistsActiveUserWithDefaultRoleAndHashedPassword() {
        SignUpCommand command = command("Jane", "jane.signup@example.com", null, "Password1!", "EMP-1");

        AuthenticationResult response = authUseCase.signUp(command);
        User persisted = userRepository.findByEmail(new EmailAddress("jane.signup@example.com")).orElseThrow();

        assertEquals(200, response.statusCode());
        assertEquals("User Saved Successfully", response.message());
        assertTrue(response.valid());
        assertNotNull(response.user().id());
        assertEquals("jane.signup@example.com", response.user().email());
        assertEquals("user", response.user().role());
        assertTrue(response.user().active());
        assertNotEquals("Password1!", persisted.passwordHash().value());
        assertTrue(passwordHasher.matches("Password1!", persisted.passwordHash()));
        assertEquals(Role.user, persisted.role());
        assertTrue(persisted.active());
    }

    @Test
    @TestTransaction
    void duplicateSignUpReturnsConflictPayloadWithoutCreatingAnotherUser() {
        SignUpCommand command = command("Jane", "dup.signup@example.com", null, "Password1!", "EMP-1");

        authUseCase.signUp(command);
        AuthenticationResult duplicate = authUseCase.signUp(command);

        assertEquals(409, duplicate.statusCode());
        assertEquals("Email already exists", duplicate.message());
        assertFalse(duplicate.valid());
        assertEquals(1, userRepository.count("email", "dup.signup@example.com"));
    }

    @Test
    @TestTransaction
    void signUpPreservesExplicitRole() {
        AuthenticationResult response = authUseCase.signUp(
                command("Manager", "manager.signup@example.com", "manager", "Password1!", "EMP-MGR"));
        User persisted = userRepository.findByEmail(new EmailAddress("manager.signup@example.com")).orElseThrow();

        assertTrue(response.valid());
        assertEquals("manager", response.user().role());
        assertEquals(Role.manager, persisted.role());
    }

    @Test
    @TestTransaction
    void signInReturnsCurrentFailurePayloads() {
        AuthenticationResult missing = authUseCase.signIn(new SignInCommand("missing.signin@example.com",
                "Password1!"));

        authUseCase.signUp(command("Jane", "wrong.signin@example.com", null, "Password1!", "EMP-1"));
        AuthenticationResult wrongPassword = authUseCase.signIn(new SignInCommand("wrong.signin@example.com",
                "wrong-password"));

        assertEquals(404, missing.statusCode());
        assertEquals("Email not found", missing.message());
        assertFalse(missing.valid());
        assertEquals(401, wrongPassword.statusCode());
        assertEquals("Invalid credentials", wrongPassword.message());
        assertFalse(wrongPassword.valid());
    }

    @Test
    @TestTransaction
    void signInSuccessReturnsTokensRoleUserAndExpiration() {
        authUseCase.signUp(command("Jane", "jane.signin@example.com", null, "Password1!", "EMP-1"));
        AuthenticationResult response = authUseCase.signIn(new SignInCommand("jane.signin@example.com",
                "Password1!"));
        User persisted = userRepository.findByEmail(new EmailAddress("jane.signin@example.com")).orElseThrow();

        assertEquals(200, response.statusCode());
        assertEquals("Successfully Signed In", response.message());
        assertTrue(response.valid());
        assertNotNull(response.token());
        assertNotNull(response.refreshToken());
        assertEquals("24Hr", response.expirationTime());
        assertEquals("user", response.role());
        assertEquals("jane.signin@example.com", response.user().email());
        assertTrue(jwtTokenService.isTokenValid(response.token(), persisted));
        assertTrue(jwtTokenService.isTokenValid(response.refreshToken(), persisted));
    }

    @Test
    @TestTransaction
    void refreshTokenReturnsNewAccessTokenAndOriginalRefreshToken() {
        authUseCase.signUp(command("Jane", "jane.refresh@example.com", null, "Password1!", "EMP-1"));
        AuthenticationResult signIn = authUseCase.signIn(new SignInCommand("jane.refresh@example.com",
                "Password1!"));
        AuthenticationResult refreshed = authUseCase.refreshToken(new RefreshTokenCommand(signIn.refreshToken()));
        User persisted = userRepository.findByEmail(new EmailAddress("jane.refresh@example.com")).orElseThrow();

        assertEquals(200, refreshed.statusCode());
        assertEquals("Successfully Refreshed Token", refreshed.message());
        assertEquals("24Hr", refreshed.expirationTime());
        assertEquals(signIn.refreshToken(), refreshed.refreshToken());
        assertNotNull(refreshed.token());
        assertTrue(jwtTokenService.isTokenValid(refreshed.token(), persisted));
    }

    @Test
    @TestTransaction
    void validateTokenReturnsRoleForValidTokenAndFalseForInvalidToken() {
        authUseCase.signUp(command("Jane", "jane.valid@example.com", null, "Password1!", "EMP-1"));
        AuthenticationResult signIn = authUseCase.signIn(new SignInCommand("jane.valid@example.com", "Password1!"));

        AuthenticationResult valid = authUseCase.validateToken(signIn.token());
        AuthenticationResult invalid = authUseCase.validateToken("not-a-jwt");

        assertTrue(valid.valid());
        assertEquals("user", valid.role());
        assertFalse(invalid.valid());
    }

    private SignUpCommand command(String name, String email, String role, String password, String idEmployee) {
        return new SignUpCommand(name, email, role, password, idEmployee);
    }
}
