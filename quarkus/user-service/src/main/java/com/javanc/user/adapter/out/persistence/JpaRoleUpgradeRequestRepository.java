package com.javanc.user.adapter.out.persistence;

import com.javanc.user.domain.model.RoleRequestStatus;
import com.javanc.user.domain.model.RoleRequestType;
import com.javanc.common.pagination.PageRequest;
import com.javanc.common.pagination.PageResponse;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import io.quarkus.panache.common.Sort;
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

    public PageResponse<JpaRoleUpgradeRequestEntity> findForUser(Integer userId, PageRequest pageRequest) {
        var query = find("requesterUserId = ?1 or targetUserId = ?1", sort(pageRequest), userId);
        return PageResponse.of(query.page(pageRequest.page(), pageRequest.size()).list(), pageRequest, query.count());
    }

    public PageResponse<JpaRoleUpgradeRequestEntity> findForAdmin(RoleRequestStatus status, RoleRequestType type,
            PageRequest pageRequest) {
        var sort = sort(pageRequest);
        if (status != null && type != null) {
            var query = find("status = ?1 and type = ?2", sort, status, type);
            return PageResponse.of(query.page(pageRequest.page(), pageRequest.size()).list(), pageRequest, query.count());
        }
        if (status != null) {
            var query = find("status = ?1", sort, status);
            return PageResponse.of(query.page(pageRequest.page(), pageRequest.size()).list(), pageRequest, query.count());
        }
        if (type != null) {
            var query = find("type = ?1", sort, type);
            return PageResponse.of(query.page(pageRequest.page(), pageRequest.size()).list(), pageRequest, query.count());
        }
        var query = findAll(sort);
        return PageResponse.of(query.page(pageRequest.page(), pageRequest.size()).list(), pageRequest, query.count());
    }

    public PageResponse<JpaRoleUpgradeRequestEntity> findHrPromotionsForUser(Integer targetUserId,
            PageRequest pageRequest) {
        var query = find("targetUserId = ?1 and type = ?2", sort(pageRequest), targetUserId,
                RoleRequestType.HR_PROMOTION);
        return PageResponse.of(query.page(pageRequest.page(), pageRequest.size()).list(), pageRequest, query.count());
    }

    private Sort sort(PageRequest request) {
        return request.direction() == com.javanc.common.pagination.SortDirection.ASC
                ? Sort.ascending(request.sortField())
                : Sort.descending(request.sortField());
    }
}
