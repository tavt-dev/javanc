package com.javanc.image.application.service;

import com.javanc.image.application.dto.ImageDTO;
import com.javanc.image.application.exception.ApplicationException;
import com.javanc.image.application.exception.CloudinaryException;
import com.javanc.image.application.exception.ErrorCode;
import com.javanc.image.application.mapper.ImageMapper;
import com.javanc.image.application.port.ImageUploadResult;
import com.javanc.image.application.port.ImageStoragePort;
import com.javanc.image.domain.model.Image;
import com.javanc.image.domain.repository.ImageRepository;
import com.javanc.image.domain.service.ImageIdGenerator;
import org.jboss.resteasy.reactive.multipart.FileUpload;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ImageApplicationServiceTest {

    private static final Instant NOW = Instant.parse("2026-05-11T00:00:00Z");
    private static final Clock CLOCK = Clock.fixed(NOW, ZoneOffset.UTC);

    @Test
    void saveImageUploadsAndPersistsMetadata() {
        FakeRepository repository = new FakeRepository();
        ImageUploadResult upload = new ImageUploadResult("https://cdn.test/image.png", "javanc/profile/a",
                "https://cdn.test/image.png", "png", "image", 2048L, 300, 200);
        ImageApplicationService service = new ImageApplicationService(repository, imageFile -> upload,
                new FixedImageIdGenerator(123), new ImageMapper(), CLOCK);

        ImageDTO result = service.saveImage(null);

        assertEquals(123, result.getId());
        assertEquals("https://cdn.test/image.png", result.getUrl());
        assertEquals("javanc/profile/a", result.getPublicId());
        assertEquals("png", result.getFormat());
        assertEquals("image", result.getResourceType());
        assertEquals(2048L, result.getBytes());
        assertEquals(300, result.getWidth());
        assertEquals(200, result.getHeight());
        assertEquals(NOW, result.getCreatedAt());
        assertEquals(123, repository.savedImage.getId());
        assertEquals("https://cdn.test/image.png", repository.savedImage.getUrl());
        assertEquals("javanc/profile/a", repository.savedImage.getPublicId());
    }

    @Test
    void saveImagePreservesCloudinaryException() {
        ImageApplicationService service = new ImageApplicationService(new FakeRepository(),
                imageFile -> {
                    throw new CloudinaryException(ErrorCode.UPLOAD_FAILED);
                },
                new FixedImageIdGenerator(123), new ImageMapper());

        CloudinaryException exception = assertThrows(CloudinaryException.class, () -> service.saveImage(null));

        assertEquals(ErrorCode.UPLOAD_FAILED, exception.getErrorCode());
    }

    @Test
    void saveImageFailsWhenCloudinaryDoesNotReturnSecureUrl() {
        ImageApplicationService service = new ImageApplicationService(new FakeRepository(),
                imageFile -> new ImageUploadResult(null, "public-id", null, "png", "image", 1L, 1, 1),
                new FixedImageIdGenerator(123), new ImageMapper(), CLOCK);

        ApplicationException exception = assertThrows(ApplicationException.class, () -> service.saveImage(null));

        assertEquals(ErrorCode.UPLOAD_FAILED, exception.getErrorCode());
    }

    @Test
    void saveImageMapsUnexpectedRepositoryFailure() {
        ImageRepository repository = new ImageRepository() {
            @Override
            public Image save(Image image) {
                throw new IllegalStateException("database down");
            }

            @Override
            public Optional<Image> findByImageId(Integer id) {
                return Optional.empty();
            }
        };
        ImageApplicationService service = new ImageApplicationService(repository,
                imageFile -> new ImageUploadResult("https://cdn.test/image.png", "public-id",
                        "https://cdn.test/image.png", "png", "image", 1L, 1, 1),
                new FixedImageIdGenerator(123), new ImageMapper(), CLOCK);

        ApplicationException exception = assertThrows(ApplicationException.class, () -> service.saveImage(null));

        assertEquals(ErrorCode.IMAGE_UNABLE_TO_SAVE, exception.getErrorCode());
    }

    private static class FakeRepository implements ImageRepository {

        private Image savedImage;

        @Override
        public Image save(Image image) {
            this.savedImage = image;
            return image;
        }

        @Override
        public Optional<Image> findByImageId(Integer id) {
            return Optional.ofNullable(savedImage).filter(image -> image.getId().equals(id));
        }
    }

    private static class FixedImageIdGenerator extends ImageIdGenerator {

        private final Integer id;

        private FixedImageIdGenerator(Integer id) {
            this.id = id;
        }

        @Override
        public Integer nextId() {
            return id;
        }
    }

    @FunctionalInterface
    private interface ThrowingStoragePort extends ImageStoragePort {

        @Override
        ImageUploadResult upload(FileUpload imageFile);
    }
}
