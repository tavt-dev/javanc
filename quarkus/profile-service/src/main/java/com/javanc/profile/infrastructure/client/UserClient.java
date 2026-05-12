package com.javanc.profile.infrastructure.client;

import com.javanc.profile.interfaces.rest.dto.ApiResponse;
import com.javanc.profile.interfaces.rest.dto.UserDTO;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.annotation.RegisterClientHeaders;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@Path("/users")
@RegisterRestClient(configKey = "user-service")
@RegisterClientHeaders(AuthorizationPropagationHeadersFactory.class)
@Produces(MediaType.APPLICATION_JSON)
public interface UserClient {

    @GET
    @Path("/{id}")
    ApiResponse<UserDTO> findById(@PathParam("id") Integer id);

    @GET
    @Path("/me")
    ApiResponse<UserDTO> getCurrentUser();
}
