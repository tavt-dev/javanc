package com.javanc.project.infrastructure.client;

import com.javanc.project.application.dto.ApiResponse;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.annotation.RegisterClientHeaders;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@Path("/notification")
@RegisterRestClient(configKey = "notification-service")
@RegisterClientHeaders(AuthorizationPropagationHeadersFactory.class)
@Produces(MediaType.APPLICATION_JSON)
public interface NotificationClient {

    @GET
    @Path("/getAll")
    ApiResponse<String> ok();
}
