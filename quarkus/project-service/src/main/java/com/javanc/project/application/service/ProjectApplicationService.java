package com.javanc.project.application.service;

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
import com.javanc.common.pagination.PageRequest;
import com.javanc.common.pagination.PageResponse;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.PersistenceException;
import jakarta.transaction.Transactional;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@ApplicationScoped
public class ProjectApplicationService {
    private static final Set<String> PROJECT_SORT_FIELDS = Set.of("id", "title", "createAt");
    private static final Set<String> PROFILE_SORT_FIELDS = Set.of("id", "title", "typeProfile", "createdAt",
            "updatedAt");

    private final ProjectRepository projectRepository;
    private final ProjectMapper projectMapper;
    private final ImageStoragePort imageStoragePort;
    private final ProfileLookupPort profileLookupPort;

    @Inject
    public ProjectApplicationService(ProjectRepository projectRepository, ProjectMapper projectMapper,
            ImageStoragePort imageStoragePort, ProfileLookupPort profileLookupPort) {
        this.projectRepository = projectRepository;
        this.projectMapper = projectMapper;
        this.imageStoragePort = imageStoragePort;
        this.profileLookupPort = profileLookupPort;
    }

    @Transactional
    public ProjectDTO saveProject(ProjectDTO projectDTO) {
        try {
            Project project = new Project();
            project.setId(getGenerationId());
            project.setTitle(projectDTO.getTitle());
            project.setDescription(projectDTO.getDescription());
            project.setIdProfile(projectDTO.getIdProfile());
            project.setUrl(projectDTO.getUrl());
            project.setCreateAt(LocalDateTime.now());
            project.setDisplay(projectDTO.isDisplay());
            return projectMapper.toDto(projectRepository.save(project));
        } catch (PersistenceException exception) {
            throw new ApplicationException(ErrorCode.PROJECT_UNABLE_TO_SAVE, exception);
        }
    }

    @Transactional
    public ProjectDTO createMyProject(ProjectDTO projectDTO) {
        ProfileDTO profile = requireMyProfile();
        projectDTO.setIdProfile(profile.getId());
        return saveProject(projectDTO);
    }

    @Transactional
    public ProjectDTO updateProject(ProjectDTO projectDTO) {
        try {
            ProjectDTO existingProject = findById(projectDTO.getId());
            projectDTO.setCreateAt(existingProject.getCreateAt());
            Project project = projectRepository.save(projectMapper.toEntity(projectDTO));
            return projectMapper.toDto(project);
        } catch (ApplicationException exception) {
            throw exception;
        } catch (PersistenceException exception) {
            throw new ApplicationException(ErrorCode.PROJECT_UNABLE_TO_UPDATE, exception);
        }
    }

    @Transactional
    public ProjectDTO updateMyProject(Integer id, ProjectDTO projectDTO) {
        Project existing = myProjectEntity(id);
        ProjectDTO update = projectDTO == null ? new ProjectDTO() : projectDTO;
        update.setId(existing.getId());
        update.setIdProfile(existing.getIdProfile());
        update.setCreateAt(existing.getCreateAt());
        return updateProject(update);
    }

    @Transactional
    public void deleteMyProject(Integer id) {
        try {
            projectRepository.delete(myProjectEntity(id));
        } catch (ApplicationException exception) {
            throw exception;
        } catch (PersistenceException exception) {
            throw new ApplicationException(ErrorCode.PROJECT_UNABLE_TO_DELETE, exception);
        }
    }

    public ProjectDTO findById(Integer id) {
        return projectRepository.findByProjectId(id)
                .map(projectMapper::toDto)
                .orElseThrow(() -> new ApplicationException(ErrorCode.PROJECT_NOT_FOUND));
    }

    public PageResponse<ProfileDTO> getAllProfiles(Integer page, Integer size, String sort) {
        PageRequest request = profilePageRequest(page, size, sort);
        return profileLookupPort.getAllProfiles(request.page(), request.size(), request.sortField() + ","
                + request.direction().wireValue());
    }

    public PageResponse<ProjectDTO> getProjectByIdProfile(Integer idProfile, Integer page, Integer size, String sort) {
        try {
            return mapProjects(projectRepository.findByIdProfile(idProfile, pageRequest(page, size, sort)));
        } catch (PersistenceException exception) {
            throw new ApplicationException(ErrorCode.DATABASE_ACCESS_ERROR, exception);
        }
    }

    public PageResponse<ProjectDTO> getMyProjects(Integer page, Integer size, String sort) {
        ProfileDTO profile = requireMyProfile();
        return getProjectByIdProfile(profile.getId(), page, size, sort);
    }

    public ProjectDTO getMyProject(Integer id) {
        return projectMapper.toDto(myProjectEntity(id));
    }

    public ImageDTO saveImage(FileUpload image) {
        return imageStoragePort.save(image);
    }

    public String getImageCompatibilityStatus() {
        return imageStoragePort.getAll();
    }

    public Integer getGenerationId() {
        UUID uuid = UUID.randomUUID();
        return (int) (uuid.getMostSignificantBits() & 0xFFFFFFFFL);
    }

    private Project myProjectEntity(Integer id) {
        ProfileDTO profile = requireMyProfile();
        Project project = projectRepository.findByProjectId(id)
                .orElseThrow(() -> new ApplicationException(ErrorCode.PROJECT_NOT_FOUND));
        if (profile.getId() == null || !profile.getId().equals(project.getIdProfile())) {
            throw new ApplicationException(ErrorCode.FORBIDDEN);
        }
        return project;
    }

    private ProfileDTO requireMyProfile() {
        ProfileDTO profile = profileLookupPort.getMyProfile();
        if (profile == null || profile.getId() == null) {
            throw new ApplicationException(ErrorCode.FORBIDDEN);
        }
        return profile;
    }

    private PageRequest pageRequest(Integer page, Integer size, String sort) {
        try {
            return PageRequest.resolve(page, size, sort, "createAt,desc", PROJECT_SORT_FIELDS);
        } catch (IllegalArgumentException exception) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST);
        }
    }

    private PageRequest profilePageRequest(Integer page, Integer size, String sort) {
        try {
            return PageRequest.resolve(page, size, sort, "createdAt,desc", PROFILE_SORT_FIELDS);
        } catch (IllegalArgumentException exception) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST);
        }
    }

    private PageResponse<ProjectDTO> mapProjects(PageResponse<Project> response) {
        return new PageResponse<>(
                response.items().stream().map(projectMapper::toDto).toList(),
                response.page(),
                response.size(),
                response.totalElements(),
                response.totalPages(),
                response.hasNext(),
                response.hasPrevious());
    }
}
