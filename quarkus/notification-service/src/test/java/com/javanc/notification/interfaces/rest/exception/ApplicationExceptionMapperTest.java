package com.javanc.notification.interfaces.rest.exception;

import com.javanc.notification.application.exception.ApplicationException;
import com.javanc.notification.application.exception.ErrorCode;
import com.javanc.notification.interfaces.rest.dto.ApiResponse;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class ApplicationExceptionMapperTest {

    @Test
    void mapsApplicationExceptionToApiResponse() {
        ApplicationExceptionMapper mapper = new ApplicationExceptionMapper();

        Response response = mapper.toResponse(new ApplicationException(ErrorCode.NOTIFICATION_NOT_FOUND));
        ApiResponse<?> entity = (ApiResponse<?>) response.getEntity();

        assertEquals(404, response.getStatus());
        assertFalse(entity.isSuccess());
        assertEquals("Notification not found", entity.getMessage());
        assertEquals("", entity.getData());
    }
}
