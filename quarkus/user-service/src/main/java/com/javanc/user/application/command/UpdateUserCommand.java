package com.javanc.user.application.command;

public record UpdateUserCommand(String token, Integer id, String name, String email, String password, String idEmployee,
        String role, boolean active) {
}
