package com.javanc.image.interfaces.rest.resource;

import com.javanc.image.application.dto.ApiResponse;
import com.javanc.image.application.dto.ImageDTO;
import com.javanc.image.application.service.ImageApplicationService;
import com.javanc.image.interfaces.rest.form.ImageMultipartForm;
import jakarta.inject.Inject;
import jakarta.ws.rs.BeanParam;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.nio.file.Files;

@Path("/image")
@Produces(MediaType.APPLICATION_JSON)
public class ImageResource {

    private final ImageApplicationService imageService;

    @Inject
    public ImageResource(ImageApplicationService imageService) {
        this.imageService = imageService;
    }

    @POST
    @Path("/save")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response save(@BeanParam ImageMultipartForm form) {
        FileUpload image = form.getImage();
        if (isMissingOrEmpty(image)) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
        ImageDTO imageDTO = imageService.saveImage(image);
        return Response.ok(new ApiResponse<>(true, "Get all is successfully", imageDTO)).build();
    }

    @GET
    @Path("/getAll")
    public ApiResponse<String> getAll() {
        return new ApiResponse<>(true, "Get all is successfully", "ok");
    }

    private boolean isMissingOrEmpty(FileUpload image) {
        if (image == null || image.uploadedFile() == null) {
            return true;
        }
        try {
            return Files.size(image.uploadedFile()) == 0;
        } catch (IOException exception) {
            return true;
        }
    }
}
