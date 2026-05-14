package com.javanc.profile.infrastructure.client;

import com.javanc.profile.interfaces.rest.dto.ApiResponse;
import com.javanc.profile.interfaces.rest.dto.TokenIntrospection;
import com.javanc.profile.interfaces.rest.dto.TokenIntrospectionRequest;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.annotation.RegisterClientHeaders;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

@Path("/auth")
@RegisterRestClient(configKey = "user-service")
@RegisterClientHeaders(AuthorizationPropagationHeadersFactory.class)
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public interface TokenIntrospectionClient {

    @POST
    @Path("/introspect")
    ApiResponse<TokenIntrospection> introspect(TokenIntrospectionRequest request);
}
