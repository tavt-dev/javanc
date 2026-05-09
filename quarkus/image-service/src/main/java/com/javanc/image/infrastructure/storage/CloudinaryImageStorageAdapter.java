package com.javanc.image.infrastructure.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.javanc.image.application.exception.CloudinaryException;
import com.javanc.image.application.exception.ErrorCode;
import com.javanc.image.application.port.ImageStoragePort;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.util.Map;

@ApplicationScoped
public class CloudinaryImageStorageAdapter implements ImageStoragePort {

    private static final Logger LOG = Logger.getLogger(CloudinaryImageStorageAdapter.class);

    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;

    public CloudinaryImageStorageAdapter(
            @ConfigProperty(name = "cloudinary.cloud-name", defaultValue = "") String cloudName,
            @ConfigProperty(name = "cloudinary.api-key", defaultValue = "") String apiKey,
            @ConfigProperty(name = "cloudinary.api-secret", defaultValue = "") String apiSecret) {
        this.cloudName = cloudName;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
    }

    @Override
    public String upload(FileUpload imageFile) {
        validateConfig();
        try {
            LOG.infof("Uploading image to Cloudinary: %s", imageFile.fileName());
            Map<?, ?> result = cloudinary().uploader().upload(imageFile.uploadedFile().toFile(), ObjectUtils.emptyMap());
            return (String) result.get("url");
        } catch (IOException exception) {
            throw new CloudinaryException(ErrorCode.UPLOAD_FAILED, exception);
        }
    }

    private Cloudinary cloudinary() {
        return new Cloudinary(Map.of(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret));
    }

    private void validateConfig() {
        if (cloudName.isBlank() || apiKey.isBlank() || apiSecret.isBlank()) {
            throw new CloudinaryException(ErrorCode.UPLOAD_FAILED);
        }
    }
}
