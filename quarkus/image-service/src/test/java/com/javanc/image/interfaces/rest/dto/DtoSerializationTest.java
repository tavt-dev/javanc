package com.javanc.image.interfaces.rest.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.javanc.image.application.dto.ApiResponse;
import com.javanc.image.application.dto.ImageDTO;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DtoSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void imageDtoSerializesCurrentFieldNames() throws Exception {
        ImageDTO imageDTO = new ImageDTO(1, "http://example.test/image.png");

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(imageDTO));

        assertEquals(1, json.get("id").asInt());
        assertEquals("http://example.test/image.png", json.get("url").asText());
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
