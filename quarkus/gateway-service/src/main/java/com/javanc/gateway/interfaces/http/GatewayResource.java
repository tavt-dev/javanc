package com.javanc.gateway.interfaces.http;

import com.javanc.gateway.application.model.ForwardRequest;
import com.javanc.gateway.application.model.ForwardResponse;
import com.javanc.gateway.application.port.RequestForwardingPort;
import com.javanc.gateway.application.service.GatewayAuthService;
import com.javanc.gateway.application.service.RouteMatcher;
import com.javanc.gateway.domain.model.GatewayRoute;
import com.javanc.gateway.infrastructure.client.dto.AuthenticationResponse;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HEAD;
import jakarta.ws.rs.OPTIONS;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import org.jboss.logging.Logger;

import java.net.URI;
import java.util.List;
import java.util.Map;

@Path("/")
@Produces(MediaType.WILDCARD)
public class GatewayResource {

    private static final Logger LOG = Logger.getLogger(GatewayResource.class);

    private final RouteMatcher routeMatcher;
    private final GatewayAuthService authService;
    private final RequestForwardingPort forwardingPort;

    @Inject
    public GatewayResource(RouteMatcher routeMatcher, GatewayAuthService authService,
            RequestForwardingPort forwardingPort) {
        this.routeMatcher = routeMatcher;
        this.authService = authService;
        this.forwardingPort = forwardingPort;
    }

    @GET
    @Path("{path:.*}")
    public Uni<Response> get(@Context UriInfo uriInfo, @Context HttpHeaders headers) {
        return handle("GET", uriInfo, headers, null);
    }

    @HEAD
    @Path("{path:.*}")
    public Uni<Response> head(@Context UriInfo uriInfo, @Context HttpHeaders headers) {
        return handle("HEAD", uriInfo, headers, null);
    }

    @OPTIONS
    @Path("{path:.*}")
    public Response options() {
        return Response.noContent().build();
    }

    @POST
    @Path("{path:.*}")
    @Consumes(MediaType.WILDCARD)
    public Uni<Response> post(byte[] body, @Context UriInfo uriInfo, @Context HttpHeaders headers) {
        return handle("POST", uriInfo, headers, body);
    }

    @PUT
    @Path("{path:.*}")
    @Consumes(MediaType.WILDCARD)
    public Uni<Response> put(byte[] body, @Context UriInfo uriInfo, @Context HttpHeaders headers) {
        return handle("PUT", uriInfo, headers, body);
    }

    @PATCH
    @Path("{path:.*}")
    @Consumes(MediaType.WILDCARD)
    public Uni<Response> patch(byte[] body, @Context UriInfo uriInfo, @Context HttpHeaders headers) {
        return handle("PATCH", uriInfo, headers, body);
    }

    @DELETE
    @Path("{path:.*}")
    @Consumes(MediaType.WILDCARD)
    public Uni<Response> delete(byte[] body, @Context UriInfo uriInfo, @Context HttpHeaders headers) {
        return handle("DELETE", uriInfo, headers, body);
    }

    private Uni<Response> handle(String method, UriInfo uriInfo, HttpHeaders headers, byte[] body) {
        URI requestUri = uriInfo.getRequestUri();
        String rawPath = requestUri.getRawPath();
        LOG.debugf("Gateway received request method=%s path=%s query=%s", method, rawPath, requestUri.getRawQuery());
        return routeMatcher.match(rawPath)
                .map(route -> authorizeAndForward(method, rawPath, requestUri.getRawQuery(), headers, body, route))
                .orElseGet(() -> {
                    LOG.warnf("No gateway route matched path=%s", rawPath);
                    return Uni.createFrom().item(Response.status(Response.Status.NOT_FOUND).build());
                });
    }

    private Uni<Response> authorizeAndForward(String method, String rawPath, String rawQuery, HttpHeaders headers,
            byte[] body, GatewayRoute route) {
        if (!route.protectedRoute()) {
            LOG.debugf("Route matched route=%s policy=PUBLIC target=%s", route.id(), route.targetBaseUrl());
            return forward(method, rawPath, rawQuery, headers, body, route);
        }

        LOG.debugf("Route matched route=%s policy=PROTECTED target=%s", route.id(), route.targetBaseUrl());
        return authService.isAuthorized(headers.getHeaderString(HttpHeaders.AUTHORIZATION))
                .flatMap(authorized -> authorized
                        ? forward(method, rawPath, rawQuery, headers, body, route)
                        : Uni.createFrom().item(unauthorized()));
    }

    private Uni<Response> forward(String method, String rawPath, String rawQuery, HttpHeaders headers, byte[] body,
            GatewayRoute route) {
        ForwardRequest request = new ForwardRequest(route, method, rawPath, rawQuery, headers.getRequestHeaders(), body);
        LOG.debugf("Forwarding request route=%s method=%s target=%s", route.id(), method, request.targetUrl());
        return forwardingPort.forward(request)
                .map(this::toResponse);
    }

    private Response toResponse(ForwardResponse forwardResponse) {
        LOG.debugf("Gateway returning downstream response status=%d bodyBytes=%d", forwardResponse.status(),
                forwardResponse.body() == null ? 0 : forwardResponse.body().length);
        Response.ResponseBuilder builder = Response.status(forwardResponse.status());
        forwardResponse.headers().forEach((name, values) -> addHeaders(builder, name, values));
        if (forwardResponse.body() != null && forwardResponse.body().length > 0) {
            builder.entity(forwardResponse.body());
        }
        return builder.build();
    }

    private void addHeaders(Response.ResponseBuilder builder, String name, List<String> values) {
        for (String value : values) {
            builder.header(name, value);
        }
    }

    private Response unauthorized() {
        LOG.warn("Gateway rejected request as unauthenticated");
        return Response.status(Response.Status.UNAUTHORIZED)
                .type(MediaType.APPLICATION_JSON)
                .entity(AuthenticationResponse.unauthenticated())
                .build();
    }
}
