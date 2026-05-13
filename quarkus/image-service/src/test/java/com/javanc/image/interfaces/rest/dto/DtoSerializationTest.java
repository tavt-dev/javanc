package com.javanc.image.interfaces.rest.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.javanc.image.application.dto.ApiResponse;
import com.javanc.image.application.dto.ImageDTO;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DtoSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @Test
    void imageDtoSerializesCurrentFieldNames() throws Exception {
        ImageDTO imageDTO = new ImageDTO(1, "https://example.test/image.png", "javanc/profile/a",
                "https://example.test/image.png", "png", "image", 100L, 20, 10,
                Instant.parse("2026-05-11T00:00:00Z"));

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(imageDTO));

        assertEquals(1, json.get("id").asInt());
        assertEquals("https://example.test/image.png", json.get("url").asText());
        assertEquals("javanc/profile/a", json.get("publicId").asText());
        assertEquals("https://example.test/image.png", json.get("secureUrl").asText());
        assertEquals("png", json.get("format").asText());
        assertEquals("image", json.get("resourceType").asText());
        assertEquals(100L, json.get("bytes").asLong());
        assertEquals(20, json.get("width").asInt());
        assertEquals(10, json.get("height").asInt());
        assertEquals("2026-05-11T00:00:00Z", json.get("createdAt").asText());
    }

    @Test
    void apiResponseSerializesWrapperFields() throws Exception {
        ApiResponse<String> response = new ApiResponse<>(true, "ok", "data");

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(response));

        assertTrue(json.get("success").asBoolean());
        assertEquals("ok", json.get("message").asText());
        assertEquals("data", json.get("data").asText());
    }
}
