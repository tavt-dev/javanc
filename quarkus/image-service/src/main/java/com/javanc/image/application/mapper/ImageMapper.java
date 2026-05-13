package com.javanc.image.application.mapper;

import com.javanc.image.application.dto.ImageDTO;
import com.javanc.image.domain.model.Image;
import com.javanc.image.infrastructure.persistence.JpaImageEntity;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ImageMapper {

    public ImageDTO toDto(Image image) {
        if (image == null) {
            return null;
        }
        return new ImageDTO(image.getId(), image.getUrl(), image.getPublicId(), image.getSecureUrl(),
                image.getFormat(), image.getResourceType(), image.getBytes(), image.getWidth(), image.getHeight(),
                image.getCreatedAt());
    }

    public JpaImageEntity toEntity(Image image) {
        if (image == null) {
            return null;
        }
        JpaImageEntity entity = new JpaImageEntity();
        entity.setId(image.getId());
        entity.setUrl(image.getUrl());
        entity.setPublicId(image.getPublicId());
        entity.setSecureUrl(image.getSecureUrl());
        entity.setFormat(image.getFormat());
        entity.setResourceType(image.getResourceType());
        entity.setBytes(image.getBytes());
        entity.setWidth(image.getWidth());
        entity.setHeight(image.getHeight());
        entity.setCreatedAt(image.getCreatedAt());
        return entity;
    }

    public Image toDomain(JpaImageEntity entity) {
        if (entity == null) {
            return null;
        }
        return new Image(entity.getId(), entity.getUrl(), entity.getPublicId(), entity.getSecureUrl(),
                entity.getFormat(), entity.getResourceType(), entity.getBytes(), entity.getWidth(),
                entity.getHeight(), entity.getCreatedAt());
    }
}
