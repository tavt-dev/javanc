package com.javanc.project.infrastructure.persistence;

import com.javanc.project.domain.model.Project;
import com.javanc.project.domain.repository.ProjectRepository;
import com.javanc.common.pagination.PageRequest;
import com.javanc.common.pagination.PageResponse;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class ProjectJpaRepository implements ProjectRepository, PanacheRepositoryBase<Project, Integer> {

    @Override
    public Project save(Project project) {
        return getEntityManager().merge(project);
    }

    @Override
    public Optional<Project> findByProjectId(Integer id) {
        return findByIdOptional(id);
    }

    @Override
    public PageResponse<Project> findByIdProfile(Integer idProfile, PageRequest pageRequest) {
        var query = find("idProfile", sort(pageRequest), idProfile);
        return PageResponse.of(query.page(pageRequest.page(), pageRequest.size()).list(), pageRequest, query.count());
    }

    @Override
    public void delete(Project project) {
        Project managed = getEntityManager().contains(project) ? project : getEntityManager().merge(project);
        getEntityManager().remove(managed);
    }

    private Sort sort(PageRequest request) {
        return request.direction() == com.javanc.common.pagination.SortDirection.ASC
                ? Sort.ascending(request.sortField())
                : Sort.descending(request.sortField());
    }
}
