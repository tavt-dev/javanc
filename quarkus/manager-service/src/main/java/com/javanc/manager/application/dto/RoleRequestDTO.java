package com.javanc.manager.application.dto;

import java.time.Instant;

public class RoleRequestDTO {
    public Integer id;
    public Integer requesterUserId;
    public Integer targetUserId;
    public String requesterName;
    public String requesterEmail;
    public String targetName;
    public String targetEmail;
    public String requestedRole;
    public String type;
    public String status;
    public Integer companyId;
    public String companyName;
    public String reason;
    public String adminNote;
    public Integer decidedByUserId;
    public Instant createdAt;
    public Instant updatedAt;
    public Instant decidedAt;
}
