package com.javanc.notification.domain.repository;

import com.javanc.notification.domain.model.Notification;
import com.javanc.common.pagination.PageRequest;
import com.javanc.common.pagination.PageResponse;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository {

    Notification save(Notification notification);

    Optional<Notification> findByNotificationId(Integer id);

    PageResponse<Notification> findByUserId(Integer userId, Boolean read, PageRequest pageRequest);
}
