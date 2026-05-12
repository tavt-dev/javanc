package com.javanc.email.interfaces.rest.resource;

import com.javanc.email.application.dto.ApiResponse;
import com.javanc.email.application.dto.MessageDTO;
import com.javanc.email.application.service.EmailApplicationService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/email")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class EmailResource {

    private final EmailApplicationService emailApplicationService;

    @Inject
    public EmailResource(EmailApplicationService emailApplicationService) {
        this.emailApplicationService = emailApplicationService;
    }

    @POST
    @Path("/create")
    public ApiResponse<String> send(MessageDTO messageDTO) {
        emailApplicationService.send(messageDTO);
        return new ApiResponse<>(true, "Check user id successfully", "true");
    }

}
