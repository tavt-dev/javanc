package com.javanc.user.adapter.out.persistence;

import com.javanc.user.domain.model.Role;
import com.javanc.user.domain.model.RoleRequestStatus;
import com.javanc.user.domain.model.RoleRequestType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;

@Entity
@Table(name = "role_upgrade_request")
public class JpaRoleUpgradeRequestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Integer id;

    @Column(name = "requester_user_id", nullable = false)
    public Integer requesterUserId;

    @Column(name = "target_user_id", nullable = false)
    public Integer targetUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "requested_role", nullable = false)
    public Role requestedRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    public RoleRequestType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    public RoleRequestStatus status;

    @Column(name = "company_id")
    public Integer companyId;

    @Column(name = "company_name")
    public String companyName;

    @Column(name = "reason", length = 1000)
    public String reason;

    @Column(name = "admin_note", length = 1000)
    public String adminNote;

    @Column(name = "decided_by_user_id")
    public Integer decidedByUserId;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    public Instant updatedAt;

    @Column(name = "decided_at")
    public Instant decidedAt;

    @Version
    @Column(name = "version")
    public Long version;
}
