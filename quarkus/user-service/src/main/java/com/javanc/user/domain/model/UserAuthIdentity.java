package com.javanc.user.domain.model;

import java.time.Instant;

public class UserAuthIdentity {

    private final Integer id;
    private final UserId userId;
    private final AuthProvider provider;
    private final String providerSubject;
    private final Instant createdAt;
    private final Instant updatedAt;

    public UserAuthIdentity(Integer id, UserId userId, AuthProvider provider, String providerSubject, Instant createdAt,
            Instant updatedAt) {
        if (userId == null) {
            throw new IllegalArgumentException("User id is required");
        }
        if (provider == null) {
            throw new IllegalArgumentException("Auth provider is required");
        }
        if (provider == AuthProvider.GOOGLE && (providerSubject == null || providerSubject.isBlank())) {
            throw new IllegalArgumentException("Google subject is required");
        }
        this.id = id;
        this.userId = userId;
        this.provider = provider;
        this.providerSubject = normalize(providerSubject);
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static UserAuthIdentity local(UserId userId) {
        return new UserAuthIdentity(null, userId, AuthProvider.LOCAL, null, null, null);
    }

    public static UserAuthIdentity google(UserId userId, String providerSubject) {
        return new UserAuthIdentity(null, userId, AuthProvider.GOOGLE, providerSubject, null, null);
    }

    public Integer id() {
        return id;
    }

    public UserId userId() {
        return userId;
    }

    public AuthProvider provider() {
        return provider;
    }

    public String providerSubject() {
        return providerSubject;
    }

    public Instant createdAt() {
        return createdAt;
    }

    public Instant updatedAt() {
        return updatedAt;
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
