package com.javanc.user.shared.exception;

import com.javanc.user.adapter.in.rest.dto.ApiResponse;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class NotFoundExceptionMapper implements ExceptionMapper<NotFoundException> {

    @Override
    public Response toResponse(NotFoundException exception) {
        return Response.status(Response.Status.NOT_FOUND)
                .entity(new ApiResponse<>(false, ErrorCode.NOT_FOUND.getMessage(), null))
                .build();
    }
}
