package com.javanc.image.application.mapper;

import com.javanc.image.application.dto.ImageDTO;
import com.javanc.image.domain.model.Image;
import com.javanc.image.infrastructure.persistence.JpaImageEntity;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ImageMapperTest {

    private final ImageMapper mapper = new ImageMapper();

    @Test
    void mapsDomainToDto() {
        ImageDTO dto = mapper.toDto(new Image(10, "url"));

        assertEquals(10, dto.getId());
        assertEquals("url", dto.getUrl());
    }

    @Test
    void mapsDomainToEntityAndBack() {
        JpaImageEntity entity = mapper.toEntity(new Image(11, "http://image.test/a.png"));
        Image image = mapper.toDomain(entity);

        assertEquals(11, entity.getId());
        assertEquals("http://image.test/a.png", entity.getUrl());
        assertEquals(11, image.getId());
        assertEquals("http://image.test/a.png", image.getUrl());
    }

    @Test
    void mapsNullsToNulls() {
        assertNull(mapper.toDto(null));
        assertNull(mapper.toEntity(null));
        assertNull(mapper.toDomain(null));
    }
}
