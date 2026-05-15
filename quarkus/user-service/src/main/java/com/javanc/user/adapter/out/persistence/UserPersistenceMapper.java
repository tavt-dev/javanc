package com.javanc.user.adapter.out.persistence;

import com.javanc.user.domain.model.AccountStatus;
import com.javanc.user.domain.model.EmailAddress;
import com.javanc.user.domain.model.EmployeeId;
import com.javanc.user.domain.model.PasswordHash;
import com.javanc.user.domain.model.User;
import com.javanc.user.domain.model.UserId;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class UserPersistenceMapper {

    public User toDomain(JpaUserEntity entity) {
        if (entity == null) {
            return null;
        }
        return new User(
                new UserId(entity.getId()),
                entity.getName(),
                new EmailAddress(entity.getEmail()),
                EmployeeId.optional(entity.getIdEmployee()),
                entity.getPassword() == null ? null : new PasswordHash(entity.getPassword()),
                entity.getStatus() == null ? AccountStatus.fromActive(entity.isActive()) : entity.getStatus(),
                entity.getRole(),
                entity.getAvatarUrl(),
                entity.isEmailVerified(),
                entity.getLastLoginAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt());
    }

    public JpaUserEntity toEntity(User user) {
        if (user == null) {
            return null;
        }
        return new JpaUserEntity(
                user.id() == null ? null : user.id().value(),
                user.name(),
                user.email().value(),
                user.employeeId() == null ? null : user.employeeId().value(),
                user.passwordHash() == null ? null : user.passwordHash().value(),
                user.status(),
                user.role(),
                user.avatarUrl(),
                user.emailVerified(),
                user.lastLoginAt(),
                user.createdAt(),
                user.updatedAt());
    }

    public void copyToEntity(User user, JpaUserEntity entity) {
        entity.setName(user.name());
        entity.setEmail(user.email().value());
        entity.setIdEmployee(user.employeeId() == null ? null : user.employeeId().value());
        entity.setPassword(user.passwordHash() == null ? null : user.passwordHash().value());
        entity.setStatus(user.status());
        entity.setRole(user.role());
        entity.setAvatarUrl(user.avatarUrl());
        entity.setEmailVerified(user.emailVerified());
        entity.setLastLoginAt(user.lastLoginAt());
        entity.setUpdatedAt(java.time.Instant.now());
    }
}
