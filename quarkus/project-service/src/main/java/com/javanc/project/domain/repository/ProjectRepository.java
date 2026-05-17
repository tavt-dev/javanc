package com.javanc.project.domain.repository;

import com.javanc.project.domain.model.Project;
import com.javanc.common.pagination.PageRequest;
import com.javanc.common.pagination.PageResponse;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository {

    Project save(Project project);

    Optional<Project> findByProjectId(Integer id);

    PageResponse<Project> findByIdProfile(Integer idProfile, PageRequest pageRequest);

    void delete(Project project);
}
