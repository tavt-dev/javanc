package com.javanc.notification.interfaces.rest.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
class DtoSerializationTest {

    @Inject
    ObjectMapper objectMapper;

    @Test
    void apiResponseUsesCompatibleFieldNames() throws Exception {
        String json = objectMapper.writeValueAsString(new ApiResponse<>(true, "Find is success", "ok"));
        JsonNode root = objectMapper.readTree(json);

        assertTrue(root.has("success"));
        assertTrue(root.has("message"));
        assertTrue(root.has("data"));
    }

    @Test
    void notificationDtoSerializesReadAndNotIsRead() throws Exception {
        NotificationDTO dto = new NotificationDTO();
        dto.setRead(true);

        String json = objectMapper.writeValueAsString(dto);
        JsonNode root = objectMapper.readTree(json);

        assertTrue(root.has("read"));
        assertFalse(root.has("isRead"));
        assertTrue(root.get("read").asBoolean());
    }

    @Test
    void notificationDtoAcceptsIsReadAlias() throws Exception {
        NotificationDTO dto = objectMapper.readValue("{\"isRead\":true}", NotificationDTO.class);

        assertTrue(dto.isRead());
    }
}
