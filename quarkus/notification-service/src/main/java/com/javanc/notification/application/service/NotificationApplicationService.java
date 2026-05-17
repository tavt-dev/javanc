package com.javanc.notification.application.service;

import com.javanc.notification.application.exception.ApplicationException;
import com.javanc.notification.application.exception.ErrorCode;
import com.javanc.notification.application.mapper.NotificationMapper;
import com.javanc.notification.application.port.UserLookupPort;
import com.javanc.notification.domain.model.Notification;
import com.javanc.notification.domain.repository.NotificationRepository;
import com.javanc.notification.interfaces.rest.dto.MessageDTO;
import com.javanc.notification.interfaces.rest.dto.NotificationDTO;
import com.javanc.common.pagination.PageRequest;
import com.javanc.common.pagination.PageResponse;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.PersistenceException;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@ApplicationScoped
public class NotificationApplicationService {
    private static final Set<String> NOTIFICATION_SORT_FIELDS = Set.of("id", "createAt", "read");

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

    public PageResponse<NotificationDTO> getNotificationsByIdUser(Integer userId, Boolean read, Integer page,
            Integer size, String sort) {
        try {
            boolean checkUser = userLookupPort.checkUserId(userId);
            if (!checkUser) {
                throw new ApplicationException(ErrorCode.DATABASE_ACCESS_ERROR);
            }
            PageResponse<Notification> response = notificationRepository.findByUserId(userId, read,
                    pageRequest(page, size, sort));
            return new PageResponse<>(
                    response.items().stream().map(notificationMapper::toDto).toList(),
                    response.page(),
                    response.size(),
                    response.totalElements(),
                    response.totalPages(),
                    response.hasNext(),
                    response.hasPrevious());
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

    private PageRequest pageRequest(Integer page, Integer size, String sort) {
        try {
            return PageRequest.resolve(page, size, sort, "createAt,desc", NOTIFICATION_SORT_FIELDS);
        } catch (IllegalArgumentException exception) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST);
        }
    }
}
