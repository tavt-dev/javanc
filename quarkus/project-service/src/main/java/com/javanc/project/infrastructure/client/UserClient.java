package com.javanc.project.infrastructure.client;

import com.javanc.project.application.dto.ApiResponse;
import com.javanc.project.application.dto.UserDTO;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@Path("/auth")
@RegisterRestClient(configKey = "user-service")
@Produces(MediaType.APPLICATION_JSON)
public interface UserClient {

    @GET
    @Path("/getCurrentUser")
    ApiResponse<UserDTO> getCurrentUser();
}
