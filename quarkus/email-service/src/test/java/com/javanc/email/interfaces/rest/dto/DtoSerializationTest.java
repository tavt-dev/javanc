package com.javanc.email.interfaces.rest.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.javanc.email.application.dto.ApiResponse;
import com.javanc.email.application.dto.MailDTO;
import com.javanc.email.application.dto.MessageDTO;
import com.javanc.email.application.dto.UserDTO;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DtoSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void apiResponseSerializesWrapperFields() throws Exception {
        ApiResponse<String> response = new ApiResponse<>(true, "ok", "data");

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(response));

        assertTrue(json.get("success").asBoolean());
        assertEquals("ok", json.get("message").asText());
        assertEquals("data", json.get("data").asText());
    }

    @Test
    void messageDtoSerializesCurrentFieldNames() throws Exception {
        MessageDTO messageDTO = new MessageDTO("hello", 1);

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(messageDTO));

        assertEquals("hello", json.get("message").asText());
        assertEquals(1, json.get("id").asInt());
    }

    @Test
    void mailDtoSerializesCurrentFieldNames() throws Exception {
        MailDTO mailDTO = new MailDTO("to@example.test", "subject", "content");

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(mailDTO));

        assertEquals("to@example.test", json.get("mailTo").asText());
        assertEquals("subject", json.get("mailSubject").asText());
        assertEquals("content", json.get("mailContent").asText());
    }

    @Test
    void userDtoSerializesCurrentFieldNames() throws Exception {
        UserDTO userDTO = new UserDTO(1, "User", "user@example.test", "secret", "user");

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(userDTO));

        assertEquals(1, json.get("id").asInt());
        assertEquals("User", json.get("name").asText());
        assertEquals("user@example.test", json.get("email").asText());
        assertEquals("secret", json.get("password").asText());
        assertEquals("user", json.get("role").asText());
    }
}
