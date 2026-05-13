package com.javanc.user.adapter.out.notification;

import com.javanc.user.domain.port.RoleRequestNotifier;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.jboss.logging.Logger;

@ApplicationScoped
public class NotificationRoleRequestNotifier implements RoleRequestNotifier {

    private static final Logger LOG = Logger.getLogger(NotificationRoleRequestNotifier.class);

    private final NotificationClient notificationClient;
    private final boolean enabled;

    @Inject
    public NotificationRoleRequestNotifier(@RestClient NotificationClient notificationClient,
            @ConfigProperty(name = "role.notifications.enabled", defaultValue = "true") boolean enabled) {
        this.notificationClient = notificationClient;
        this.enabled = enabled;
    }

    @Override
    public void notifyUser(Integer userId, String message) {
        if (!enabled || userId == null || message == null || message.isBlank()) {
            return;
        }
        try {
            notificationClient.create(new NotificationMessage(message, userId));
        } catch (RuntimeException exception) {
            LOG.warnf(exception, "Unable to create role workflow notification for user %s", userId);
        }
    }
}
