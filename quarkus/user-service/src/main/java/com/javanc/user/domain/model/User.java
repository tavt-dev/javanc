package com.javanc.user.domain.model;

public class User {

    private UserId id;
    private String name;
    private EmailAddress email;
    private EmployeeId employeeId;
    private PasswordHash passwordHash;
    private boolean active;
    private Role role;

    public User(UserId id, String name, EmailAddress email, EmployeeId employeeId, PasswordHash passwordHash,
            boolean active, Role role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.employeeId = employeeId;
        this.passwordHash = passwordHash;
        this.active = active;
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
        return active;
    }

    public Role role() {
        return role;
    }

    public void updateProfile(String name, EmailAddress email, EmployeeId employeeId, Role role) {
        this.name = name;
        this.email = email;
        this.employeeId = employeeId;
        if (role != null) {
            this.role = role;
        }
    }

    public void changePassword(PasswordHash passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void toggleActive() {
        this.active = !this.active;
    }
}
