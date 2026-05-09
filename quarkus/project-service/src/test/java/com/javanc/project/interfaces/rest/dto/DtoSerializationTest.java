package com.javanc.project.interfaces.rest.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.javanc.project.application.dto.ApiResponse;
import com.javanc.project.application.dto.ProfileDTO;
import com.javanc.project.application.dto.ProjectDTO;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DtoSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void apiResponseSerializesCompatibilityFields() throws Exception {
        ApiResponse<String> response = new ApiResponse<>(true, "ok", "value");

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(response));

        assertTrue(json.get("success").asBoolean());
        assertEquals("ok", json.get("message").asText());
        assertEquals("value", json.get("data").asText());
    }

    @Test
    void projectDtoSerializesDisplayField() throws Exception {
        ProjectDTO dto = new ProjectDTO();
        dto.setDisplay(true);

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(dto));

        assertTrue(json.get("display").asBoolean());
        assertFalse(json.has("isDisplay"));
    }

    @Test
    void projectDtoAcceptsIsDisplayAlias() throws Exception {
        ProjectDTO dto = objectMapper.readValue("{\"isDisplay\":true}", ProjectDTO.class);

        assertTrue(dto.isDisplay());
    }

    @Test
    void profileDtoAcceptsQuarkusProfileIdUserAndSerializesUserId() throws Exception {
        ProfileDTO dto = objectMapper.readValue("{\"idUser\":42}", ProfileDTO.class);

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(dto));

        assertEquals(42, dto.getUserId());
        assertEquals(42, json.get("userId").asInt());
        assertFalse(json.has("idUser"));
    }
}
