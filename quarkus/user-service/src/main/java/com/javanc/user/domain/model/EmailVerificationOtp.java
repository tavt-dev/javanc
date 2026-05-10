package com.javanc.user.domain.model;

import java.time.Instant;

public class EmailVerificationOtp {

    private final Long id;
    private final UserId userId;
    private final EmailAddress email;
    private final String otpHash;
    private final Instant expiresAt;
    private final int attemptCount;
    private final int maxAttempts;
    private final Instant consumedAt;
    private final Instant createdAt;
    private final Instant lastSentAt;

    public EmailVerificationOtp(Long id, UserId userId, EmailAddress email, String otpHash, Instant expiresAt,
            int attemptCount, int maxAttempts, Instant consumedAt, Instant createdAt, Instant lastSentAt) {
        this.id = id;
        this.userId = userId;
        this.email = email;
        this.otpHash = require(otpHash, "OTP hash is required");
        this.expiresAt = expiresAt;
        this.attemptCount = attemptCount;
        this.maxAttempts = maxAttempts;
        this.consumedAt = consumedAt;
        this.createdAt = createdAt;
        this.lastSentAt = lastSentAt;
    }

    public static EmailVerificationOtp create(UserId userId, EmailAddress email, String otpHash, Instant now,
            Instant expiresAt, int maxAttempts) {
        return new EmailVerificationOtp(null, userId, email, otpHash, expiresAt, 0, maxAttempts, null, now, now);
    }

    public Long id() {
        return id;
    }

    public UserId userId() {
        return userId;
    }

    public EmailAddress email() {
        return email;
    }

    public String otpHash() {
        return otpHash;
    }

    public Instant expiresAt() {
        return expiresAt;
    }

    public int attemptCount() {
        return attemptCount;
    }

    public int maxAttempts() {
        return maxAttempts;
    }

    public Instant consumedAt() {
        return consumedAt;
    }

    public Instant createdAt() {
        return createdAt;
    }

    public Instant lastSentAt() {
        return lastSentAt;
    }

    public boolean consumed() {
        return consumedAt != null;
    }

    public boolean expired(Instant now) {
        return now == null || !expiresAt.isAfter(now);
    }

    public boolean attemptsExceeded() {
        return attemptCount >= maxAttempts;
    }

    public EmailVerificationOtp incrementAttempts() {
        return new EmailVerificationOtp(id, userId, email, otpHash, expiresAt, attemptCount + 1, maxAttempts,
                consumedAt, createdAt, lastSentAt);
    }

    public EmailVerificationOtp consume(Instant now) {
        return new EmailVerificationOtp(id, userId, email, otpHash, expiresAt, attemptCount, maxAttempts,
                now, createdAt, lastSentAt);
    }

    private static String require(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value;
    }
}
