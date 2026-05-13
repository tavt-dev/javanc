package com.javanc.manager.infrastructure.client;

import com.javanc.manager.application.dto.ApiResponse;
import com.javanc.manager.application.dto.AuthenticationRequest;
import com.javanc.manager.application.dto.ChangeRoleRequest;
import com.javanc.manager.application.dto.CreateHrPromotionRequest;
import com.javanc.manager.application.dto.RoleRequestDTO;
import com.javanc.manager.application.dto.UserDTO;
import com.javanc.manager.application.exception.ApplicationException;
import com.javanc.manager.application.exception.ErrorCode;
import com.javanc.manager.application.port.UserAccountPort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.rest.client.inject.RestClient;

import java.util.List;

@ApplicationScoped
public class UserServiceAdapter implements UserAccountPort {

    private final UserClient userClient;

    @Inject
    public UserServiceAdapter(@RestClient UserClient userClient) {
        this.userClient = userClient;
    }

    @Override
    public Integer createAccount(AuthenticationRequest authenticationRequest) {
        ApiResponse<UserDTO> response = userClient.createAccount(authenticationRequest);
        if (response == null || response.data == null || response.data.id == null) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST);
        }
        return response.data.id;
    }

    @Override
    public UserDTO changeRole(Integer userId, String role) {
        ApiResponse<UserDTO> response = userClient.changeRole(userId, new ChangeRoleRequest(role));
        if (response == null || response.data == null || response.data.id == null) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST);
        }
        return response.data;
    }

    @Override
    public UserDTO currentUser() {
        ApiResponse<UserDTO> response = userClient.getCurrentUser();
        if (response == null || response.data == null || response.data.id == null) {
            throw new ApplicationException(ErrorCode.UNAUTHORIZED);
        }
        return response.data;
    }

    @Override
    public List<UserDTO> searchUsers(String query, String role, int page, int size) {
        ApiResponse<List<UserDTO>> response = userClient.searchUsers(query, role, page, size);
        return response == null || response.data == null ? List.of() : response.data;
    }

    @Override
    public RoleRequestDTO requestHrPromotion(Integer targetUserId, Integer companyId, String companyName) {
        ApiResponse<RoleRequestDTO> response = userClient.requestHrPromotion(
                new CreateHrPromotionRequest(targetUserId, companyId, companyName));
        if (response == null || response.data == null || response.data.id == null) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST);
        }
        return response.data;
    }

    @Override
    public RoleRequestDTO acceptHrPromotion(Integer requestId) {
        ApiResponse<RoleRequestDTO> response = userClient.acceptHrPromotion(requestId);
        if (response == null || response.data == null || response.data.id == null) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST);
        }
        return response.data;
    }

    @Override
    public UserDTO leaveHr() {
        ApiResponse<UserDTO> response = userClient.leaveHr();
        if (response == null || response.data == null || response.data.id == null) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST);
        }
        return response.data;
    }
}
