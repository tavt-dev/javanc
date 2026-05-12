package com.javanc.user.shared.exception;

import com.javanc.user.adapter.in.rest.dto.ApiResponse;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class ApplicationExceptionMapper implements ExceptionMapper<ApplicationException> {

    @Override
    public Response toResponse(ApplicationException exception) {
        ErrorCode errorCode = exception.getErrorCode();
        return Response.status(errorCode.getStatus())
                .entity(new ApiResponse<>(false, exception.getMessage(), null))
                .build();
    }
}
