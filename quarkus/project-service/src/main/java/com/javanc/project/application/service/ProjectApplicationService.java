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
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.PersistenceException;
import jakarta.transaction.Transactional;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class ProjectApplicationService {

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

    public List<ProfileDTO> getAllProfiles() {
        return profileLookupPort.getAllProfiles();
    }

    public List<ProjectDTO> getProjectByIdProfile(Integer idProfile) {
        try {
            return projectRepository.findByIdProfile(idProfile).stream()
                    .map(projectMapper::toDto)
                    .toList();
        } catch (PersistenceException exception) {
            throw new ApplicationException(ErrorCode.DATABASE_ACCESS_ERROR, exception);
        }
    }

    public List<ProjectDTO> getMyProjects() {
        ProfileDTO profile = requireMyProfile();
        return getProjectByIdProfile(profile.getId());
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
}
