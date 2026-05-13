package com.javanc.user.adapter.out.persistence;

import com.javanc.user.domain.model.RoleRequestStatus;
import com.javanc.user.domain.model.RoleRequestType;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class JpaRoleUpgradeRequestRepository implements PanacheRepositoryBase<JpaRoleUpgradeRequestEntity, Integer> {

    public boolean existsPending(Integer targetUserId, RoleRequestType type) {
        return count("targetUserId = ?1 and type = ?2 and status in ?3", targetUserId, type,
                List.of(RoleRequestStatus.PENDING_SYSADMIN, RoleRequestStatus.PENDING_USER_CONFIRMATION)) > 0;
    }

    public Optional<JpaRoleUpgradeRequestEntity> findRequest(Integer id) {
        return findByIdOptional(id);
    }

    public List<JpaRoleUpgradeRequestEntity> findForUser(Integer userId) {
        return list("requesterUserId = ?1 or targetUserId = ?1 order by createdAt desc", userId);
    }

    public List<JpaRoleUpgradeRequestEntity> findForAdmin(RoleRequestStatus status, RoleRequestType type) {
        if (status != null && type != null) {
            return list("status = ?1 and type = ?2 order by createdAt desc", status, type);
        }
        if (status != null) {
            return list("status = ?1 order by createdAt desc", status);
        }
        if (type != null) {
            return list("type = ?1 order by createdAt desc", type);
        }
        return list("order by createdAt desc");
    }

    public List<JpaRoleUpgradeRequestEntity> findHrPromotionsForUser(Integer targetUserId) {
        return list("targetUserId = ?1 and type = ?2 order by createdAt desc", targetUserId,
                RoleRequestType.HR_PROMOTION);
    }
}
