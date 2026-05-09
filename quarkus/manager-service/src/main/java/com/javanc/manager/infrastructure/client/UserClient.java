package com.javanc.manager.infrastructure.client;

import com.javanc.manager.application.dto.ApiResponse;
import com.javanc.manager.application.dto.AuthenticationRequest;
import com.javanc.manager.application.dto.AuthenticationResponse;
import com.javanc.manager.application.dto.UserDTO;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@Path("/auth")
@RegisterRestClient(configKey = "user-service")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public interface UserClient {
    @POST
    @Path("/signup")
    ApiResponse<AuthenticationResponse> signUp(AuthenticationRequest request);

    @GET
    @Path("/getCurrentUser")
    ApiResponse<UserDTO> getCurrentUser();

    @GET
    @Path("/findbyid")
    ApiResponse<UserDTO> findById(@QueryParam("id") Integer id);
}
