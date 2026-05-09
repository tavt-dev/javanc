package com.javanc.image.application.service;

import com.javanc.image.application.dto.ImageDTO;
import com.javanc.image.application.exception.ApplicationException;
import com.javanc.image.application.exception.CloudinaryException;
import com.javanc.image.application.exception.ErrorCode;
import com.javanc.image.application.mapper.ImageMapper;
import com.javanc.image.application.port.ImageStoragePort;
import com.javanc.image.domain.model.Image;
import com.javanc.image.domain.repository.ImageRepository;
import com.javanc.image.domain.service.ImageIdGenerator;
import org.jboss.resteasy.reactive.multipart.FileUpload;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ImageApplicationServiceTest {

    @Test
    void saveImageUploadsAndPersistsMetadata() {
        FakeRepository repository = new FakeRepository();
        ImageApplicationService service = new ImageApplicationService(repository, imageFile -> "http://cdn.test/image.png",
                new FixedImageIdGenerator(123), new ImageMapper());

        ImageDTO result = service.saveImage(null);

        assertEquals(123, result.getId());
        assertEquals("http://cdn.test/image.png", result.getUrl());
        assertEquals(123, repository.savedImage.getId());
        assertEquals("http://cdn.test/image.png", repository.savedImage.getUrl());
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
        ImageApplicationService service = new ImageApplicationService(repository, imageFile -> "url",
                new FixedImageIdGenerator(123), new ImageMapper());

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
        String upload(FileUpload imageFile);
    }
}
