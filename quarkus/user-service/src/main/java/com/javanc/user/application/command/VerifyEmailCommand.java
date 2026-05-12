package com.javanc.user.application.command;

public record VerifyEmailCommand(String email, String otp) {
}
