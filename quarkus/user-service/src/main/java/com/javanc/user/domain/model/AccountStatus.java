package com.javanc.user.domain.model;

public enum AccountStatus {
    PENDING_VERIFICATION,
    ACTIVE,
    DISABLED,
    DELETED,
    LOCKED;

    public boolean usable() {
        return this == ACTIVE;
    }

    public static AccountStatus fromActive(boolean active) {
        return active ? ACTIVE : DISABLED;
    }

    public static AccountStatus fromNullable(String value) {
        if (value == null || value.isBlank()) {
            return ACTIVE;
        }
        return AccountStatus.valueOf(value.trim().toUpperCase());
    }
}
