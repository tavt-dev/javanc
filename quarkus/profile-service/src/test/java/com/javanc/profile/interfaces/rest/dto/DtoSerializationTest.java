package com.javanc.profile.interfaces.rest.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.javanc.profile.domain.model.Contact;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DtoSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void profileDtoSerializesCurrentFieldNames() throws Exception {
        ProfileDTO profileDTO = new ProfileDTO(1, "objective", "education", "work", "java",
                new Contact(2, "address", "phone", "email@example.com"), "JAVA", 3, "url", "title");

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(profileDTO));

        assertEquals(1, json.get("id").asInt());
        assertEquals("objective", json.get("objective").asText());
        assertEquals("education", json.get("education").asText());
        assertEquals("work", json.get("workExperience").asText());
        assertEquals("java", json.get("skills").asText());
        assertEquals("JAVA", json.get("typeProfile").asText());
        assertEquals(3, json.get("idUser").asInt());
        assertEquals("url", json.get("url").asText());
        assertEquals("title", json.get("title").asText());
        assertEquals("address", json.get("contact").get("address").asText());
    }

    @Test
    void booleanDtoPreservesIsCheckName() throws Exception {
        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(new BooleanDTO(true)));

        assertTrue(json.get("isCheck").asBoolean());
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
