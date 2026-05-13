package com.javanc.project.interfaces.rest.exception;

import com.javanc.project.application.dto.ApiResponse;
import com.javanc.project.application.exception.ApplicationException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class ApplicationExceptionMapper implements ExceptionMapper<ApplicationException> {

    @Override
    public Response toResponse(ApplicationException exception) {
        ApiResponse<String> response = new ApiResponse<>(false, exception.getMessage(), "");
        return Response.status(exception.getErrorCode().getStatus()).entity(response).build();
    }
}
