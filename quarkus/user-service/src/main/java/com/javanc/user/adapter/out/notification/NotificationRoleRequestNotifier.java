package com.javanc.user.adapter.out.notification;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.javanc.user.adapter.out.outbox.OutboxEventEntity;
import com.javanc.user.adapter.out.outbox.OutboxEventRepository;
import com.javanc.user.adapter.out.outbox.OutboxMessageKind;
import com.javanc.user.domain.port.RoleRequestNotifier;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.jboss.logging.Logger;
import org.jboss.logging.MDC;

import java.util.UUID;

@ApplicationScoped
public class NotificationRoleRequestNotifier implements RoleRequestNotifier {

    private static final Logger LOG = Logger.getLogger(NotificationRoleRequestNotifier.class);

    private final NotificationClient notificationClient;
    private final OutboxEventRepository outboxRepository;
    private final ObjectMapper objectMapper;
    private final MeterRegistry meterRegistry;
    private final boolean enabled;
    private final boolean asyncRoleNotificationEnabled;
    private final boolean asyncHttpFallbackEnabled;
    private final String notificationCommandsTopic;

    @Inject
    public NotificationRoleRequestNotifier(@RestClient NotificationClient notificationClient,
            OutboxEventRepository outboxRepository, ObjectMapper objectMapper, MeterRegistry meterRegistry,
            @ConfigProperty(name = "role.notifications.enabled", defaultValue = "true") boolean enabled,
            @ConfigProperty(name = "async.role-notification.enabled", defaultValue = "false") boolean asyncRoleNotificationEnabled,
            @ConfigProperty(name = "async.http-fallback.enabled", defaultValue = "true") boolean asyncHttpFallbackEnabled,
            @ConfigProperty(name = "mp.messaging.outgoing.notification-commands-out.topic", defaultValue = "javanc.notification.commands") String notificationCommandsTopic) {
        this.notificationClient = notificationClient;
        this.outboxRepository = outboxRepository;
        this.objectMapper = objectMapper;
        this.meterRegistry = meterRegistry;
        this.enabled = enabled;
        this.asyncRoleNotificationEnabled = asyncRoleNotificationEnabled;
        this.asyncHttpFallbackEnabled = asyncHttpFallbackEnabled;
        this.notificationCommandsTopic = notificationCommandsTopic;
    }

    @Override
    public void notifyUser(Integer userId, String message) {
        notifyRoleRequest(null, userId, message, "generic");
    }

    @Override
    public void notifyRoleRequest(Integer roleRequestId, Integer userId, String message, String event) {
        if (!enabled || userId == null || message == null || message.isBlank()) {
            return;
        }
        if (asyncRoleNotificationEnabled) {
            writeOutbox(roleRequestId, userId, message, event);
            if (!asyncHttpFallbackEnabled) {
                return;
            }
        }
        try {
            notificationClient.create(new NotificationMessage(message, userId));
            record(asyncRoleNotificationEnabled ? "dual-http" : "http", "success");
        } catch (RuntimeException exception) {
            record(asyncRoleNotificationEnabled ? "dual-http" : "http", "failure");
            LOG.warnf(exception, "Unable to create role workflow notification for user %s", userId);
        }
    }

    private void writeOutbox(Integer roleRequestId, Integer userId, String message, String event) {
        try {
            CreateNotificationPayload payload = new CreateNotificationPayload(userId, message, null);
            String payloadJson = objectMapper.writeValueAsString(payload);
            String aggregateId = roleRequestId == null ? userId.toString() : roleRequestId.toString();
            String normalizedEvent = event == null || event.isBlank() ? "notification" : event.trim();
            String idempotencyKey = "notification:role-request:" + aggregateId + ":" + normalizedEvent;
            outboxRepository.persist(OutboxEventEntity.pending(OutboxMessageKind.COMMAND, "CreateNotification",
                    notificationCommandsTopic, "RoleRequest", aggregateId, correlationId(), idempotencyKey,
                    payloadJson));
            record("outbox", "success");
        } catch (JsonProcessingException exception) {
            record("outbox", "failure");
            LOG.warnf(exception, "Unable to create role workflow notification command for user %s", userId);
        }
    }

    private void record(String path, String outcome) {
        Counter.builder("javanc_async_side_effect_total")
                .tag("service", "user-service")
                .tag("useCase", "role-notification")
                .tag("path", path)
                .tag("outcome", outcome)
                .register(meterRegistry)
                .increment();
    }

    private String correlationId() {
        Object requestId = MDC.get("requestId");
        if (requestId instanceof String value && !value.isBlank()) {
            return value;
        }
        return UUID.randomUUID().toString();
    }

    private record CreateNotificationPayload(Integer userId, String message, String url) {
    }
}
