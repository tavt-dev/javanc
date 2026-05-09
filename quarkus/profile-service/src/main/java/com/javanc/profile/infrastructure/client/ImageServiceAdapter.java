package com.javanc.profile.infrastructure.client;

import com.javanc.profile.application.port.ImageStoragePort;
import com.javanc.profile.interfaces.rest.dto.ApiResponse;
import com.javanc.profile.interfaces.rest.dto.ImageDTO;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.File;

@ApplicationScoped
public class ImageServiceAdapter implements ImageStoragePort {

    private static final Logger LOG = Logger.getLogger(ImageServiceAdapter.class);

    private final ImageClient imageClient;

    @Inject
    public ImageServiceAdapter(@RestClient ImageClient imageClient) {
        this.imageClient = imageClient;
    }

    @Override
    public String uploadForSave(FileUpload imageFile) {
        if (imageFile == null) {
            return "";
        }
        ApiResponse<ImageDTO> response = imageClient.save(uploadedFile(imageFile));
        return response.getData().getUrl();
    }

    @Override
    public String uploadForUpdate(FileUpload imageFile) {
        if (imageFile == null) {
            return "";
        }
        ApiResponse<ImageDTO> response = imageClient.save(uploadedFile(imageFile));
        if (response == null || response.getData() == null) {
            LOG.info("Image was not saved or image-service returned an empty response");
            return "";
        }
        return response.getData().getUrl();
    }

    private File uploadedFile(FileUpload imageFile) {
        return imageFile.uploadedFile().toFile();
    }
}
