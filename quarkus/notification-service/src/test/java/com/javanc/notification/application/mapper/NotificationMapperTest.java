package com.javanc.notification.application.mapper;

import com.javanc.notification.domain.model.Notification;
import com.javanc.notification.interfaces.rest.dto.NotificationDTO;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NotificationMapperTest {

    private final NotificationMapper mapper = new NotificationMapper();

    @Test
    void mapsEntityToDto() {
        LocalDateTime createAt = LocalDateTime.of(2026, 5, 9, 10, 30);
        Notification notification = new Notification(1, "Accepted", createAt, 7, "https://example.test", true);

        NotificationDTO dto = mapper.toDto(notification);

        assertEquals(1, dto.getId());
        assertEquals("Accepted", dto.getMessage());
        assertEquals(createAt, dto.getCreateAt());
        assertEquals("https://example.test", dto.getUrl());
        assertTrue(dto.isRead());
        assertEquals(7, dto.getIdUser());
    }

    @Test
    void mapsDtoToEntity() {
        LocalDateTime createAt = LocalDateTime.of(2026, 5, 9, 10, 30);
        NotificationDTO dto = new NotificationDTO(2, "Pending", createAt, null, true, 8);

        Notification notification = mapper.toEntity(dto);

        assertEquals(2, notification.getId());
        assertEquals("Pending", notification.getMessage());
        assertEquals(createAt, notification.getCreateAt());
        assertTrue(notification.isRead());
        assertEquals(8, notification.getIdUser());
    }
}
