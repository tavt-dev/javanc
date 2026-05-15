package com.javanc.user.shared.exception;

import com.javanc.user.adapter.in.rest.dto.ApiResponse;
import jakarta.persistence.PersistenceException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.hibernate.exception.ConstraintViolationException;

@Provider
public class PersistenceExceptionMapper implements ExceptionMapper<PersistenceException> {

    @Override
    public Response toResponse(PersistenceException exception) {
        ErrorCode errorCode = mapErrorCode(exception);
        return Response.status(errorCode.getStatus())
                .entity(new ApiResponse<>(false, errorCode.getMessage(), null))
                .build();
    }

    private ErrorCode mapErrorCode(Throwable exception) {
        Throwable current = exception;
        while (current != null) {
            if (current instanceof ConstraintViolationException violation) {
                String constraint = violation.getConstraintName();
                if ("uk_user_auth_identity_provider_subject".equalsIgnoreCase(constraint)
                        || "uk_user_auth_identity_user_provider".equalsIgnoreCase(constraint)) {
                    return ErrorCode.GOOGLE_IDENTITY_CONFLICT;
                }
                if ("uk_user_email".equalsIgnoreCase(constraint)) {
                    return ErrorCode.USER_ALREADY_EXISTS;
                }
                return ErrorCode.DUPLICATE_KEY;
            }
            current = current.getCause();
        }
        return ErrorCode.DATABASE_ACCESS_ERROR;
    }
}
