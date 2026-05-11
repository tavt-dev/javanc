package com.javanc.image.application.service;

import com.javanc.image.application.dto.ImageDTO;
import com.javanc.image.application.exception.ApplicationException;
import com.javanc.image.application.exception.ErrorCode;
import com.javanc.image.application.mapper.ImageMapper;
import com.javanc.image.application.port.ImageUploadResult;
import com.javanc.image.application.port.ImageStoragePort;
import com.javanc.image.domain.model.Image;
import com.javanc.image.domain.repository.ImageRepository;
import com.javanc.image.domain.service.ImageIdGenerator;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.hibernate.exception.JDBCConnectionException;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.multipart.FileUpload;
import java.time.Clock;
import java.time.Instant;

@ApplicationScoped
public class ImageApplicationService {

    private static final Logger LOG = Logger.getLogger(ImageApplicationService.class);

    private final ImageRepository imageRepository;
    private final ImageStoragePort imageStoragePort;
    private final ImageIdGenerator imageIdGenerator;
    private final ImageMapper imageMapper;
    private final Clock clock;

    @Inject
    public ImageApplicationService(ImageRepository imageRepository, ImageStoragePort imageStoragePort,
            ImageIdGenerator imageIdGenerator, ImageMapper imageMapper) {
        this(imageRepository, imageStoragePort, imageIdGenerator, imageMapper, Clock.systemUTC());
    }

    ImageApplicationService(ImageRepository imageRepository, ImageStoragePort imageStoragePort,
            ImageIdGenerator imageIdGenerator, ImageMapper imageMapper, Clock clock) {
        this.imageRepository = imageRepository;
        this.imageStoragePort = imageStoragePort;
        this.imageIdGenerator = imageIdGenerator;
        this.imageMapper = imageMapper;
        this.clock = clock;
    }

    @Transactional
    public ImageDTO saveImage(FileUpload imageFile) {
        ImageUploadResult upload = null;
        try {
            upload = imageStoragePort.upload(imageFile);
            validateUploadResult(upload);
            Image image = new Image(imageIdGenerator.nextId(), upload.secureUrl(), upload.publicId(), upload.secureUrl(),
                    upload.format(), upload.resourceType(), upload.bytes(), upload.width(), upload.height(),
                    Instant.now(clock));
            return imageMapper.toDto(imageRepository.save(image));
        } catch (ApplicationException exception) {
            throw exception;
        } catch (JDBCConnectionException exception) {
            logUploadForCleanup(upload);
            throw new ApplicationException(ErrorCode.DATABASE_ACCESS_ERROR, exception);
        } catch (RuntimeException exception) {
            logUploadForCleanup(upload);
            throw new ApplicationException(ErrorCode.IMAGE_UNABLE_TO_SAVE, exception);
        }
    }

    private void validateUploadResult(ImageUploadResult upload) {
        if (upload == null || upload.secureUrl() == null || upload.secureUrl().isBlank()) {
            throw new ApplicationException(ErrorCode.UPLOAD_FAILED, "Cloudinary did not return a secure URL");
        }
    }

    private void logUploadForCleanup(ImageUploadResult upload) {
        if (upload != null && upload.publicId() != null && !upload.publicId().isBlank()) {
            LOG.warnf("Image metadata persistence failed after Cloudinary upload. Manual cleanup publicId=%s",
                    upload.publicId());
        }
    }
}
