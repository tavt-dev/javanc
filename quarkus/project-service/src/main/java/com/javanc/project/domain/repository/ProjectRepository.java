package com.javanc.project.domain.repository;

import com.javanc.project.domain.model.Project;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository {

    Project save(Project project);

    Optional<Project> findByProjectId(Integer id);

    List<Project> findByIdProfile(Integer idProfile);
}
