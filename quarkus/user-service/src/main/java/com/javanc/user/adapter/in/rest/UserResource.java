package com.javanc.user.adapter.in.rest;

import com.javanc.user.adapter.in.rest.dto.ApiResponse;
import com.javanc.user.adapter.in.rest.dto.ChangeUserRoleRequest;
import com.javanc.user.adapter.in.rest.dto.ChangeUserStatusRequest;
import com.javanc.user.adapter.in.rest.dto.CreateUserAccountRequest;
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
}
