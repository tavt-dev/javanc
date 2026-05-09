package com.javanc.manager.infrastructure.client;

import com.javanc.manager.application.dto.ApiResponse;
import com.javanc.manager.application.dto.ImageDTO;
import com.javanc.manager.application.port.ImageStoragePort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.jboss.resteasy.reactive.multipart.FileUpload;

@ApplicationScoped
public class ImageServiceAdapter implements ImageStoragePort {

    private final ImageClient imageClient;

    @Inject
    public ImageServiceAdapter(@RestClient ImageClient imageClient) {
        this.imageClient = imageClient;
    }

    @Override
    public String uploadCompanyImage(FileUpload imageFile) {
        if (imageFile == null) {
            return "";
        }
        ApiResponse<ImageDTO> response = imageClient.save(imageFile.uploadedFile().toFile());
        return response.data.url;
    }
}
