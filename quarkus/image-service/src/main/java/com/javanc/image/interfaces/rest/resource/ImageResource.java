package com.javanc.image.interfaces.rest.resource;

import com.javanc.image.application.dto.ApiResponse;
import com.javanc.image.application.dto.ImageDTO;
import com.javanc.image.application.exception.ApplicationException;
import com.javanc.image.application.exception.ErrorCode;
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
import java.io.InputStream;
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
        FileUpload image = form == null ? null : form.getImage();
        validateImage(image);
        ImageDTO imageDTO = imageService.saveImage(image);
        return Response.ok(new ApiResponse<>(true, "Image uploaded successfully", imageDTO)).build();
    }

    @GET
    @Path("/getAll")
    public ApiResponse<String> getAll() {
        return new ApiResponse<>(true, "Get all is successfully", "ok");
    }

    private void validateImage(FileUpload image) {
        if (image == null || image.uploadedFile() == null) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, "Image is required");
        }
        try {
            if (Files.size(image.uploadedFile()) == 0) {
                throw new ApplicationException(ErrorCode.BAD_REQUEST, "Image must not be empty");
            }
        } catch (IOException exception) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, "Image must not be empty", exception);
        }
        if (detectSupportedImageType(image) == null) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, "Only jpeg, png, and webp images are allowed");
        }
    }

    private String detectSupportedImageType(FileUpload image) {
        byte[] header = new byte[12];
        int read;
        try (InputStream inputStream = Files.newInputStream(image.uploadedFile())) {
            read = inputStream.read(header);
        } catch (IOException exception) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, "Image could not be read", exception);
        }
        if (read >= 3 && (header[0] & 0xff) == 0xff && (header[1] & 0xff) == 0xd8 && (header[2] & 0xff) == 0xff) {
            return "image/jpeg";
        }
        if (read >= 8 && (header[0] & 0xff) == 0x89 && header[1] == 0x50 && header[2] == 0x4e
                && header[3] == 0x47 && header[4] == 0x0d && header[5] == 0x0a && header[6] == 0x1a
                && header[7] == 0x0a) {
            return "image/png";
        }
        if (read >= 12 && header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46
                && header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50) {
            return "image/webp";
        }
        return null;
    }
}
