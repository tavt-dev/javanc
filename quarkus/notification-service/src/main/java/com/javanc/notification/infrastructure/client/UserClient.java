package com.javanc.notification.infrastructure.client;

import com.javanc.notification.interfaces.rest.dto.ApiResponse;
import com.javanc.notification.interfaces.rest.dto.UserDTO;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import org.eclipse.microprofile.rest.client.annotation.RegisterClientHeaders;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@RegisterRestClient(configKey = "user-service")
@RegisterClientHeaders(AuthorizationPropagationHeadersFactory.class)
public interface UserClient {

    @GET
    @Path("/users/{id}")
    ApiResponse<UserDTO> findById(@PathParam("id") Integer id);

    @GET
    @Path("/users/me")
    ApiResponse<UserDTO> getCurrentUser();
}
