package com.javanc.user.domain.port;

public interface RoleRequestNotifier {
    void notifyUser(Integer userId, String message);
}
