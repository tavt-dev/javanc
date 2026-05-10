package com.javanc.email.infrastructure.client;

import com.javanc.email.application.dto.ApiResponse;
import com.javanc.email.application.dto.UserDTO;
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
}
