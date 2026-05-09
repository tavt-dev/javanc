package com.javanc.profile.interfaces.rest.exception;

import com.javanc.profile.application.exception.BadRequestException;
import com.javanc.profile.interfaces.rest.dto.ApiResponse;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class BadRequestExceptionMapper implements ExceptionMapper<BadRequestException> {

    @Override
    public Response toResponse(BadRequestException exception) {
        return Response.status(Response.Status.BAD_REQUEST)
                .entity(new ApiResponse<>(false, exception.getMessage(), ""))
                .build();
    }
}
