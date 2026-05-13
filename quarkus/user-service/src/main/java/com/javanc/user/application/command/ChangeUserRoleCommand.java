package com.javanc.user.application.command;

public record ChangeUserRoleCommand(String token, Integer userId, String role) {
}
