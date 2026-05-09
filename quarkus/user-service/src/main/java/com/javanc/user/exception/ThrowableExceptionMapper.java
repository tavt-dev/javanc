package com.javanc.user.exception;

import com.javanc.user.dto.ApiResponse;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class ThrowableExceptionMapper implements ExceptionMapper<Throwable> {

    @Override
    public Response toResponse(Throwable exception) {
        return Response.status(ErrorCode.UNCATEGORIZED_EXCEPTION.getStatus())
                .entity(new ApiResponse<>(false, ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage(), ""))
                .build();
    }
}
