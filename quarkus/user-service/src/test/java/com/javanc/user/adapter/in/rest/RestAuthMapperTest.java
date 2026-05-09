package com.javanc.user.adapter.in.rest;

import com.javanc.user.adapter.in.rest.dto.UserDTO;
import com.javanc.user.application.result.UserResult;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RestAuthMapperTest {

    private final RestAuthMapper mapper = new RestAuthMapper();

    @Test
    void mapsApplicationUserResultToPasswordlessRestDto() {
        UserResult result = new UserResult(1, "Jane", "jane@example.com", "EMP-1", "user", true);

        UserDTO userDTO = mapper.toDto(result);

        assertEquals(1, userDTO.getId());
        assertEquals("Jane", userDTO.getName());
        assertEquals("jane@example.com", userDTO.getEmail());
        assertNull(userDTO.getPassword());
        assertEquals("EMP-1", userDTO.getIdEmployee());
        assertEquals("user", userDTO.getRole());
        assertTrue(userDTO.isActive());
    }

    @Test
    void mapsNullSafely() {
        assertNull(mapper.toDto(null));
    }
}
