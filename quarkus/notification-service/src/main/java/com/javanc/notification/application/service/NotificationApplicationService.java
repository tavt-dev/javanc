package com.javanc.notification.application.service;

import com.javanc.notification.application.exception.ApplicationException;
import com.javanc.notification.application.exception.ErrorCode;
import com.javanc.notification.application.mapper.NotificationMapper;
import com.javanc.notification.application.port.UserLookupPort;
import com.javanc.notification.domain.model.Notification;
import com.javanc.notification.domain.repository.NotificationRepository;
import com.javanc.notification.interfaces.rest.dto.MessageDTO;
import com.javanc.notification.interfaces.rest.dto.NotificationDTO;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.PersistenceException;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class NotificationApplicationService {

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;
    private final UserLookupPort userLookupPort;

    @Inject
    public NotificationApplicationService(NotificationRepository notificationRepository,
            NotificationMapper notificationMapper, UserLookupPort userLookupPort) {
        this.notificationRepository = notificationRepository;
        this.notificationMapper = notificationMapper;
        this.userLookupPort = userLookupPort;
    }

    @Transactional
    public NotificationDTO create(NotificationDTO notificationDTO) {
        try {
            Notification notification = new Notification();
            notification.setId(getGenerationId());
            notification.setMessage(notificationDTO.getMessage());
            notification.setCreateAt(LocalDateTime.now());
            notification.setRead(notificationDTO.isRead());
            notification.setUrl(notificationDTO.getUrl());
            notification.setIdUser(notificationDTO.getIdUser());
            return notificationMapper.toDto(notificationRepository.save(notification));
        } catch (PersistenceException exception) {
            throw new ApplicationException(ErrorCode.NOTIFICATION_UNABLE_TO_SAVE, exception);
        }
    }

    @Transactional
    public void send(MessageDTO messageDTO) {
        NotificationDTO notificationDTO = new NotificationDTO();
        notificationDTO.setMessage(messageDTO.getMessage());
        notificationDTO.setRead(false);
        notificationDTO.setIdUser(messageDTO.getId());
        create(notificationDTO);
    }

    @Transactional
    public NotificationDTO update(NotificationDTO notificationDTO) {
        try {
            return notificationMapper.toDto(notificationRepository.save(notificationMapper.toEntity(notificationDTO)));
        } catch (PersistenceException exception) {
            throw new ApplicationException(ErrorCode.NOTIFICATION_UNABLE_TO_UPDATE, exception);
        }
    }

    public NotificationDTO findById(Integer id) {
        return notificationRepository.findByNotificationId(id)
                .map(notificationMapper::toDto)
                .orElseThrow(() -> new ApplicationException(ErrorCode.NOTIFICATION_NOT_FOUND));
    }

    @Transactional
    public NotificationDTO seenNotification(Integer id) {
        try {
            Notification notification = notificationRepository.findByNotificationId(id)
                    .orElseThrow(() -> new ApplicationException(ErrorCode.NOTIFICATION_NOT_FOUND));
            notification.markRead();
            return notificationMapper.toDto(notificationRepository.save(notification));
        } catch (PersistenceException exception) {
            throw new ApplicationException(ErrorCode.NOTIFICATION_UNABLE_TO_UPDATE, exception);
        }
    }

    public List<NotificationDTO> getNotificationsByIdUser(Integer userId) {
        try {
            boolean checkUser = userLookupPort.checkUserId(userId);
            if (!checkUser) {
                throw new ApplicationException(ErrorCode.DATABASE_ACCESS_ERROR);
            }
            return notificationRepository.findByUserId(userId).stream()
                    .map(notificationMapper::toDto)
                    .toList();
        } catch (ApplicationException exception) {
            throw exception;
        } catch (PersistenceException exception) {
            throw new ApplicationException(ErrorCode.DATABASE_ACCESS_ERROR, exception);
        }
    }

    public Integer getGenerationId() {
        UUID uuid = UUID.randomUUID();
        return (int) (uuid.getMostSignificantBits() & 0xFFFFFFFFL);
    }
}
