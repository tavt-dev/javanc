package com.javanc.profile.client;

import com.javanc.profile.dto.ApiResponse;
import com.javanc.profile.dto.UserDTO;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@Path("/auth")
@RegisterRestClient(configKey = "user-service")
@Produces(MediaType.APPLICATION_JSON)
public interface UserClient {

    @GET
    @Path("/checkId")
    ApiResponse<Boolean> checkId(@QueryParam("id") Integer id);

    @GET
    @Path("/getCurrentUser")
    ApiResponse<UserDTO> getCurrentUser(@HeaderParam("Authorization") String authorizationHeader);
}
