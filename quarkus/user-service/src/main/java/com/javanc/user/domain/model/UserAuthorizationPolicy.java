package com.javanc.user.domain.model;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class UserAuthorizationPolicy {

    public boolean isAdmin(User actor) {
        return actor != null && actor.role() == Role.admin;
    }

    public boolean isSelf(User actor, UserId targetId) {
        return actor != null && actor.id() != null && targetId != null
                && actor.id().value().equals(targetId.value());
    }

    public boolean canRead(User actor, User target) {
        return isAdmin(actor) || (target != null && isSelf(actor, target.id()));
    }

    public boolean canUpdateProfile(User actor, User target) {
        return canRead(actor, target);
    }

    public boolean canManageUsers(User actor) {
        return isAdmin(actor);
    }

    public boolean canListUsers(User actor) {
        return isAdmin(actor) || (actor != null && actor.role() == Role.manager);
    }

    public boolean canAssignRole(User actor, Role role) {
        if (actor == null || role == null) {
            return false;
        }
        if (isAdmin(actor)) {
            return true;
        }
        return actor.role() == Role.manager && role == Role.hr;
    }
}
