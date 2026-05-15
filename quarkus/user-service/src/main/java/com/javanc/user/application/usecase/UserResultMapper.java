package com.javanc.user.application.usecase;

import com.javanc.user.application.result.UserResult;
import com.javanc.user.domain.model.AuthProvider;
import com.javanc.user.domain.model.User;

final class UserResultMapper {

    private UserResultMapper() {
    }

    static UserResult toResult(User user) {
        return toResult(user, null);
    }

    static UserResult toResult(User user, AuthProvider provider) {
        if (user == null) {
            return null;
        }
        return new UserResult(
                user.id().value(),
                user.name(),
                user.email().value(),
                user.employeeId() == null ? null : user.employeeId().value(),
                user.role() == null ? null : user.role().name(),
                user.active(),
                user.status().name(),
                user.avatarUrl(),
                provider == null ? null : provider.name());
    }
}
