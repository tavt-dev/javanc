package com.javanc.notification.infrastructure.persistence;

import com.javanc.notification.domain.model.Notification;
import com.javanc.notification.domain.repository.NotificationRepository;
import com.javanc.common.pagination.PageRequest;
import com.javanc.common.pagination.PageResponse;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;

@ApplicationScoped
public class NotificationJpaRepository implements NotificationRepository, PanacheRepositoryBase<Notification, Integer> {

    @Override
    public Notification save(Notification notification) {
        return getEntityManager().merge(notification);
    }

    @Override
    public Optional<Notification> findByNotificationId(Integer id) {
        return findByIdOptional(id);
    }

    @Override
    public PageResponse<Notification> findByUserId(Integer userId, Boolean read, PageRequest pageRequest) {
        var query = read == null
                ? find("idUser = ?1", sort(pageRequest), userId)
                : find("idUser = ?1 and read = ?2", sort(pageRequest), userId, read);
        return PageResponse.of(query.page(pageRequest.page(), pageRequest.size()).list(), pageRequest, query.count());
    }

    private Sort sort(PageRequest request) {
        return request.direction() == com.javanc.common.pagination.SortDirection.ASC
                ? Sort.ascending(request.sortField())
                : Sort.descending(request.sortField());
    }
}
