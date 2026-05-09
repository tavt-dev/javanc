package com.javanc.project.infrastructure.client;

import com.javanc.project.application.dto.ApiResponse;
import com.javanc.project.application.dto.ImageDTO;
import com.javanc.project.application.port.ImageStoragePort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.File;

@ApplicationScoped
public class ImageServiceAdapter implements ImageStoragePort {

    private final ImageClient imageClient;

    @Inject
    public ImageServiceAdapter(@RestClient ImageClient imageClient) {
        this.imageClient = imageClient;
    }

    @Override
    public ImageDTO save(FileUpload image) {
        ApiResponse<ImageDTO> response = imageClient.save(uploadedFile(image));
        return response.getData();
    }

    @Override
    public String getAll() {
        return imageClient.getAll().getData();
    }

    private File uploadedFile(FileUpload image) {
        return image == null ? null : image.uploadedFile().toFile();
    }
}
