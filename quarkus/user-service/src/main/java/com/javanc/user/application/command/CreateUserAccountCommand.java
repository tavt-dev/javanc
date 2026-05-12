package com.javanc.user.application.command;

public record CreateUserAccountCommand(
        String token,
        String name,
        String email,
        String password,
        String employeeId,
        String role) {
}
