package com.javanc.manager.infrastructure.client;

import com.javanc.manager.application.dto.ApiResponse;
import com.javanc.manager.application.dto.ProfileDTO;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@Path("/profile")
@RegisterRestClient(configKey = "profile-service")
@Produces(MediaType.APPLICATION_JSON)
public interface ProfileClient {
    @GET
    @Path("/user/checkIdProfile")
    ApiResponse<String> checkIdProfile(@QueryParam("id") Integer id);

    @GET
    @Path("/user/findById")
    ApiResponse<ProfileDTO> getProfileById(@QueryParam("id") Integer id);
}
