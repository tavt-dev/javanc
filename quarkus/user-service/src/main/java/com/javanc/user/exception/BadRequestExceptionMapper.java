package com.javanc.user.exception;

import com.javanc.user.dto.ApiResponse;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class BadRequestExceptionMapper implements ExceptionMapper<BadRequestException> {

    @Override
    public Response toResponse(BadRequestException exception) {
        ErrorCode errorCode = exception.getErrorCode();
        return Response.status(errorCode.getStatus())
                .entity(new ApiResponse<>(false, errorCode.getMessage(), ""))
                .build();
    }
}
