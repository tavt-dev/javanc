package com.javanc.user.adapter.out.redis;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class RedisKeyFactory {

    private static final String PREFIX = "javanc";

    public String key(String domain, String feature, String... identifiers) {
        String[] segments = new String[identifiers.length + 3];
        segments[0] = PREFIX;
        segments[1] = segment(domain, "domain");
        segments[2] = segment(feature, "feature");
        for (int index = 0; index < identifiers.length; index++) {
            segments[index + 3] = segment(identifiers[index], "identifier");
        }
        return String.join(":", segments);
    }

    public String authOtp(String email) {
        return key("auth", "otp", email);
    }

    public String authLoginRate(String ipAddress) {
        return key("auth", "rate", "login", ipAddress);
    }

    public String authRefresh(String userId, String tokenId) {
        return key("auth", "refresh", userId, tokenId);
    }

    public String authBlacklist(String tokenId) {
        return key("auth", "blacklist", tokenId);
    }

    private static String segment(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " is required");
        }
        return value.trim();
    }
}
