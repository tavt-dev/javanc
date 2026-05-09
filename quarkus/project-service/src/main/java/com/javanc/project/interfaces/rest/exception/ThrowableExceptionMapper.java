package com.javanc.project.interfaces.rest.exception;

import com.javanc.project.application.dto.ApiResponse;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

@Provider
public class ThrowableExceptionMapper implements ExceptionMapper<Throwable> {

    private static final Logger LOG = Logger.getLogger(ThrowableExceptionMapper.class);

    @Override
    public Response toResponse(Throwable exception) {
        LOG.error("Unhandled project-service error", exception);
        ApiResponse<String> response = new ApiResponse<>(false, "Unclassified error", "");
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(response).build();
    }
}
