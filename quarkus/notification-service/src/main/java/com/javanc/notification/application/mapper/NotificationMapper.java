package com.javanc.notification.application.mapper;

import com.javanc.notification.domain.model.Notification;
import com.javanc.notification.interfaces.rest.dto.NotificationDTO;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class NotificationMapper {

    public Notification toEntity(NotificationDTO dto) {
        if (dto == null) {
            return null;
        }
        Notification notification = new Notification();
        notification.setId(dto.getId());
        notification.setMessage(dto.getMessage());
        notification.setCreateAt(dto.getCreateAt());
        notification.setUrl(dto.getUrl());
        notification.setRead(dto.isRead());
        notification.setIdUser(dto.getIdUser());
        return notification;
    }

    public NotificationDTO toDto(Notification notification) {
        if (notification == null) {
            return null;
        }
        NotificationDTO dto = new NotificationDTO();
        dto.setId(notification.getId());
        dto.setMessage(notification.getMessage());
        dto.setCreateAt(notification.getCreateAt());
        dto.setUrl(notification.getUrl());
        dto.setRead(notification.isRead());
        dto.setIdUser(notification.getIdUser());
        return dto;
    }
}
