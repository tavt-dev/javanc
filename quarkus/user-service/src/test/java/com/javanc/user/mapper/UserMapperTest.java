package com.javanc.user.mapper;

import com.javanc.user.dto.UserDTO;
import com.javanc.user.entity.Role;
import com.javanc.user.entity.User;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UserMapperTest {

    private final UserMapper userMapper = new UserMapper();

    @Test
    void mapsEntityToDto() {
        User user = new User(1, "Jane", "jane@example.com", "EMP-1", "encoded", true, Role.user);

        UserDTO userDTO = userMapper.toDto(user);

        assertEquals(1, userDTO.getId());
        assertEquals("Jane", userDTO.getName());
        assertEquals("jane@example.com", userDTO.getEmail());
        assertEquals("encoded", userDTO.getPassword());
        assertEquals("EMP-1", userDTO.getIdEmployee());
        assertEquals("user", userDTO.getRole());
        assertTrue(userDTO.isActive());
    }

    @Test
    void mapsDtoToEntity() {
        UserDTO userDTO = new UserDTO(2, "John", "john@example.com", "encoded-2", "EMP-2", "manager", true);

        User user = userMapper.toEntity(userDTO);

        assertEquals(2, user.getId());
        assertEquals("John", user.getName());
        assertEquals("john@example.com", user.getEmail());
        assertEquals("encoded-2", user.getPassword());
        assertEquals("EMP-2", user.getIdEmployee());
        assertEquals(Role.manager, user.getRole());
        assertTrue(user.isActive());
    }

    @Test
    void mapsNullSafely() {
        assertNull(userMapper.toDto(null));
        assertNull(userMapper.toEntity(null));
    }
}
