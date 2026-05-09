package com.javanc.user.mapper;

import com.javanc.user.dto.UserDTO;
import com.javanc.user.entity.Role;
import com.javanc.user.entity.User;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class UserMapper {

    public UserDTO toDto(User user) {
        if (user == null) {
            return null;
        }
        return new UserDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPassword(),
                user.getIdEmployee(),
                user.getRole() == null ? null : user.getRole().name(),
                user.isActive());
    }

    public User toEntity(UserDTO userDTO) {
        if (userDTO == null) {
            return null;
        }
        return new User(
                userDTO.getId(),
                userDTO.getName(),
                userDTO.getEmail(),
                userDTO.getIdEmployee(),
                userDTO.getPassword(),
                userDTO.isActive(),
                userDTO.getRole() == null ? null : Role.valueOf(userDTO.getRole()));
    }
}
