package com.javanc.user.application.command;

public record UpdateUserProfileCommand(
        String token,
        Integer userId,
        String name,
        String email,
        String password,
        String employeeId) {
}
