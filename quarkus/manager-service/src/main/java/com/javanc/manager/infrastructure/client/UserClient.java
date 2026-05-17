package com.javanc.manager.infrastructure.client;

import com.javanc.manager.application.dto.ApiResponse;
import com.javanc.manager.application.dto.AuthenticationRequest;
import com.javanc.manager.application.dto.ChangeRoleRequest;
import com.javanc.manager.application.dto.CreateHrPromotionRequest;
import com.javanc.manager.application.dto.RoleRequestDTO;
import com.javanc.manager.application.dto.UserDTO;
import com.javanc.common.pagination.PageResponse;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.annotation.RegisterClientHeaders;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@RegisterRestClient(configKey = "user-service")
@RegisterClientHeaders(AuthorizationPropagationHeadersFactory.class)
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public interface UserClient {
    @POST
    @Path("/users/admin/accounts")
    ApiResponse<UserDTO> createAccount(AuthenticationRequest request);

    @GET
    @Path("/users/me")
    ApiResponse<UserDTO> getCurrentUser();

    @GET
    @Path("/users/{id}")
    ApiResponse<UserDTO> findById(@PathParam("id") Integer id);

    @PATCH
    @Path("/users/{id}/role")
    ApiResponse<UserDTO> changeRole(@PathParam("id") Integer id, ChangeRoleRequest request);

    @GET
    @Path("/users/search")
    ApiResponse<PageResponse<UserDTO>> searchUsers(@QueryParam("query") String query, @QueryParam("role") String role,
            @QueryParam("page") Integer page, @QueryParam("size") Integer size, @QueryParam("sort") String sort);

    @POST
    @Path("/users/manager/hr-promotion-requests")
    ApiResponse<RoleRequestDTO> requestHrPromotion(CreateHrPromotionRequest request);

    @PATCH
    @Path("/users/me/hr-promotion-requests/{id}/accept")
    ApiResponse<RoleRequestDTO> acceptHrPromotion(@PathParam("id") Integer id);

    @PATCH
    @Path("/users/me/leave-hr")
    ApiResponse<UserDTO> leaveHr();
}
