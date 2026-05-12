package com.javanc.profile.application.security;

import java.util.Set;

public record CurrentUser(Integer userId, String email, String role) {

    private static final Set<String> PRIVILEGED_ROLES = Set.of("admin", "hr", "manager");

    public boolean isSelf(Integer targetUserId) {
        return userId != null && userId.equals(targetUserId);
    }

    public boolean isAdmin() {
        return "admin".equalsIgnoreCase(role);
    }

    public boolean canReadBatch() {
        return role != null && PRIVILEGED_ROLES.contains(role.toLowerCase());
    }
}
