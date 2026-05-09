package com.javanc.image.application.service;

import com.javanc.image.application.dto.ImageDTO;
import com.javanc.image.application.exception.ApplicationException;
import com.javanc.image.application.exception.ErrorCode;
import com.javanc.image.application.mapper.ImageMapper;
import com.javanc.image.application.port.ImageStoragePort;
import com.javanc.image.domain.model.Image;
import com.javanc.image.domain.repository.ImageRepository;
import com.javanc.image.domain.service.ImageIdGenerator;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.hibernate.exception.JDBCConnectionException;
import org.jboss.resteasy.reactive.multipart.FileUpload;

@ApplicationScoped
public class ImageApplicationService {

    private final ImageRepository imageRepository;
    private final ImageStoragePort imageStoragePort;
    private final ImageIdGenerator imageIdGenerator;
    private final ImageMapper imageMapper;

    @Inject
    public ImageApplicationService(ImageRepository imageRepository, ImageStoragePort imageStoragePort,
            ImageIdGenerator imageIdGenerator, ImageMapper imageMapper) {
        this.imageRepository = imageRepository;
        this.imageStoragePort = imageStoragePort;
        this.imageIdGenerator = imageIdGenerator;
        this.imageMapper = imageMapper;
    }

    @Transactional
    public ImageDTO saveImage(FileUpload imageFile) {
        try {
            String imageUrl = imageStoragePort.upload(imageFile);
            Image image = new Image(imageIdGenerator.nextId(), imageUrl);
            return imageMapper.toDto(imageRepository.save(image));
        } catch (ApplicationException exception) {
            throw exception;
        } catch (JDBCConnectionException exception) {
            throw new ApplicationException(ErrorCode.DATABASE_ACCESS_ERROR, exception);
        } catch (RuntimeException exception) {
            throw new ApplicationException(ErrorCode.IMAGE_UNABLE_TO_SAVE, exception);
        }
    }
}
