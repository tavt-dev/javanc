package com.javanc.notification.domain.repository;

import com.javanc.notification.domain.model.Notification;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository {

    Notification save(Notification notification);

    Optional<Notification> findByNotificationId(Integer id);

    List<Notification> findByUserId(Integer userId);
}
