package com.javanc.project.infrastructure.client;

import com.javanc.project.application.dto.ApiResponse;
import com.javanc.project.application.dto.ProfileDTO;
import com.javanc.common.pagination.PageResponse;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
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
    ApiResponse<PageResponse<ProfileDTO>> getAll(@jakarta.ws.rs.QueryParam("page") Integer page,
            @jakarta.ws.rs.QueryParam("size") Integer size, @jakarta.ws.rs.QueryParam("sort") String sort);

    @GET
    @Path("/me")
    ApiResponse<ProfileDTO> me();
}
