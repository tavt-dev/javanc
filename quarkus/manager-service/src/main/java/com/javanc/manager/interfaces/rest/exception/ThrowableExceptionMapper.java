package com.javanc.manager.interfaces.rest.exception;

import com.javanc.manager.application.dto.ApiResponse;
import com.javanc.manager.application.exception.ErrorCode;
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
