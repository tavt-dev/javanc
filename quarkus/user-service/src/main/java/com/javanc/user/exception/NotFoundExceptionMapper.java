package com.javanc.user.exception;

import com.javanc.user.dto.ApiResponse;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class NotFoundExceptionMapper implements ExceptionMapper<NotFoundException> {

    @Override
    public Response toResponse(NotFoundException exception) {
        return Response.status(ErrorCode.NOT_FOUND.getStatus())
                .entity(new ApiResponse<>(false, ErrorCode.NOT_FOUND.getMessage(), ""))
                .build();
    }
}
