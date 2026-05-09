package com.javanc.user.application.usecase;

import com.javanc.user.application.result.UserResult;
import com.javanc.user.domain.model.User;

final class UserResultMapper {

    private UserResultMapper() {
    }

    static UserResult toResult(User user) {
        if (user == null) {
            return null;
        }
        return new UserResult(
                user.id().value(),
                user.name(),
                user.email().value(),
                user.employeeId() == null ? null : user.employeeId().value(),
                user.role() == null ? null : user.role().name(),
                user.active());
    }
}
