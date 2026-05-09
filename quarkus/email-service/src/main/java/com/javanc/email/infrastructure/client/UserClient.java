package com.javanc.email.infrastructure.client;

import com.javanc.email.application.dto.ApiResponse;
import com.javanc.email.application.dto.UserDTO;
import jakarta.ws.rs.GET;
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
    @Path("/findbyid")
    ApiResponse<UserDTO> findById(@QueryParam("id") Integer id);
}
