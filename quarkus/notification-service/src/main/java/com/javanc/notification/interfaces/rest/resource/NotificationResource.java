package com.javanc.notification.interfaces.rest.resource;

import com.javanc.notification.application.service.NotificationApplicationService;
import com.javanc.notification.interfaces.rest.dto.ApiResponse;
import com.javanc.notification.interfaces.rest.dto.MessageDTO;
import com.javanc.notification.interfaces.rest.dto.NotificationDTO;
import com.javanc.common.pagination.PageResponse;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

@Path("/notification")
@Produces(MediaType.APPLICATION_JSON)
public class NotificationResource {

    private final NotificationApplicationService notificationService;
    private final MeterRegistry meterRegistry;

    @Inject
    public NotificationResource(NotificationApplicationService notificationService, MeterRegistry meterRegistry) {
        this.notificationService = notificationService;
        this.meterRegistry = meterRegistry;
    }

    @POST
    @Path("/create")
    @Consumes(MediaType.APPLICATION_JSON)
    public ApiResponse<String> create(MessageDTO messageDTO) {
        try {
            notificationService.send(messageDTO);
            incrementNotificationMetric("create", "success");
            return new ApiResponse<>(true, "Create is success", "true");
        } catch (RuntimeException exception) {
            incrementNotificationMetric("create", "failure");
            throw exception;
        }
    }

    @POST
    @Path("/update")
    @Consumes(MediaType.APPLICATION_JSON)
    public ApiResponse<NotificationDTO> update(NotificationDTO notificationDTO) {
        try {
            NotificationDTO result = notificationService.update(notificationDTO);
            incrementNotificationMetric("update", "success");
            return new ApiResponse<>(true, "Update is success", result);
        } catch (RuntimeException exception) {
            incrementNotificationMetric("update", "failure");
            throw exception;
        }
    }

    @GET
    @Path("/user/findByUser")
    public ApiResponse<PageResponse<NotificationDTO>> findByUser(@QueryParam("userId") Integer userId,
            @QueryParam("read") Boolean read, @QueryParam("page") Integer page, @QueryParam("size") Integer size,
            @QueryParam("sort") String sort) {
        PageResponse<NotificationDTO> result = notificationService.getNotificationsByIdUser(userId, read, page, size,
                sort);
        return new ApiResponse<>(true, "Find is success", result);
    }

    @GET
    @Path("/getAll")
    public ApiResponse<String> ok() {
        return new ApiResponse<>(true, "Find is success", "ok");
    }

    private void incrementNotificationMetric(String operation, String outcome) {
        Counter.builder("javanc_notification_operations_total")
                .tag("service", "notification-service")
                .tag("operation", operation)
                .tag("outcome", outcome)
                .register(meterRegistry)
                .increment();
    }
}
