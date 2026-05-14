package com.javanc.user.shared.exception;

import com.javanc.user.adapter.in.rest.dto.ApiResponse;
import jakarta.ws.rs.ProcessingException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class DownstreamUnavailableExceptionMapper implements ExceptionMapper<ProcessingException> {

    @Override
    public Response toResponse(ProcessingException exception) {
        return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                .entity(new ApiResponse<>(false, "Downstream service unavailable", null))
                .build();
    }
}
