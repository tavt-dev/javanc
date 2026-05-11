package com.javanc.image.interfaces.rest.resource;

import com.javanc.image.application.port.ImageStoragePort;
import com.javanc.image.application.port.ImageUploadResult;
import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Alternative;
import org.jboss.resteasy.reactive.multipart.FileUpload;

@Alternative
@Priority(1)
@ApplicationScoped
public class FakeImageStoragePort implements ImageStoragePort {

    @Override
    public ImageUploadResult upload(FileUpload imageFile) {
        return new ImageUploadResult("https://cdn.test/image.png", "javanc/test/image",
                "https://cdn.test/image.png", "png", "image", 3L, 64, 64);
    }
}
