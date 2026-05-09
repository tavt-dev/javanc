package com.javanc.image.infrastructure.persistence;

import com.javanc.image.application.mapper.ImageMapper;
import com.javanc.image.domain.model.Image;
import com.javanc.image.domain.repository.ImageRepository;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Optional;

@ApplicationScoped
public class ImageJpaRepository implements ImageRepository, PanacheRepositoryBase<JpaImageEntity, Integer> {

    private final ImageMapper imageMapper;

    @Inject
    public ImageJpaRepository(ImageMapper imageMapper) {
        this.imageMapper = imageMapper;
    }

    @Override
    public Image save(Image image) {
        JpaImageEntity entity = imageMapper.toEntity(image);
        persist(entity);
        return imageMapper.toDomain(entity);
    }

    @Override
    public Optional<Image> findByImageId(Integer id) {
        return findByIdOptional(id).map(imageMapper::toDomain);
    }
}
