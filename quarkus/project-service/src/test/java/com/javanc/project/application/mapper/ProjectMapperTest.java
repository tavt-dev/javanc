package com.javanc.project.application.mapper;

import com.javanc.project.application.dto.ProjectDTO;
import com.javanc.project.domain.model.Project;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProjectMapperTest {

    private final ProjectMapper mapper = new ProjectMapper();

    @Test
    void mapsEntityToDtoWithDisplayField() {
        Project project = new Project();
        project.setId(1);
        project.setTitle("Portfolio");
        project.setDescription("Java project");
        project.setCreateAt(LocalDateTime.of(2026, 1, 1, 10, 0));
        project.setIdImage("99");
        project.setUrl("https://example.test/image.png");
        project.setDisplay(true);
        project.setIdProfile(7);

        ProjectDTO dto = mapper.toDto(project);

        assertEquals(1, dto.getId());
        assertEquals("Portfolio", dto.getTitle());
        assertTrue(dto.isDisplay());
        assertEquals(7, dto.getIdProfile());
        assertNull(dto.getImageId());
    }

    @Test
    void mapsDtoToEntityWithoutUsingImageCompatibilityFields() {
        ProjectDTO dto = new ProjectDTO();
        dto.setId(2);
        dto.setTitle("API");
        dto.setDescription("Backend");
        dto.setCreateAt(LocalDateTime.of(2026, 2, 2, 12, 0));
        dto.setUrl("https://example.test/api.png");
        dto.setImageId("123");
        dto.setImageFile("ignored");
        dto.setDisplay(true);
        dto.setIdProfile(8);

        Project project = mapper.toEntity(dto);

        assertEquals(2, project.getId());
        assertEquals("API", project.getTitle());
        assertTrue(project.isDisplay());
        assertEquals(8, project.getIdProfile());
        assertNull(project.getIdImage());
    }
}
