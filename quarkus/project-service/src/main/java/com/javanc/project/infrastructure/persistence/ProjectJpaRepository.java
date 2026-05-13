package com.javanc.project.infrastructure.persistence;

import com.javanc.project.domain.model.Project;
import com.javanc.project.domain.repository.ProjectRepository;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
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
    public List<Project> findByIdProfile(Integer idProfile) {
        return find("idProfile", idProfile).list();
    }

    @Override
    public void delete(Project project) {
        Project managed = getEntityManager().contains(project) ? project : getEntityManager().merge(project);
        getEntityManager().remove(managed);
    }
}
