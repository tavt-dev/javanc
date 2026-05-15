package com.javanc.user.application.result;

public record UserResult(Integer id, String name, String email, String idEmployee, String role, boolean active,
        String status, String avatarUrl, String provider) {
}
