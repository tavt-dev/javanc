package com.javanc.user.domain.port;

public interface RoleRequestNotifier {
    void notifyUser(Integer userId, String message);

    default void notifyRoleRequest(Integer roleRequestId, Integer userId, String message, String event) {
        notifyUser(userId, message);
    }
}
