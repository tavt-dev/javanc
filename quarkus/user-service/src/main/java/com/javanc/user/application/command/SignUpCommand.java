package com.javanc.user.application.command;

public record SignUpCommand(String name, String email, String role, String password, String idEmployee) {
}
