package com.javanc.notification.infrastructure.persistence;

import com.javanc.notification.domain.model.Notification;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
class NotificationJpaRepositoryTest {

    @Inject
    NotificationJpaRepository repository;

    @BeforeEach
    @Transactional
    void cleanDatabase() {
        repository.deleteAll();
    }

    @Test
    @Transactional
    void persistsAndFindsNotificationById() {
        Notification saved = repository.save(new Notification(101, "Saved", LocalDateTime.now(), 9, null, false));

        assertEquals(101, saved.getId());
        assertTrue(repository.findByNotificationId(101).isPresent());
    }

    @Test
    @Transactional
    void findsNotificationsByUserId() {
        repository.save(new Notification(201, "One", LocalDateTime.now(), 77, null, false));
        repository.save(new Notification(202, "Two", LocalDateTime.now(), 77, null, true));
        repository.save(new Notification(203, "Other", LocalDateTime.now(), 88, null, false));

        assertEquals(2, repository.findByUserId(77).size());
    }
}
