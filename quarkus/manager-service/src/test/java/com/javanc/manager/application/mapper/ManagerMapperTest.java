package com.javanc.manager.application.mapper;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.javanc.manager.application.dto.ApiResponse;
import com.javanc.manager.application.dto.CompanyDTO;
import com.javanc.manager.application.dto.JobDTO;
import com.javanc.manager.domain.model.Company;
import com.javanc.manager.domain.model.Job;
import com.javanc.manager.domain.model.TypeJob;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ManagerMapperTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void companyMapperPreservesIdHrToIdHRCompatibility() {
        Company company = new Company();
        company.id = 1;
        company.idHr = List.of(2, 3);
        company.idJobs = List.of(4);

        CompanyDTO dto = new CompanyMapper().toDto(company);

        assertEquals(List.of(2, 3), dto.idHR);
        assertEquals(List.of(4), dto.idJobs);
    }

    @Test
    void jobMapperPreservesLowercaseTypeAndMisspelledPendingField() {
        Job job = new Job();
        job.id = 1;
        job.typeJob = TypeJob.java;
        job.idProfiePending = List.of(9);

        JobDTO dto = new JobMapper().toDto(job);

        assertEquals("java", dto.typeJob);
        assertEquals(List.of(9), dto.idProfiePending);
    }

    @Test
    void apiResponseSerializesWrapperFields() throws Exception {
        ApiResponse<String> response = new ApiResponse<>(true, "ok", "data");

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(response));

        assertTrue(json.get("success").asBoolean());
        assertEquals("ok", json.get("message").asText());
        assertEquals("data", json.get("data").asText());
    }

    @Test
    void companyDtoSerializesCurrentIdHRFieldName() throws Exception {
        CompanyDTO dto = new CompanyDTO();
        dto.idHR = List.of(7);

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(dto));

        assertEquals(7, json.get("idHR").get(0).asInt());
    }

    @Test
    void jobDtoSerializesCurrentIdProfiePendingFieldName() throws Exception {
        JobDTO dto = new JobDTO();
        dto.idProfiePending = List.of(8);

        JsonNode json = objectMapper.readTree(objectMapper.writeValueAsString(dto));

        assertEquals(8, json.get("idProfiePending").get(0).asInt());
    }
}
