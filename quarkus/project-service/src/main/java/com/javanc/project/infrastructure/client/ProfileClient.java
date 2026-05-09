package com.javanc.project.infrastructure.client;

import com.javanc.project.application.dto.ApiResponse;
import com.javanc.project.application.dto.ProfileDTO;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

import java.util.List;

@Path("/profile")
@RegisterRestClient(configKey = "profile-service")
@Produces(MediaType.APPLICATION_JSON)
public interface ProfileClient {

    @GET
    @Path("/user/getAll")
    ApiResponse<List<ProfileDTO>> getAll();
}
