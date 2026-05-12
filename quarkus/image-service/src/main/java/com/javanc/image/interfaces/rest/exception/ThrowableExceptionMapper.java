package com.javanc.image.interfaces.rest.exception;

import com.javanc.image.application.dto.ApiResponse;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class ThrowableExceptionMapper implements ExceptionMapper<Throwable> {

    @Override
    public Response toResponse(Throwable exception) {
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ApiResponse<>(false, exception.getMessage(), null))
                .build();
    }
}
