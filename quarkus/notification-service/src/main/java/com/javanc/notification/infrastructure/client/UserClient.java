package com.javanc.notification.infrastructure.client;

import com.javanc.notification.interfaces.rest.dto.ApiResponse;
import com.javanc.notification.interfaces.rest.dto.UserDTO;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.QueryParam;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@RegisterRestClient(configKey = "user-service")
public interface UserClient {

    @GET
    @Path("/auth/checkId")
    ApiResponse<Boolean> checkId(@QueryParam("id") Integer id);

    @GET
    @Path("/auth/getCurrentUser")
    ApiResponse<UserDTO> getCurrentUser();
}
