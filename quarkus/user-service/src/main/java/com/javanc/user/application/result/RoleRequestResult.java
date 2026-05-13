package com.javanc.user.application.result;

import java.time.Instant;

public record RoleRequestResult(
        Integer id,
        Integer requesterUserId,
        Integer targetUserId,
        String requesterName,
        String requesterEmail,
        String targetName,
        String targetEmail,
        String requestedRole,
        String type,
        String status,
        Integer companyId,
        String companyName,
        String reason,
        String adminNote,
        Integer decidedByUserId,
        Instant createdAt,
        Instant updatedAt,
        Instant decidedAt) {
}
