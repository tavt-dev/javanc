package com.javanc.manager.interfaces.rest.exception;

import com.javanc.manager.application.dto.ApiResponse;
import com.javanc.manager.application.exception.ApplicationException;
import com.javanc.manager.application.exception.ErrorCode;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class ApplicationExceptionMapper implements ExceptionMapper<ApplicationException> {

    @Override
    public Response toResponse(ApplicationException exception) {
        ErrorCode errorCode = exception.getErrorCode();
        return Response.status(errorCode.getStatus())
                .entity(new ApiResponse<>(false, exception.getMessage(), ""))
                .build();
    }
}
