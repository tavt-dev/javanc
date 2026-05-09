package com.javanc.project.interfaces.rest.exception;

import com.javanc.project.application.dto.ApiResponse;
import com.javanc.project.application.exception.ApplicationException;
import com.javanc.project.application.exception.ErrorCode;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class ApplicationExceptionMapperTest {

    @Test
    void mapsApplicationExceptionToApiResponse() {
        ApplicationExceptionMapper mapper = new ApplicationExceptionMapper();

        Response response = mapper.toResponse(new ApplicationException(ErrorCode.PROJECT_NOT_FOUND));

        assertEquals(404, response.getStatus());
        @SuppressWarnings("unchecked")
        ApiResponse<String> entity = (ApiResponse<String>) response.getEntity();
        assertFalse(entity.isSuccess());
        assertEquals("Project not found", entity.getMessage());
        assertEquals("", entity.getData());
    }

    @Test
    void mapsBadRequestToApiResponse() {
        BadRequestExceptionMapper mapper = new BadRequestExceptionMapper();

        Response response = mapper.toResponse(new com.javanc.project.application.exception.BadRequestException("Bad request"));

        assertEquals(400, response.getStatus());
        @SuppressWarnings("unchecked")
        ApiResponse<String> entity = (ApiResponse<String>) response.getEntity();
        assertFalse(entity.isSuccess());
        assertEquals("Bad request", entity.getMessage());
        assertEquals("", entity.getData());
    }
}
