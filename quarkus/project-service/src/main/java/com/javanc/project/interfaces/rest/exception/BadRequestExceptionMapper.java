package com.javanc.project.interfaces.rest.exception;

import com.javanc.project.application.dto.ApiResponse;
import com.javanc.project.application.exception.BadRequestException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class BadRequestExceptionMapper implements ExceptionMapper<BadRequestException> {

    @Override
    public Response toResponse(BadRequestException exception) {
        ApiResponse<String> response = new ApiResponse<>(false, exception.getMessage(), "");
        return Response.status(Response.Status.BAD_REQUEST).entity(response).build();
    }
}
