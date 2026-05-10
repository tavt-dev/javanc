package com.javanc.user.domain.model;

public class User {

    private UserId id;
    private String name;
    private EmailAddress email;
    private EmployeeId employeeId;
    private PasswordHash passwordHash;
    private AccountStatus status;
    private Role role;

    public User(UserId id, String name, EmailAddress email, EmployeeId employeeId, PasswordHash passwordHash,
            boolean active, Role role) {
        this(id, name, email, employeeId, passwordHash, AccountStatus.fromActive(active), role);
    }

    public User(UserId id, String name, EmailAddress email, EmployeeId employeeId, PasswordHash passwordHash,
            AccountStatus status, Role role) {
        this.id = id;
        this.name = requireName(name);
        this.email = email;
        this.employeeId = employeeId;
        this.passwordHash = passwordHash;
        this.status = status == null ? AccountStatus.ACTIVE : status;
        this.role = role == null ? Role.user : role;
    }

    public UserId id() {
        return id;
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

    public void assignRole(Role actorRole, Role newRole) {
        if (actorRole != Role.admin || newRole == null) {
            throw new IllegalArgumentException("Only admin can assign roles");
        }
        this.role = newRole;
    }

    public void deactivate() {
        this.status = AccountStatus.DELETED;
    }

    private String requireName(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }
        return value.trim();
    }
}
