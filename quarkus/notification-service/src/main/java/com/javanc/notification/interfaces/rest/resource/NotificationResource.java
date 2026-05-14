package com.javanc.notification.interfaces.rest.resource;

import com.javanc.notification.application.service.NotificationApplicationService;
import com.javanc.notification.interfaces.rest.dto.ApiResponse;
import com.javanc.notification.interfaces.rest.dto.MessageDTO;
import com.javanc.notification.interfaces.rest.dto.NotificationDTO;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/notification")
@Produces(MediaType.APPLICATION_JSON)
public class NotificationResource {

    private final NotificationApplicationService notificationService;

    @Inject
    public NotificationResource(NotificationApplicationService notificationService) {
        this.notificationService = notificationService;
    }

    @POST
    @Path("/create")
    @Consumes(MediaType.APPLICATION_JSON)
    public ApiResponse<String> create(MessageDTO messageDTO) {
        notificationService.send(messageDTO);
        return new ApiResponse<>(true, "Create is success", "true");
    }

    @POST
    @Path("/update")
    @Consumes(MediaType.APPLICATION_JSON)
    public ApiResponse<NotificationDTO> update(NotificationDTO notificationDTO) {
        NotificationDTO result = notificationService.update(notificationDTO);
        return new ApiResponse<>(true, "Update is success", result);
    }

    @GET
    @Path("/user/findByUser")
    public ApiResponse<List<NotificationDTO>> findByUser(@QueryParam("userId") Integer userId) {
        List<NotificationDTO> result = notificationService.getNotificationsByIdUser(userId);
        return new ApiResponse<>(true, "Find is success", result);
    }

    @POST
    @Path("/seen")
    public ApiResponse<NotificationDTO> seen(@QueryParam("id") Integer id) {
        NotificationDTO result = notificationService.seenNotification(id);
        return new ApiResponse<>(true, "Notification marked read", result);
    }

    @GET
    @Path("/getAll")
    public ApiResponse<String> ok() {
        return new ApiResponse<>(true, "Find is success", "ok");
    }
}
