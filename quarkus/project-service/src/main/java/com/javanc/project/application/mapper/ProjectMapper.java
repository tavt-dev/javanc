package com.javanc.project.application.mapper;

import com.javanc.project.application.dto.ProjectDTO;
import com.javanc.project.domain.model.Project;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ProjectMapper {

    public Project toEntity(ProjectDTO dto) {
        if (dto == null) {
            return null;
        }
        Project project = new Project();
        project.setId(dto.getId());
        project.setTitle(dto.getTitle());
        project.setDescription(dto.getDescription());
        project.setCreateAt(dto.getCreateAt());
        project.setUrl(dto.getUrl());
        project.setDisplay(dto.isDisplay());
        project.setIdProfile(dto.getIdProfile());
        return project;
    }

    public ProjectDTO toDto(Project project) {
        if (project == null) {
            return null;
        }
        ProjectDTO dto = new ProjectDTO();
        dto.setId(project.getId());
        dto.setTitle(project.getTitle());
        dto.setDescription(project.getDescription());
        dto.setCreateAt(project.getCreateAt());
        dto.setUrl(project.getUrl());
        dto.setDisplay(project.isDisplay());
        dto.setIdProfile(project.getIdProfile());
        return dto;
    }
}
