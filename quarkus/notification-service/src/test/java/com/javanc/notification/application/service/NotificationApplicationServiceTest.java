package com.javanc.notification.application.service;

import com.javanc.common.pagination.PageRequest;
import com.javanc.common.pagination.PageResponse;
import com.javanc.notification.application.exception.ApplicationException;
import com.javanc.notification.application.exception.ErrorCode;
import com.javanc.notification.application.mapper.NotificationMapper;
import com.javanc.notification.application.port.UserLookupPort;
import com.javanc.notification.domain.model.Notification;
import com.javanc.notification.domain.repository.NotificationRepository;
import com.javanc.notification.interfaces.rest.dto.MessageDTO;
import com.javanc.notification.interfaces.rest.dto.NotificationDTO;
import com.javanc.notification.interfaces.rest.dto.UserDTO;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NotificationApplicationServiceTest {

    private final FakeNotificationRepository repository = new FakeNotificationRepository();
    private final FakeUserLookupPort userLookupPort = new FakeUserLookupPort();
    private final NotificationApplicationService service = new NotificationApplicationService(repository,
            new NotificationMapper(), userLookupPort);

    @Test
    void sendPersistsUnreadNotificationForMessageTargetUser() {
        service.send(new MessageDTO("Application accepted", 99));

        Notification saved = repository.saved.get(0);
        assertNotNull(saved.getId());
        assertEquals("Application accepted", saved.getMessage());
        assertEquals(99, saved.getIdUser());
        assertNotNull(saved.getCreateAt());
        assertFalse(saved.isRead());
    }

    @Test
    void updateSavesIncomingDtoDirectly() {
        NotificationDTO dto = new NotificationDTO(10, "Read", null, null, true, 99);

        NotificationDTO result = service.update(dto);

        assertEquals(10, result.getId());
        assertTrue(result.isRead());
        assertEquals("Read", repository.saved.get(0).getMessage());
    }

    @Test
    void findByUserValidatesUserBeforeQueryingNotifications() {
        repository.saved.add(new Notification(1, "One", null, 99, null, false));

        PageResponse<NotificationDTO> result = service.getNotificationsByIdUser(99, null, 0, 20, "createAt,desc");

        assertTrue(userLookupPort.checked);
        assertEquals(1, result.items().size());
        assertEquals("One", result.items().get(0).getMessage());
    }

    @Test
    void findByUserFalseCheckPreservesDatabaseAccessError() {
        userLookupPort.valid = false;

        ApplicationException exception = assertThrows(ApplicationException.class,
                () -> service.getNotificationsByIdUser(99, null, 0, 20, "createAt,desc"));

        assertEquals(ErrorCode.DATABASE_ACCESS_ERROR, exception.getErrorCode());
    }

    private static class FakeNotificationRepository implements NotificationRepository {
        private final List<Notification> saved = new ArrayList<>();

        @Override
        public Notification save(Notification notification) {
            saved.add(notification);
            return notification;
        }

        @Override
        public Optional<Notification> findByNotificationId(Integer id) {
            return saved.stream().filter(notification -> id.equals(notification.getId())).findFirst();
        }

        @Override
        public PageResponse<Notification> findByUserId(Integer userId, Boolean read, PageRequest pageRequest) {
            List<Notification> filtered = saved.stream()
                    .filter(notification -> userId.equals(notification.getIdUser()))
                    .filter(notification -> read == null || notification.isRead() == read)
                    .toList();
            return PageResponse.of(filtered, pageRequest, filtered.size());
        }
    }

    private static class FakeUserLookupPort implements UserLookupPort {
        private boolean valid = true;
        private boolean checked;

        @Override
        public boolean checkUserId(Integer id) {
            checked = true;
            return valid;
        }

        @Override
        public UserDTO getCurrentUser() {
            return null;
        }
    }
}
