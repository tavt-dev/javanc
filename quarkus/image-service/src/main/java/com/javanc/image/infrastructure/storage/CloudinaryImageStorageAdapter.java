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
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@ApplicationScoped
public class CloudinaryImageStorageAdapter implements ImageStoragePort {

    private static final Logger LOG = Logger.getLogger(CloudinaryImageStorageAdapter.class);

    private final Cloudinary cloudinary;
    private final String folder;
    private final Path localUploadsDir;
    private final String publicBaseUrl;
    private final boolean cloudinaryEnabled;

    public CloudinaryImageStorageAdapter(
            @ConfigProperty(name = "cloudinary.cloud-name", defaultValue = "") String cloudName,
            @ConfigProperty(name = "cloudinary.api-key", defaultValue = "") String apiKey,
            @ConfigProperty(name = "cloudinary.api-secret", defaultValue = "") String apiSecret,
            @ConfigProperty(name = "cloudinary.folder", defaultValue = "javanc") String folder,
            @ConfigProperty(name = "image.local-storage-dir", defaultValue = "target/uploads/public") String localUploadsDir,
            @ConfigProperty(name = "image.public-base-url", defaultValue = "http://localhost:8083") String publicBaseUrl) {
        String normalizedCloudName = normalizeConfigValue(cloudName);
        String normalizedApiKey = normalizeConfigValue(apiKey);
        String normalizedApiSecret = normalizeConfigValue(apiSecret);
        this.cloudinaryEnabled = hasCloudinaryConfig(normalizedCloudName, normalizedApiKey, normalizedApiSecret);
        this.cloudinary = cloudinaryEnabled ? new Cloudinary(Map.of(
                "cloud_name", normalizedCloudName,
                "api_key", normalizedApiKey,
                "api_secret", normalizedApiSecret)) : null;
        this.folder = folder == null || folder.isBlank() ? "javanc" : folder.trim();
        this.localUploadsDir = Path.of(localUploadsDir == null || localUploadsDir.isBlank()
                ? "target/uploads/public"
                : localUploadsDir.trim());
        this.publicBaseUrl = normalizeBaseUrl(publicBaseUrl);
    }

    @Override
    public ImageUploadResult upload(FileUpload imageFile) {
        if (!cloudinaryEnabled) {
            return uploadLocally(imageFile);
        }
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

    private ImageUploadResult uploadLocally(FileUpload imageFile) {
        try {
            Files.createDirectories(localUploadsDir);
            String extension = extension(imageFile.fileName());
            String filename = UUID.randomUUID() + extension;
            Path baseDir = localUploadsDir.toAbsolutePath().normalize();
            Path target = baseDir.resolve(filename).normalize();
            if (!target.startsWith(baseDir)) {
                throw new CloudinaryException(ErrorCode.UPLOAD_FAILED, "Invalid upload path");
            }
            Files.copy(imageFile.uploadedFile(), target, StandardCopyOption.REPLACE_EXISTING);
            String url = publicBaseUrl + "/image/files/" + filename;
            return new ImageUploadResult(url, "local/" + filename, url, extension.replace(".", ""), "image",
                    Files.size(target), null, null);
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

    private boolean hasCloudinaryConfig(String cloudName, String apiKey, String apiSecret) {
        return cloudName != null && !cloudName.isBlank()
                && apiKey != null && !apiKey.isBlank()
                && apiSecret != null && !apiSecret.isBlank();
    }

    private String normalizeConfigValue(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeBaseUrl(String value) {
        String baseUrl = value == null || value.isBlank() ? "http://localhost:8083" : value.trim();
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    private String extension(String filename) {
        if (filename == null) {
            return ".png";
        }
        String lower = filename.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return ".jpg";
        }
        if (lower.endsWith(".webp")) {
            return ".webp";
        }
        return ".png";
    }
}
