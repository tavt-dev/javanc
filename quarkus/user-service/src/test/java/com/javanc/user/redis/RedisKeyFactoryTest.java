package com.javanc.user.redis;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

import com.javanc.user.adapter.out.redis.RedisKeyFactory;

class RedisKeyFactoryTest {

    private final RedisKeyFactory keyFactory = new RedisKeyFactory();

    @Test
    void buildsProjectKeyConventions() {
        assertEquals("javanc:auth:otp:user@example.com", keyFactory.authOtp("user@example.com"));
        assertEquals("javanc:auth:rate:login:127.0.0.1", keyFactory.authLoginRate("127.0.0.1"));
        assertEquals("javanc:auth:refresh:7:token-1", keyFactory.authRefresh("7", "token-1"));
        assertEquals("javanc:auth:blacklist:token-2", keyFactory.authBlacklist("token-2"));
    }

    @Test
    void rejectsBlankSegments() {
        assertThrows(IllegalArgumentException.class, () -> keyFactory.key("auth", "", "value"));
    }
}
