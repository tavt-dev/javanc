package com.javanc.manager.infrastructure.client;

import com.javanc.manager.application.dto.ApiResponse;
import com.javanc.manager.application.dto.ProfileDTO;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.annotation.RegisterClientHeaders;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@Path("/profiles")
@RegisterRestClient(configKey = "profile-service")
@RegisterClientHeaders(AuthorizationPropagationHeadersFactory.class)
@Produces(MediaType.APPLICATION_JSON)
public interface ProfileClient {

    @GET
    @Path("/{id}")
    ApiResponse<ProfileDTO> getProfileById(@PathParam("id") Integer id);

    @GET
    @Path("/me")
    ApiResponse<ProfileDTO> getMyProfile();
}
