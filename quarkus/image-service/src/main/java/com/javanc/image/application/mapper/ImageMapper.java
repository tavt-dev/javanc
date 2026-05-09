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
        return new ImageDTO(image.getId(), image.getUrl());
    }

    public JpaImageEntity toEntity(Image image) {
        if (image == null) {
            return null;
        }
        JpaImageEntity entity = new JpaImageEntity();
        entity.setId(image.getId());
        entity.setUrl(image.getUrl());
        return entity;
    }

    public Image toDomain(JpaImageEntity entity) {
        if (entity == null) {
            return null;
        }
        return new Image(entity.getId(), entity.getUrl());
    }
}
