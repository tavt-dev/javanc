package com.javanc.email.infrastructure.client;

import com.javanc.email.application.dto.ApiResponse;
import com.javanc.email.application.dto.UserDTO;
import com.javanc.email.application.exception.ApplicationException;
import com.javanc.email.application.exception.ErrorCode;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class UserServiceAdapterTest {

    @Test
    void findEmailByUserIdReturnsEmailFromWrappedUserResponse() {
        UserServiceAdapter adapter = new UserServiceAdapter(id -> new ApiResponse<>(true, "ok",
                new UserDTO(id, "User", "user@example.test", "secret", "user")));

        assertEquals("user@example.test", adapter.findEmailByUserId(7));
    }

    @Test
    void findEmailByUserIdRejectsMissingUserData() {
        UserServiceAdapter adapter = new UserServiceAdapter(id -> new ApiResponse<>(false, "missing", null));

        ApplicationException exception = assertThrows(ApplicationException.class,
                () -> adapter.findEmailByUserId(7));

        assertEquals(ErrorCode.USER_NOT_FOUND, exception.getErrorCode());
    }

    @Test
    void findEmailByUserIdRejectsMissingEmail() {
        UserServiceAdapter adapter = new UserServiceAdapter(id -> new ApiResponse<>(true, "ok",
                new UserDTO(id, "User", "", "secret", "user")));

        ApplicationException exception = assertThrows(ApplicationException.class,
                () -> adapter.findEmailByUserId(7));

        assertEquals(ErrorCode.USER_EMAIL_NOT_FOUND, exception.getErrorCode());
    }
}
