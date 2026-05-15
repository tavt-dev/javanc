package com.javanc.user.domain.model;

import java.time.Instant;

public class User {

    private UserId id;
    private String name;
    private EmailAddress email;
    private EmployeeId employeeId;
    private PasswordHash passwordHash;
    private AccountStatus status;
    private Role role;
    private String avatarUrl;
    private boolean emailVerified;
    private Instant lastLoginAt;
    private Instant createdAt;
    private Instant updatedAt;

    public User(UserId id, String name, EmailAddress email, EmployeeId employeeId, PasswordHash passwordHash,
            boolean active, Role role) {
        this(id, name, email, employeeId, passwordHash, AccountStatus.fromActive(active), role);
    }

    public User(UserId id, String name, EmailAddress email, EmployeeId employeeId, PasswordHash passwordHash,
            AccountStatus status, Role role) {
        this(id, name, email, employeeId, passwordHash, status, role, null,
                status == AccountStatus.ACTIVE, null, null, null);
    }

    public User(UserId id, String name, EmailAddress email, EmployeeId employeeId, PasswordHash passwordHash,
            AccountStatus status, Role role, String avatarUrl, boolean emailVerified, Instant lastLoginAt,
            Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.name = requireName(name);
        this.email = email;
        this.employeeId = employeeId;
        this.passwordHash = passwordHash;
        this.status = status == null ? AccountStatus.ACTIVE : status;
        this.role = role == null ? Role.user : role;
        this.avatarUrl = normalizeOptional(avatarUrl);
        this.emailVerified = emailVerified;
        this.lastLoginAt = lastLoginAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UserId id() {
        return id;
    }

    public static User registerPending(String name, EmailAddress email, PasswordHash passwordHash) {
        return new User(null, name, email, null, passwordHash, AccountStatus.PENDING_VERIFICATION, Role.user);
    }

    public static User googleAccount(String name, EmailAddress email, String avatarUrl) {
        return new User(null, name, email, null, null, AccountStatus.ACTIVE, Role.user, avatarUrl, true, null, null,
                null);
    }

    public String name() {
        return name;
    }

    public EmailAddress email() {
        return email;
    }

    public EmployeeId employeeId() {
        return employeeId;
    }

    public PasswordHash passwordHash() {
        return passwordHash;
    }

    public boolean active() {
        return status.usable();
    }

    public AccountStatus status() {
        return status;
    }

    public Role role() {
        return role;
    }

    public String avatarUrl() {
        return avatarUrl;
    }

    public boolean emailVerified() {
        return emailVerified;
    }

    public Instant lastLoginAt() {
        return lastLoginAt;
    }

    public Instant createdAt() {
        return createdAt;
    }

    public Instant updatedAt() {
        return updatedAt;
    }

    public void updateProfile(String name, EmailAddress email, EmployeeId employeeId) {
        this.name = requireName(name);
        this.email = email;
        this.employeeId = employeeId;
    }

    public void changePassword(PasswordHash passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void toggleActive() {
        this.status = active() ? AccountStatus.DISABLED : AccountStatus.ACTIVE;
    }

    public void setActive(boolean active) {
        this.status = AccountStatus.fromActive(active);
    }

    public void changeStatus(AccountStatus status) {
        this.status = status == null ? AccountStatus.DISABLED : status;
    }

    public void verifyEmail() {
        if (status != AccountStatus.PENDING_VERIFICATION) {
            throw new IllegalStateException("Only pending users can verify email");
        }
        this.status = AccountStatus.ACTIVE;
        this.emailVerified = true;
    }

    public void assignRole(Role actorRole, Role newRole) {
        boolean allowed = actorRole == Role.admin || (actorRole == Role.manager && newRole == Role.hr);
        if (!allowed || newRole == null) {
            throw new IllegalArgumentException("Role assignment is not allowed");
        }
        this.role = newRole;
    }

    public void deactivate() {
        this.status = AccountStatus.DELETED;
    }

    public void fillMissingGoogleProfile(String googleName, String googleAvatarUrl) {
        if ((name == null || name.isBlank()) && googleName != null && !googleName.isBlank()) {
            this.name = googleName.trim();
        }
        if ((avatarUrl == null || avatarUrl.isBlank()) && googleAvatarUrl != null && !googleAvatarUrl.isBlank()) {
            this.avatarUrl = googleAvatarUrl.trim();
        }
    }

    public void recordLogin(Instant instant) {
        this.lastLoginAt = instant;
    }

    public void markEmailVerified() {
        this.emailVerified = true;
    }

    private String requireName(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }
        return value.trim();
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
