package com.javanc.project.interfaces.rest.resource;

import com.javanc.project.application.dto.ApiResponse;
import com.javanc.project.application.dto.ImageDTO;
import com.javanc.project.application.dto.ProfileDTO;
import com.javanc.project.application.dto.ProjectDTO;
import com.javanc.project.application.service.ProjectApplicationService;
import com.javanc.project.interfaces.rest.form.ImageMultipartForm;
import jakarta.inject.Inject;
import jakarta.ws.rs.BeanParam;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/project")
@Produces(MediaType.APPLICATION_JSON)
public class ProjectResource {

    private final ProjectApplicationService projectService;

    @Inject
    public ProjectResource(ProjectApplicationService projectService) {
        this.projectService = projectService;
    }

    @POST
    @Path("/user/save")
    @Consumes(MediaType.APPLICATION_JSON)
    public ApiResponse<ProjectDTO> save(ProjectDTO projectDTO) {
        ProjectDTO savedProject = projectService.saveProject(projectDTO);
        return new ApiResponse<>(true, "Project saved successfully", savedProject);
    }

    @POST
    @Path("/user/update")
    @Consumes(MediaType.APPLICATION_JSON)
    public ApiResponse<ProjectDTO> update(ProjectDTO projectDTO) {
        ProjectDTO updatedProject = projectService.updateProject(projectDTO);
        return new ApiResponse<>(true, "Project updated successfully", updatedProject);
    }

    @GET
    @Path("/user/projects")
    public ApiResponse<List<ProjectDTO>> myProjects() {
        return new ApiResponse<>(true, "Projects fetched successfully", projectService.getMyProjects());
    }

    @GET
    @Path("/user/projects/{id}")
    public ApiResponse<ProjectDTO> myProject(@PathParam("id") Integer id) {
        return new ApiResponse<>(true, "Project fetched successfully", projectService.getMyProject(id));
    }

    @POST
    @Path("/user/projects")
    @Consumes(MediaType.APPLICATION_JSON)
    public ApiResponse<ProjectDTO> createMyProject(ProjectDTO projectDTO) {
        return new ApiResponse<>(true, "Project saved successfully", projectService.createMyProject(projectDTO));
    }

    @PATCH
    @Path("/user/projects/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    public ApiResponse<ProjectDTO> updateMyProject(@PathParam("id") Integer id, ProjectDTO projectDTO) {
        return new ApiResponse<>(true, "Project updated successfully", projectService.updateMyProject(id, projectDTO));
    }

    @DELETE
    @Path("/user/projects/{id}")
    public ApiResponse<Void> deleteMyProject(@PathParam("id") Integer id) {
        projectService.deleteMyProject(id);
        return new ApiResponse<>(true, "Project deleted successfully", null);
    }

    @GET
    @Path("/user/getProfile")
    public ApiResponse<List<ProfileDTO>> getProfile() {
        List<ProfileDTO> profiles = projectService.getAllProfiles();
        return new ApiResponse<>(true, "Profiles fetched successfully", profiles);
    }

    @GET
    @Path("/user/getProject")
    public ApiResponse<List<ProjectDTO>> getProjectByIdProfile(@QueryParam("id") Integer id) {
        List<ProjectDTO> projects = projectService.getProjectByIdProfile(id);
        return new ApiResponse<>(true, "Projects fetched successfully", projects);
    }

    @GET
    @Path("/user/get")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public ApiResponse<ImageDTO> get(@BeanParam ImageMultipartForm form) {
        ImageDTO image = projectService.saveImage(form.getImage());
        return new ApiResponse<>(true, "ok", image);
    }

    @GET
    @Path("/user/get1")
    public ApiResponse<String> get1() {
        return new ApiResponse<>(true, "ok", projectService.getImageCompatibilityStatus());
    }
}
