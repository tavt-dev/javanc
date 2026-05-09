package com.javanc.notification.interfaces.rest.exception;

import com.javanc.notification.interfaces.rest.dto.ApiResponse;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class ThrowableExceptionMapper implements ExceptionMapper<Throwable> {

    @Override
    public Response toResponse(Throwable exception) {
        ApiResponse<String> response = new ApiResponse<>(false, exception.getMessage(), "");
        return Response.serverError().entity(response).build();
    }
}
