package com.javanc.user.adapter.in.rest;

import com.javanc.user.adapter.in.rest.dto.ApiResponse;
import com.javanc.user.adapter.in.rest.dto.AuthenticationRequest;
import com.javanc.user.adapter.in.rest.dto.AuthenticationResponse;
import com.javanc.user.adapter.in.rest.dto.UserDTO;
import com.javanc.user.application.command.RefreshTokenCommand;
import com.javanc.user.application.result.AuthenticationResult;
import com.javanc.user.application.usecase.AuthUseCase;
import com.javanc.user.application.usecase.UserUseCase;
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

    private final AuthUseCase authUseCase;
    private final UserUseCase userUseCase;
    private final RestAuthMapper mapper;
    private final TokenResolver tokenResolver;

    @Inject
    public AuthResource(AuthUseCase authUseCase, UserUseCase userUseCase, RestAuthMapper mapper,
            TokenResolver tokenResolver) {
        this.authUseCase = authUseCase;
        this.userUseCase = userUseCase;
        this.mapper = mapper;
        this.tokenResolver = tokenResolver;
    }

    @POST
    @Path("/isValid")
    @Consumes({ MediaType.TEXT_PLAIN, MediaType.APPLICATION_JSON })
    public ApiResponse<AuthenticationResponse> isValid(String token) {
        return new ApiResponse<>(true, "", mapper.toResponse(authUseCase.validateToken(token)));
    }

    @POST
    @Path("/signup")
    public Response signUp(AuthenticationRequest signUpRequest) {
        AuthenticationResult result = authUseCase.signUp(mapper.toSignUpCommand(signUpRequest));
        ApiResponse<AuthenticationResponse> response = new ApiResponse<>(true, "Sign up successfully",
                mapper.toResponse(result));
        if (!result.valid()) {
            return Response.status(Response.Status.CONFLICT).entity(response).build();
        }
        return Response.ok(response).build();
    }

    @POST
    @Path("/signin")
    public Response signIn(AuthenticationRequest signInRequest) {
        AuthenticationResult result = authUseCase.signIn(mapper.toSignInCommand(signInRequest));
        ApiResponse<AuthenticationResponse> response = new ApiResponse<>(true, "Sign in successfully",
                mapper.toResponse(result));
        if (!result.valid()) {
            return Response.status(Response.Status.UNAUTHORIZED).entity(response).build();
        }
        return Response.ok(response).build();
    }

    @POST
    @Path("/refresh")
    public ApiResponse<AuthenticationResponse> refreshToken(AuthenticationRequest refreshTokenRequest) {
        return new ApiResponse<>(true, "Refresh token successfully",
                mapper.toResponse(authUseCase.refreshToken(new RefreshTokenCommand(refreshTokenRequest.getToken()))));
    }

    @POST
    @Path("/update")
    public ApiResponse<UserDTO> update(@HeaderParam("Authorization") String authorizationHeader,
            @QueryParam("token") String queryToken, UserDTO userDTO) {
        String token = tokenResolver.resolve(authorizationHeader, queryToken);
        return new ApiResponse<>(true, "User updated successfully",
                mapper.toDto(userUseCase.update(mapper.toUpdateCommand(token, userDTO))));
    }

    @GET
    @Path("/findbyid")
    public ApiResponse<UserDTO> findById(@QueryParam("id") Integer id) {
        return new ApiResponse<>(true, "User retrieved successfully", mapper.toDto(userUseCase.findById(id)));
    }

    @GET
    @Path("/checkId")
    public ApiResponse<Boolean> checkId(@QueryParam("id") Integer id) {
        return new ApiResponse<>(true, "Check user id successfully", userUseCase.checkUser(id));
    }

    @GET
    @Path("/getCurrentUser")
    public ApiResponse<UserDTO> getCurrentUser(@HeaderParam("Authorization") String authorizationHeader) {
        String token = tokenResolver.requireHeaderToken(authorizationHeader);
        return new ApiResponse<>(true, "Check user id successfully", mapper.toDto(userUseCase.getCurrentUser(token)));
    }

    @GET
    @Path("/getAll")
    public ApiResponse<List<UserDTO>> getAllUsers(@HeaderParam("Authorization") String authorizationHeader,
            @QueryParam("token") String queryToken) {
        String token = tokenResolver.resolve(authorizationHeader, queryToken);
        return new ApiResponse<>(true, "All users retrieved successfully",
                userUseCase.getAll(token).stream().map(mapper::toDto).toList());
    }

    @GET
    @Path("/getlistuserbyid")
    public ApiResponse<List<UserDTO>> getUserByIds(@HeaderParam("Authorization") String authorizationHeader,
            @QueryParam("token") String queryToken, @QueryParam("ids") List<Integer> ids) {
        String token = tokenResolver.resolve(authorizationHeader, queryToken);
        return new ApiResponse<>(true, "User retrieved successfully",
                userUseCase.findUsersByIds(token, ids).stream().map(mapper::toDto).toList());
    }

    @POST
    @Path("/updateactive")
    public ApiResponse<UserDTO> updateActive(@HeaderParam("Authorization") String authorizationHeader,
            @QueryParam("token") String queryToken, UserDTO userDTO) {
        String token = tokenResolver.resolve(authorizationHeader, queryToken);
        return new ApiResponse<>(true, "User updated successfully",
                mapper.toDto(userUseCase.updateActive(token, userDTO.getId())));
    }

    @DELETE
    @Path("/delete")
    public ApiResponse<UserDTO> deleteUser(@HeaderParam("Authorization") String authorizationHeader,
            @QueryParam("token") String queryToken, @QueryParam("id") Integer id) {
        String token = tokenResolver.resolve(authorizationHeader, queryToken);
        return new ApiResponse<>(true, "User deleted successfully", mapper.toDto(userUseCase.deleteUser(token, id)));
    }

    @GET
    @Path("/ourUserDetailsService")
    public Response getUserDetails() {
        return Response.status(Response.Status.NOT_IMPLEMENTED)
                .entity(new ApiResponse<>(false, "Endpoint not implemented: Spring mapping is broken", null))
                .build();
    }
}
