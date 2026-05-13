package com.javanc.user.adapter.in.rest;

import com.javanc.user.adapter.in.rest.dto.ApiResponse;
import com.javanc.user.adapter.in.rest.dto.ChangeUserRoleRequest;
import com.javanc.user.adapter.in.rest.dto.ChangeUserStatusRequest;
import com.javanc.user.adapter.in.rest.dto.CreateHrPromotionRequest;
import com.javanc.user.adapter.in.rest.dto.CreateManagerUpgradeRequest;
import com.javanc.user.adapter.in.rest.dto.CreateUserAccountRequest;
import com.javanc.user.adapter.in.rest.dto.RejectRoleRequest;
import com.javanc.user.adapter.in.rest.dto.RoleRequestDTO;
import com.javanc.user.adapter.in.rest.dto.UpdateUserRequest;
import com.javanc.user.adapter.in.rest.dto.UserDTO;
import com.javanc.user.application.usecase.UserUseCase;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/users")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class UserResource {

    private final UserUseCase userUseCase;
    private final RestAuthMapper mapper;
    private final TokenResolver tokenResolver;

    @Inject
    public UserResource(UserUseCase userUseCase, RestAuthMapper mapper, TokenResolver tokenResolver) {
        this.userUseCase = userUseCase;
        this.mapper = mapper;
        this.tokenResolver = tokenResolver;
    }

    @GET
    @Path("/me")
    public ApiResponse<UserDTO> me(@HeaderParam("Authorization") String authorizationHeader) {
        String token = tokenResolver.requireHeaderToken(authorizationHeader);
        return new ApiResponse<>(true, "Current user retrieved successfully", mapper.toDto(userUseCase.me(token)));
    }

    @GET
    @Path("/{id}")
    public ApiResponse<UserDTO> findById(@HeaderParam("Authorization") String authorizationHeader,
            @PathParam("id") Integer id) {
        String token = tokenResolver.requireHeaderToken(authorizationHeader);
        return new ApiResponse<>(true, "User retrieved successfully", mapper.toDto(userUseCase.findById(token, id)));
    }

    @GET
    public ApiResponse<List<UserDTO>> list(@HeaderParam("Authorization") String authorizationHeader,
            @QueryParam("ids") List<Integer> ids) {
        String token = tokenResolver.requireHeaderToken(authorizationHeader);
        return new ApiResponse<>(true, "Users retrieved successfully",
                userUseCase.list(token, ids).stream().map(mapper::toDto).toList());
    }

    @GET
    @Path("/search")
    public ApiResponse<List<UserDTO>> search(@HeaderParam("Authorization") String authorizationHeader,
            @QueryParam("query") String query, @QueryParam("role") String role, @QueryParam("page") Integer page,
            @QueryParam("size") Integer size) {
        String token = tokenResolver.requireHeaderToken(authorizationHeader);
        return new ApiResponse<>(true, "Users retrieved successfully",
                userUseCase.search(token, query, role, page, size).stream().map(mapper::toDto).toList());
    }

    @PATCH
    @Path("/{id}")
    public ApiResponse<UserDTO> update(@HeaderParam("Authorization") String authorizationHeader,
            @PathParam("id") Integer id, UpdateUserRequest request) {
        String token = tokenResolver.requireHeaderToken(authorizationHeader);
        return new ApiResponse<>(true, "User updated successfully",
                mapper.toDto(userUseCase.update(mapper.toCommand(token, id, request))));
    }

    @PATCH
    @Path("/{id}/status")
    public ApiResponse<UserDTO> changeStatus(@HeaderParam("Authorization") String authorizationHeader,
            @PathParam("id") Integer id, ChangeUserStatusRequest request) {
        String token = tokenResolver.requireHeaderToken(authorizationHeader);
        return new ApiResponse<>(true, "User status updated successfully",
                mapper.toDto(userUseCase.changeStatus(mapper.toCommand(token, id, request))));
    }

    @PATCH
    @Path("/{id}/role")
    public ApiResponse<UserDTO> changeRole(@HeaderParam("Authorization") String authorizationHeader,
            @PathParam("id") Integer id, ChangeUserRoleRequest request) {
        String token = tokenResolver.requireHeaderToken(authorizationHeader);
        return new ApiResponse<>(true, "User role updated successfully",
                mapper.toDto(userUseCase.changeRole(mapper.toCommand(token, id, request))));
    }

    @POST
    @Path("/admin/accounts")
    public ApiResponse<UserDTO> createAccount(@HeaderParam("Authorization") String authorizationHeader,
            CreateUserAccountRequest request) {
        String token = tokenResolver.requireHeaderToken(authorizationHeader);
        return new ApiResponse<>(true, "User account created successfully",
                mapper.toDto(userUseCase.createAccount(mapper.toCommand(token, request))));
    }

    @DELETE
    @Path("/{id}")
    public ApiResponse<UserDTO> delete(@HeaderParam("Authorization") String authorizationHeader,
            @PathParam("id") Integer id) {
        String token = tokenResolver.requireHeaderToken(authorizationHeader);
        return new ApiResponse<>(true, "User deleted successfully", mapper.toDto(userUseCase.delete(token, id)));
    }

    @POST
    @Path("/me/manager-upgrade-requests")
    public ApiResponse<RoleRequestDTO> requestManagerUpgrade(@HeaderParam("Authorization") String authorizationHeader,
            CreateManagerUpgradeRequest request) {
        String token = tokenResolver.requireHeaderToken(authorizationHeader);
        return new ApiResponse<>(true, "Manager upgrade request created",
                mapper.toDto(userUseCase.requestManagerUpgrade(token, request == null ? null : request.reason)));
    }

    @GET
    @Path("/me/role-requests")
    public ApiResponse<List<RoleRequestDTO>> myRoleRequests(@HeaderParam("Authorization") String authorizationHeader) {
        String token = tokenResolver.requireHeaderToken(authorizationHeader);
        return new ApiResponse<>(true, "Role requests retrieved",
                userUseCase.myRoleRequests(token).stream().map(mapper::toDto).toList());
    }

    @GET
    @Path("/admin/role-requests")
    public ApiResponse<List<RoleRequestDTO>> adminRoleRequests(@HeaderParam("Authorization") String authorizationHeader,
            @QueryParam("status") String status, @QueryParam("type") String type) {
        String token = tokenResolver.requireHeaderToken(authorizationHeader);
        return new ApiResponse<>(true, "Role requests retrieved",
                userUseCase.adminRoleRequests(token, status, type).stream().map(mapper::toDto).toList());
    }

    @PATCH
    @Path("/admin/role-requests/{id}/approve")
    public ApiResponse<RoleRequestDTO> approveRoleRequest(@HeaderParam("Authorization") String authorizationHeader,
            @PathParam("id") Integer id) {
        String token = tokenResolver.requireHeaderToken(authorizationHeader);
        return new ApiResponse<>(true, "Role request approved", mapper.toDto(userUseCase.approveRoleRequest(token, id)));
    }

    @PATCH
    @Path("/admin/role-requests/{id}/reject")
    public ApiResponse<RoleRequestDTO> rejectRoleRequest(@HeaderParam("Authorization") String authorizationHeader,
            @PathParam("id") Integer id, RejectRoleRequest request) {
        String token = tokenResolver.requireHeaderToken(authorizationHeader);
        return new ApiResponse<>(true, "Role request rejected",
                mapper.toDto(userUseCase.rejectRoleRequest(token, id, request == null ? null : request.adminNote)));
    }

    @POST
    @Path("/manager/hr-promotion-requests")
    public ApiResponse<RoleRequestDTO> requestHrPromotion(@HeaderParam("Authorization") String authorizationHeader,
            CreateHrPromotionRequest request) {
        String token = tokenResolver.requireHeaderToken(authorizationHeader);
        return new ApiResponse<>(true, "HR promotion request created", mapper.toDto(userUseCase.requestHrPromotion(token,
                request == null ? null : request.targetUserId, request == null ? null : request.companyId,
                request == null ? null : request.companyName)));
    }

    @GET
    @Path("/me/hr-promotion-requests")
    public ApiResponse<List<RoleRequestDTO>> myHrPromotions(@HeaderParam("Authorization") String authorizationHeader) {
        String token = tokenResolver.requireHeaderToken(authorizationHeader);
        return new ApiResponse<>(true, "HR promotion requests retrieved",
                userUseCase.myHrPromotions(token).stream().map(mapper::toDto).toList());
    }

    @GET
    @Path("/role-requests/{id}")
    public ApiResponse<RoleRequestDTO> findRoleRequest(@HeaderParam("Authorization") String authorizationHeader,
            @PathParam("id") Integer id) {
        String token = tokenResolver.requireHeaderToken(authorizationHeader);
        return new ApiResponse<>(true, "Role request retrieved", mapper.toDto(userUseCase.findRoleRequest(token, id)));
    }

    @PATCH
    @Path("/me/hr-promotion-requests/{id}/accept")
    public ApiResponse<RoleRequestDTO> acceptHrPromotion(@HeaderParam("Authorization") String authorizationHeader,
            @PathParam("id") Integer id) {
        String token = tokenResolver.requireHeaderToken(authorizationHeader);
        return new ApiResponse<>(true, "HR promotion accepted", mapper.toDto(userUseCase.acceptHrPromotion(token, id)));
    }

    @PATCH
    @Path("/me/hr-promotion-requests/{id}/reject")
    public ApiResponse<RoleRequestDTO> rejectHrPromotion(@HeaderParam("Authorization") String authorizationHeader,
            @PathParam("id") Integer id) {
        String token = tokenResolver.requireHeaderToken(authorizationHeader);
        return new ApiResponse<>(true, "HR promotion rejected", mapper.toDto(userUseCase.rejectHrPromotion(token, id)));
    }

    @PATCH
    @Path("/me/leave-hr")
    public ApiResponse<UserDTO> leaveHr(@HeaderParam("Authorization") String authorizationHeader) {
        String token = tokenResolver.requireHeaderToken(authorizationHeader);
        return new ApiResponse<>(true, "HR role removed", mapper.toDto(userUseCase.leaveHr(token)));
    }
}
