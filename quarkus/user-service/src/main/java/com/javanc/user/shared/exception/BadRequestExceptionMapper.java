package com.javanc.user.shared.exception;

import com.javanc.user.adapter.in.rest.dto.ApiResponse;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class BadRequestExceptionMapper implements ExceptionMapper<BadRequestException> {

    @Override
    public Response toResponse(BadRequestException exception) {
        return Response.status(Response.Status.BAD_REQUEST)
                .entity(new ApiResponse<>(false, ErrorCode.BAD_REQUEST.getMessage(), ""))
                .build();
    }
}
