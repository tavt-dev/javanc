package com.javanc.email.interfaces.rest.exception;

import com.javanc.email.application.dto.ApiResponse;
import com.javanc.email.application.exception.ErrorCode;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class ThrowableExceptionMapper implements ExceptionMapper<Throwable> {

    @Override
    public Response toResponse(Throwable exception) {
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ApiResponse<>(false, ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage(), ""))
                .build();
    }
}
