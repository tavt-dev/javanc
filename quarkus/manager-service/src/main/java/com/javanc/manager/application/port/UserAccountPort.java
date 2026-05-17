package com.javanc.manager.application.port;

import com.javanc.manager.application.dto.AuthenticationRequest;
import com.javanc.manager.application.dto.RoleRequestDTO;
import com.javanc.manager.application.dto.UserDTO;
import com.javanc.common.pagination.PageResponse;

public interface UserAccountPort {
    Integer createAccount(AuthenticationRequest authenticationRequest);

    UserDTO changeRole(Integer userId, String role);

    UserDTO currentUser();

    PageResponse<UserDTO> searchUsers(String query, String role, int page, int size, String sort);

    RoleRequestDTO requestHrPromotion(Integer targetUserId, Integer companyId, String companyName);

    RoleRequestDTO acceptHrPromotion(Integer requestId);

    UserDTO leaveHr();
}
