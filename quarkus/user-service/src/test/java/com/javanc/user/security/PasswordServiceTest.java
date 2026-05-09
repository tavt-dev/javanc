package com.javanc.user.security;

import com.javanc.user.adapter.out.security.BcryptPasswordHasher;
import com.javanc.user.domain.model.PasswordHash;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PasswordServiceTest {

    private final BcryptPasswordHasher passwordHasher = new BcryptPasswordHasher();

    @Test
    void hashesAndVerifiesBcryptPasswords() {
        String rawPassword = "Password1!";

        PasswordHash encodedPassword = passwordHasher.hash(rawPassword);

        assertNotEquals(rawPassword, encodedPassword.value());
        assertTrue(encodedPassword.value().startsWith("$2"));
        assertTrue(passwordHasher.matches(rawPassword, encodedPassword));
        assertFalse(passwordHasher.matches("wrong-password", encodedPassword));
    }

    @Test
    void rejectsMissingPasswordInputs() {
        assertFalse(passwordHasher.matches(null, new PasswordHash("$2a$10$abcdefghijklmnopqrstuu1KtnEa")));
        assertFalse(passwordHasher.matches("Password1!", null));
    }
}
