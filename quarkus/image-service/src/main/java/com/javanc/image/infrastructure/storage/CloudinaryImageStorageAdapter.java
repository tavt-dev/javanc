package com.javanc.image.infrastructure.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.javanc.image.application.exception.CloudinaryException;
import com.javanc.image.application.exception.ErrorCode;
import com.javanc.image.application.port.ImageUploadResult;
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

    private final Cloudinary cloudinary;
    private final String folder;

    public CloudinaryImageStorageAdapter(
            @ConfigProperty(name = "cloudinary.cloud-name", defaultValue = "") String cloudName,
            @ConfigProperty(name = "cloudinary.api-key", defaultValue = "") String apiKey,
            @ConfigProperty(name = "cloudinary.api-secret", defaultValue = "") String apiSecret,
            @ConfigProperty(name = "cloudinary.folder", defaultValue = "javanc") String folder) {
        validateConfig(cloudName, apiKey, apiSecret);
        this.cloudinary = new Cloudinary(Map.of(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret));
        this.folder = folder == null || folder.isBlank() ? "javanc" : folder.trim();
    }

    @Override
    public ImageUploadResult upload(FileUpload imageFile) {
        try {
            LOG.infof("Uploading image to Cloudinary: %s", imageFile.fileName());
            Map<?, ?> result = cloudinary.uploader().upload(imageFile.uploadedFile().toFile(), ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "image",
                    "use_filename", true,
                    "unique_filename", true,
                    "overwrite", false));
            String secureUrl = stringValue(result.get("secure_url"));
            if (secureUrl == null || secureUrl.isBlank()) {
                throw new CloudinaryException(ErrorCode.UPLOAD_FAILED, "Cloudinary did not return secure_url");
            }
            return new ImageUploadResult(secureUrl, stringValue(result.get("public_id")), secureUrl,
                    stringValue(result.get("format")), stringValue(result.get("resource_type")),
                    longValue(result.get("bytes")), intValue(result.get("width")), intValue(result.get("height")));
        } catch (CloudinaryException exception) {
            throw exception;
        } catch (IOException | RuntimeException exception) {
            throw new CloudinaryException(ErrorCode.UPLOAD_FAILED, exception);
        }
    }

    private String stringValue(Object value) {
        return value == null ? null : value.toString();
    }

    private Long longValue(Object value) {
        return value instanceof Number number ? number.longValue() : null;
    }

    private Integer intValue(Object value) {
        return value instanceof Number number ? number.intValue() : null;
    }

    private void validateConfig(String cloudName, String apiKey, String apiSecret) {
        if (cloudName.isBlank() || apiKey.isBlank() || apiSecret.isBlank()) {
            throw new CloudinaryException(ErrorCode.CLOUDINARY_CONFIG_MISSING);
        }
    }
}
