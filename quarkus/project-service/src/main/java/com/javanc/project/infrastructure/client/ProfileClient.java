package com.javanc.project.infrastructure.client;

import com.javanc.project.application.dto.ApiResponse;
import com.javanc.project.application.dto.ProfileDTO;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.annotation.RegisterClientHeaders;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

import java.util.List;

@Path("/profiles")
@RegisterRestClient(configKey = "profile-service")
@RegisterClientHeaders(AuthorizationPropagationHeadersFactory.class)
@Produces(MediaType.APPLICATION_JSON)
public interface ProfileClient {

    @GET
    ApiResponse<List<ProfileDTO>> getAll();
}
