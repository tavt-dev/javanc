package com.javanc.image.application.mapper;

import com.javanc.image.application.dto.ImageDTO;
import com.javanc.image.domain.model.Image;
import com.javanc.image.infrastructure.persistence.JpaImageEntity;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ImageMapperTest {

    private final ImageMapper mapper = new ImageMapper();

    @Test
    void mapsDomainToDto() {
        Instant createdAt = Instant.parse("2026-05-11T00:00:00Z");
        ImageDTO dto = mapper.toDto(new Image(10, "url", "public-id", "secure-url", "png", "image",
                100L, 20, 10, createdAt));

        assertEquals(10, dto.getId());
        assertEquals("url", dto.getUrl());
        assertEquals("public-id", dto.getPublicId());
        assertEquals("secure-url", dto.getSecureUrl());
        assertEquals("png", dto.getFormat());
        assertEquals("image", dto.getResourceType());
        assertEquals(100L, dto.getBytes());
        assertEquals(20, dto.getWidth());
        assertEquals(10, dto.getHeight());
        assertEquals(createdAt, dto.getCreatedAt());
    }

    @Test
    void mapsDomainToEntityAndBack() {
        Instant createdAt = Instant.parse("2026-05-11T00:00:00Z");
        JpaImageEntity entity = mapper.toEntity(new Image(11, "http://image.test/a.png", "public-id",
                "https://image.test/a.png", "png", "image", 512L, 64, 32, createdAt));
        Image image = mapper.toDomain(entity);

        assertEquals(11, entity.getId());
        assertEquals("http://image.test/a.png", entity.getUrl());
        assertEquals("public-id", entity.getPublicId());
        assertEquals("https://image.test/a.png", entity.getSecureUrl());
        assertEquals("png", entity.getFormat());
        assertEquals("image", entity.getResourceType());
        assertEquals(512L, entity.getBytes());
        assertEquals(64, entity.getWidth());
        assertEquals(32, entity.getHeight());
        assertEquals(createdAt, entity.getCreatedAt());
        assertEquals(11, image.getId());
        assertEquals("http://image.test/a.png", image.getUrl());
        assertEquals("public-id", image.getPublicId());
    }

    @Test
    void mapsNullsToNulls() {
        assertNull(mapper.toDto(null));
        assertNull(mapper.toEntity(null));
        assertNull(mapper.toDomain(null));
    }
}
