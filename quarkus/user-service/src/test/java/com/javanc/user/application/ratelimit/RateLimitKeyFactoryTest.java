package com.javanc.user.application.ratelimit;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

class RateLimitKeyFactoryTest {

    @Test
    void buildsStableHashedKeysWithoutExposingIdentity() {
        RateLimitKeyFactory factory = new RateLimitKeyFactory("test-secret");

        String first = factory.key("user-service", "auth-login-email", "user@example.com");
        String second = factory.key("user-service", "auth-login-email", "user@example.com");

        assertEquals(first, second);
        assertNotEquals(true, first.contains("user@example.com"));
    }
}
