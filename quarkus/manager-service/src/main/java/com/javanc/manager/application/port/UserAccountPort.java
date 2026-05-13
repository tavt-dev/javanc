package com.javanc.manager.application.port;

import com.javanc.manager.application.dto.AuthenticationRequest;
import com.javanc.manager.application.dto.RoleRequestDTO;
import com.javanc.manager.application.dto.UserDTO;

import java.util.List;

public interface UserAccountPort {
    Integer createAccount(AuthenticationRequest authenticationRequest);

    UserDTO changeRole(Integer userId, String role);

    UserDTO currentUser();

    List<UserDTO> searchUsers(String query, String role, int page, int size);

    RoleRequestDTO requestHrPromotion(Integer targetUserId, Integer companyId, String companyName);

    RoleRequestDTO acceptHrPromotion(Integer requestId);

    UserDTO leaveHr();
}
