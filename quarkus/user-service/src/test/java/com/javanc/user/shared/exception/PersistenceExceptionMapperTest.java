package com.javanc.user.shared.exception;

import jakarta.persistence.PersistenceException;
import jakarta.ws.rs.core.Response;
import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PersistenceExceptionMapperTest {

    private final PersistenceExceptionMapper mapper = new PersistenceExceptionMapper();

    @Test
    void mapsGoogleIdentityConstraintToConflict() {
        Response response = mapper.toResponse(persistenceException("uk_user_auth_identity_provider_subject"));

        assertEquals(409, response.getStatus());
    }

    @Test
    void mapsUnknownPersistenceErrorToDatabaseFailure() {
        Response response = mapper.toResponse(new PersistenceException("boom"));

        assertEquals(500, response.getStatus());
    }

    private PersistenceException persistenceException(String constraintName) {
        ConstraintViolationException violation = new ConstraintViolationException("duplicate", null, "insert",
                constraintName);
        return new PersistenceException(violation);
    }
}
