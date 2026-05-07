package com.javanc.user.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.javanc.user.dto.request.AuthenticationRequest;
import com.javanc.user.dto.response.AuthenticationResponse;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DtoSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void apiResponseSerializesWrapperFields() throws Exception {
        UserDTO user = new UserDTO(1, "Jane", "jane@example.com", "encoded", "EMP-1", "user", true);
        ApiResponse<UserDTO> response = new ApiResponse<>(true, "ok", user);

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(response));

        assertTrue(json.get("success").asBoolean());
        assertEquals("ok", json.get("message").asText());
        assertEquals(1, json.get("data").get("id").asInt());
        assertEquals("jane@example.com", json.get("data").get("email").asText());
    }

    @Test
    void authenticationRequestIgnoresUnknownFieldsAndOmitsNulls() throws Exception {
        String input = """
                {
                  "email": "jane@example.com",
                  "password": "Password1!",
                  "confirmPassword": "Password1!",
                  "idEmployee": "EMP-1"
                }
                """;

        AuthenticationRequest request = objectMapper.readValue(input, AuthenticationRequest.class);
        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(request));

        assertEquals("jane@example.com", request.getEmail());
        assertEquals("Password1!", request.getPassword());
        assertEquals("EMP-1", request.getIdEmployee());
        assertEquals("EMP-1", json.get("idEmployee").asText());
        assertFalse(json.has("confirmPassword"));
        assertFalse(json.has("name"));
        assertFalse(json.has("role"));
        assertFalse(json.has("token"));
    }

    @Test
    void authenticationResponseSerializesSpringCompatibleValidityName() throws Exception {
        UserDTO user = new UserDTO(1, "Jane", "jane@example.com", "encoded", "EMP-1", "user", true);
        AuthenticationResponse response = new AuthenticationResponse(200, null, "Successfully Signed In",
                "access-token", "refresh-token", "24Hr", user, true, "user");

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(response));

        assertEquals(200, json.get("statusCode").asInt());
        assertEquals("Successfully Signed In", json.get("message").asText());
        assertEquals("access-token", json.get("token").asText());
        assertEquals("refresh-token", json.get("refreshToken").asText());
        assertEquals("24Hr", json.get("expirationTime").asText());
        assertEquals("user", json.get("role").asText());
        assertTrue(json.get("vaild").asBoolean());
        assertFalse(json.has("isVaild"));
        assertEquals("jane@example.com", json.get("user").get("email").asText());
    }

    @Test
    void authenticationResponseAcceptsBothValidityNames() throws Exception {
        AuthenticationResponse springWire = objectMapper.readValue("{\"vaild\":true}",
                AuthenticationResponse.class);
        AuthenticationResponse documentedWire = objectMapper.readValue("{\"isVaild\":true}",
                AuthenticationResponse.class);

        assertTrue(springWire.isVaild());
        assertTrue(documentedWire.isVaild());
    }

    @Test
    void userDtoSerializesActiveAndAcceptsIsActiveAlias() throws Exception {
        UserDTO user = new UserDTO(1, "Jane", "jane@example.com", "encoded", "EMP-1", "user", true);

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(user));
        UserDTO activeWire = objectMapper.readValue("{\"active\":true,\"password\":\"encoded\"}", UserDTO.class);
        UserDTO isActiveWire = objectMapper.readValue("{\"isActive\":true,\"password\":\"encoded\"}", UserDTO.class);

        assertTrue(json.get("active").asBoolean());
        assertFalse(json.has("isActive"));
        assertEquals("encoded", json.get("password").asText());
        assertTrue(activeWire.isActive());
        assertTrue(isActiveWire.isActive());
        assertEquals("encoded", isActiveWire.getPassword());
    }
}
