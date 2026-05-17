package com.javanc.project.application.service;

import com.javanc.common.pagination.PageRequest;
import com.javanc.common.pagination.PageResponse;
import com.javanc.common.pagination.SortDirection;
import com.javanc.project.application.dto.ImageDTO;
import com.javanc.project.application.dto.ProfileDTO;
import com.javanc.project.application.dto.ProjectDTO;
import com.javanc.project.application.exception.ApplicationException;
import com.javanc.project.application.exception.ErrorCode;
import com.javanc.project.application.mapper.ProjectMapper;
import com.javanc.project.application.port.ImageStoragePort;
import com.javanc.project.application.port.ProfileLookupPort;
import com.javanc.project.domain.model.Project;
import com.javanc.project.domain.repository.ProjectRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ProjectApplicationServiceTest {

    private final InMemoryProjectRepository repository = new InMemoryProjectRepository();
    private final ProjectMapper mapper = new ProjectMapper();
    private final ImageStoragePort imageStoragePort = mock(ImageStoragePort.class);
    private final ProfileLookupPort profileLookupPort = mock(ProfileLookupPort.class);
    private final ProjectApplicationService service = new ProjectApplicationService(repository, mapper,
            imageStoragePort, profileLookupPort);

    @Test
    void saveGeneratesIdAndCreateAtAndIgnoresImageFields() {
        ProjectDTO dto = new ProjectDTO();
        dto.setTitle("Portfolio");
        dto.setDescription("Java");
        dto.setUrl("https://example.test/project.png");
        dto.setImageId("ignored");
        dto.setImageFile("ignored");
        dto.setDisplay(true);
        dto.setIdProfile(77);

        ProjectDTO saved = service.saveProject(dto);
        Project entity = repository.findByProjectId(saved.getId()).orElseThrow();

        assertNotNull(saved.getId());
        assertNotNull(saved.getCreateAt());
        assertEquals("Portfolio", saved.getTitle());
        assertTrue(saved.isDisplay());
        assertNull(entity.getIdImage());
    }

    @Test
    void updatePreservesOriginalCreateAt() {
        LocalDateTime originalCreateAt = LocalDateTime.of(2026, 3, 1, 9, 30);
        Project existing = new Project();
        existing.setId(10);
        existing.setTitle("Old");
        existing.setCreateAt(originalCreateAt);
        existing.setDisplay(false);
        existing.setIdProfile(3);
        repository.save(existing);

        ProjectDTO update = new ProjectDTO();
        update.setId(10);
        update.setTitle("New");
        update.setDescription("Updated");
        update.setCreateAt(LocalDateTime.now());
        update.setDisplay(true);
        update.setIdProfile(3);

        ProjectDTO updated = service.updateProject(update);

        assertEquals("New", updated.getTitle());
        assertEquals(originalCreateAt, updated.getCreateAt());
        assertTrue(updated.isDisplay());
    }

    @Test
    void updateMissingProjectReturnsProjectNotFound() {
        ProjectDTO update = new ProjectDTO();
        update.setId(404);

        ApplicationException exception = assertThrows(ApplicationException.class, () -> service.updateProject(update));

        assertEquals(ErrorCode.PROJECT_NOT_FOUND, exception.getErrorCode());
    }

    @Test
    void findsProjectsByProfileId() {
        repository.save(project(1, 20, "One"));
        repository.save(project(2, 20, "Two"));
        repository.save(project(3, 21, "Three"));

        PageResponse<ProjectDTO> projects = service.getProjectByIdProfile(20, 0, 20, "id,asc");

        assertEquals(2, projects.items().size());
        assertEquals("One", projects.items().get(0).getTitle());
    }

    @Test
    void userCrudUsesCurrentProfileOwnership() {
        ProfileDTO profile = new ProfileDTO();
        profile.setId(88);
        when(profileLookupPort.getMyProfile()).thenReturn(profile);

        ProjectDTO create = new ProjectDTO();
        create.setTitle("User project");
        create.setDescription("Owned");
        create.setDisplay(true);

        ProjectDTO saved = service.createMyProject(create);
        assertEquals(88, saved.getIdProfile());
        assertEquals(1, service.getMyProjects(0, 20, "id,asc").items().size());

        ProjectDTO update = new ProjectDTO();
        update.setTitle("Updated user project");
        update.setDescription("Updated");
        update.setDisplay(false);

        ProjectDTO updated = service.updateMyProject(saved.getId(), update);
        assertEquals("Updated user project", updated.getTitle());

        service.deleteMyProject(saved.getId());
        assertEquals(0, service.getMyProjects(0, 20, "id,asc").items().size());
    }

    @Test
    void userUpdateRejectsProjectOwnedByAnotherProfile() {
        ProfileDTO profile = new ProfileDTO();
        profile.setId(88);
        when(profileLookupPort.getMyProfile()).thenReturn(profile);
        repository.save(project(99, 77, "Other"));

        ApplicationException exception = assertThrows(ApplicationException.class,
                () -> service.updateMyProject(99, new ProjectDTO()));

        assertEquals(ErrorCode.FORBIDDEN, exception.getErrorCode());
    }

    @Test
    void profileListDelegatesAndReturnsUnwrappedProfiles() {
        ProfileDTO profile = new ProfileDTO();
        profile.setId(1);
        PageResponse<ProfileDTO> profiles = PageResponse.of(List.of(profile),
                new PageRequest(0, 20, "createdAt", SortDirection.DESC), 1);
        when(profileLookupPort.getAllProfiles(0, 20, "createdAt,desc")).thenReturn(profiles);

        assertEquals(1, service.getAllProfiles(0, 20, "createdAt,desc").items().size());
    }

    @Test
    void imageCompatibilityMethodsDelegateToImagePort() {
        when(imageStoragePort.save(null)).thenReturn(new ImageDTO(9, "https://example.test/image.png"));
        when(imageStoragePort.getAll()).thenReturn("ok");

        assertEquals(9, service.saveImage(null).getId());
        assertEquals("ok", service.getImageCompatibilityStatus());
    }

    private Project project(Integer id, Integer profileId, String title) {
        Project project = new Project();
        project.setId(id);
        project.setTitle(title);
        project.setCreateAt(LocalDateTime.now());
        project.setIdProfile(profileId);
        return project;
    }

    private static class InMemoryProjectRepository implements ProjectRepository {

        private final List<Project> projects = new ArrayList<>();

        @Override
        public Project save(Project project) {
            projects.removeIf(existing -> existing.getId().equals(project.getId()));
            projects.add(project);
            projects.sort(Comparator.comparing(Project::getId));
            return project;
        }

        @Override
        public Optional<Project> findByProjectId(Integer id) {
            return projects.stream().filter(project -> project.getId().equals(id)).findFirst();
        }

        @Override
        public PageResponse<Project> findByIdProfile(Integer idProfile, PageRequest pageRequest) {
            List<Project> filtered = projects.stream()
                    .filter(project -> project.getIdProfile().equals(idProfile))
                    .toList();
            return PageResponse.of(filtered, pageRequest, filtered.size());
        }

        @Override
        public void delete(Project project) {
            projects.removeIf(existing -> existing.getId().equals(project.getId()));
        }
    }
}
