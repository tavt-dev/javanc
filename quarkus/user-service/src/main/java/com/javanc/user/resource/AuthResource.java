package com.javanc.user.resource;

import com.javanc.user.dto.ApiResponse;
import com.javanc.user.dto.UserDTO;
import com.javanc.user.dto.request.AuthenticationRequest;
import com.javanc.user.dto.response.AuthenticationResponse;
import com.javanc.user.service.AuthService;
import com.javanc.user.service.UserApplicationService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AuthResource {

    private final AuthService authService;
    private final UserApplicationService userApplicationService;

    @Inject
    public AuthResource(AuthService authService, UserApplicationService userApplicationService) {
        this.authService = authService;
        this.userApplicationService = userApplicationService;
    }

    @POST
    @Path("/isValid")
    @Consumes({ MediaType.TEXT_PLAIN, MediaType.APPLICATION_JSON })
    public ApiResponse<AuthenticationResponse> isValid(String token) {
        return new ApiResponse<>(true, "", authService.isValid(token));
    }

    @POST
    @Path("/signup")
    public Response signUp(AuthenticationRequest signUpRequest) {
        AuthenticationResponse authenticationResponse = authService.signUp(signUpRequest);
        ApiResponse<AuthenticationResponse> response = new ApiResponse<>(true, "Sign up successfully",
                authenticationResponse);
        if (!authenticationResponse.isVaild()) {
            return Response.status(Response.Status.CONFLICT).entity(response).build();
        }
        return Response.ok(response).build();
    }

    @POST
    @Path("/signin")
    public Response signIn(AuthenticationRequest signInRequest) {
        AuthenticationResponse authenticationResponse = authService.signIn(signInRequest);
        ApiResponse<AuthenticationResponse> response = new ApiResponse<>(true, "Sign in successfully",
                authenticationResponse);
        if (!authenticationResponse.isVaild()) {
            return Response.status(Response.Status.UNAUTHORIZED).entity(response).build();
        }
        return Response.ok(response).build();
    }

    @POST
    @Path("/refresh")
    public ApiResponse<AuthenticationResponse> refreshToken(AuthenticationRequest refreshTokenRequest) {
        return new ApiResponse<>(true, "Refresh token successfully", authService.refreshToken(refreshTokenRequest));
    }

    @POST
    @Path("/update")
    public ApiResponse<UserDTO> update(@QueryParam("token") String token, UserDTO userDTO) {
        return new ApiResponse<>(true, "User updated successfully", userApplicationService.update(token, userDTO));
    }

    @GET
    @Path("/findbyid")
    public ApiResponse<UserDTO> findById(@QueryParam("id") Integer id) {
        return new ApiResponse<>(true, "User retrieved successfully", userApplicationService.findById(id));
    }

    @GET
    @Path("/checkId")
    public ApiResponse<Boolean> checkId(@QueryParam("id") Integer id) {
        return new ApiResponse<>(true, "Check user id successfully", userApplicationService.checkUser(id));
    }

    @GET
    @Path("/getCurrentUser")
    public ApiResponse<UserDTO> getCurrentUser(@HeaderParam("Authorization") String authorizationHeader) {
        return new ApiResponse<>(true, "Check user id successfully",
                userApplicationService.getCurrentUser(authorizationHeader));
    }

    @GET
    @Path("/getAll")
    public ApiResponse<List<UserDTO>> getAllUsers(@QueryParam("token") String token) {
        return new ApiResponse<>(true, "All users retrieved successfully", userApplicationService.getAll(token));
    }

    @GET
    @Path("/getlistuserbyid")
    public ApiResponse<List<UserDTO>> getUserByIds(@QueryParam("token") String token,
            @QueryParam("ids") List<Integer> ids) {
        return new ApiResponse<>(true, "User retrieved successfully",
                userApplicationService.findUsersByIds(token, ids));
    }

    @POST
    @Path("/updateactive")
    public ApiResponse<UserDTO> updateActive(@QueryParam("token") String token, UserDTO userDTO) {
        return new ApiResponse<>(true, "User updated successfully",
                userApplicationService.updateIsActive(token, userDTO.getId()));
    }

    @DELETE
    @Path("/delete")
    public ApiResponse<UserDTO> deleteUser(@QueryParam("token") String token, @QueryParam("id") Integer id) {
        return new ApiResponse<>(true, "User deleted successfully", userApplicationService.deleteUser(token, id));
    }

    @GET
    @Path("/ourUserDetailsService")
    public Response getUserDetails() {
        return Response.status(Response.Status.NOT_IMPLEMENTED)
                .entity(new ApiResponse<>(false, "Endpoint not implemented: Spring mapping is broken", null))
                .build();
    }
}
