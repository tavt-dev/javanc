package com.javanc.project.infrastructure.persistence;

import com.javanc.project.domain.model.Project;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
class ProjectJpaRepositoryTest {

    @Inject
    ProjectJpaRepository repository;

    @BeforeEach
    @Transactional
    void cleanDatabase() {
        repository.deleteAll();
    }

    @Test
    @Transactional
    void persistsAndFindsProjectById() {
        Project project = project(101, 501, "One");

        repository.save(project);

        assertTrue(repository.findByProjectId(101).isPresent());
        assertEquals("One", repository.findByProjectId(101).orElseThrow().getTitle());
    }

    @Test
    @Transactional
    void findsProjectsByProfileId() {
        repository.save(project(201, 601, "Match A"));
        repository.save(project(202, 601, "Match B"));
        repository.save(project(203, 602, "Other"));

        assertEquals(2, repository.findByIdProfile(601).size());
    }

    private Project project(Integer id, Integer profileId, String title) {
        Project project = new Project();
        project.setId(id);
        project.setTitle(title);
        project.setDescription("Description");
        project.setCreateAt(LocalDateTime.now());
        project.setDisplay(true);
        project.setUrl("https://example.test/" + id);
        project.setIdProfile(profileId);
        return project;
    }
}
