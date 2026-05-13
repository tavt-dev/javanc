package com.javanc.manager.infrastructure.client;

import com.javanc.manager.application.dto.ApiResponse;
import com.javanc.manager.application.dto.AuthenticationRequest;
import com.javanc.manager.application.dto.AuthenticationResponse;
import com.javanc.manager.application.dto.UserDTO;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
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
}
