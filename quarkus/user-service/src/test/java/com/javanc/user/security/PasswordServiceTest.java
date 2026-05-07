package com.javanc.user.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PasswordServiceTest {

    private final PasswordService passwordService = new PasswordService();

    @Test
    void hashesAndVerifiesBcryptPasswords() {
        String rawPassword = "Password1!";

        String encodedPassword = passwordService.hash(rawPassword);

        assertNotEquals(rawPassword, encodedPassword);
        assertTrue(encodedPassword.startsWith("$2"));
        assertTrue(passwordService.matches(rawPassword, encodedPassword));
        assertFalse(passwordService.matches("wrong-password", encodedPassword));
    }

    @Test
    void rejectsMissingPasswordInputs() {
        assertFalse(passwordService.matches(null, "$2a$10$abcdefghijklmnopqrstuu1KtnEa"));
        assertFalse(passwordService.matches("Password1!", null));
        assertFalse(passwordService.matches("Password1!", ""));
    }
}
