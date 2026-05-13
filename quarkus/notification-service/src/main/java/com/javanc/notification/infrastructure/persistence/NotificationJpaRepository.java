package com.javanc.notification.infrastructure.persistence;

import com.javanc.notification.domain.model.Notification;
import com.javanc.notification.domain.repository.NotificationRepository;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
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
    public List<Notification> findByUserId(Integer userId) {
        return find("idUser", userId).list();
    }
}
