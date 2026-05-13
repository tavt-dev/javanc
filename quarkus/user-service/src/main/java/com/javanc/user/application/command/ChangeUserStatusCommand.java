package com.javanc.user.application.command;

public record ChangeUserStatusCommand(String token, Integer userId, Boolean active, String status) {
}
