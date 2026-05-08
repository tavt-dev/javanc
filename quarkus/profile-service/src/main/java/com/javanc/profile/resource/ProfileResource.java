package com.javanc.profile.resource;

import com.javanc.profile.dto.ApiResponse;
import com.javanc.profile.dto.ProfileDTO;
import com.javanc.profile.form.ProfileMultipartForm;
import com.javanc.profile.mapper.ProfileMapper;
import com.javanc.profile.model.TypeProfile;
import com.javanc.profile.service.ProfileApplicationService;
import jakarta.inject.Inject;
import jakarta.ws.rs.BeanParam;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/profile")
@Produces(MediaType.APPLICATION_JSON)
public class ProfileResource {

    private final ProfileApplicationService profileService;
    private final ProfileMapper profileMapper;

    @Inject
    public ProfileResource(ProfileApplicationService profileService, ProfileMapper profileMapper) {
        this.profileService = profileService;
        this.profileMapper = profileMapper;
    }

    @POST
    @Path("/user/save")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public ApiResponse<ProfileDTO> save(@BeanParam ProfileMultipartForm form) {
        ProfileDTO resultProfileDTO = profileService.saveProfile(profileMapper.toDto(form), form.getImage());
        return new ApiResponse<>(true, "Profile saved successfully", resultProfileDTO);
    }

    @POST
    @Path("/user/update")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public ApiResponse<ProfileDTO> update(@BeanParam ProfileMultipartForm form) {
        ProfileDTO resultProfileDTO = profileService.updateProfile(profileMapper.toDto(form), form.getImage());
        return new ApiResponse<>(true, "Profile update successfully", resultProfileDTO);
    }

    @GET
    @Path("/user/findProfileByType")
    public ApiResponse<List<ProfileDTO>> findProfilesByType(@QueryParam("typeProfile") String typeProfile) {
        List<ProfileDTO> resultProfiles = profileService.findProfilesByType(TypeProfile.valueOf(typeProfile));
        return new ApiResponse<>(true, "Find Profile By Type", resultProfiles);
    }

    @GET
    @Path("/user/getAll")
    public ApiResponse<List<ProfileDTO>> getAll() {
        List<ProfileDTO> resultProfiles = profileService.getAllProfile();
        return new ApiResponse<>(true, "Get all is successfully", resultProfiles);
    }

    @GET
    @Path("/user/findById")
    public ApiResponse<ProfileDTO> getProfileById(@QueryParam("id") Integer id) {
        ProfileDTO profileDTO = profileService.findById(id);
        return new ApiResponse<>(true, "Find by id is successfully", profileDTO);
    }

    @GET
    @Path("/user/findByUserId")
    public ApiResponse<ProfileDTO> findByUserId(@QueryParam("userId") Integer userId) {
        ProfileDTO resultProfiles = profileService.findByIdUser(userId);
        if (resultProfiles != null) {
            return new ApiResponse<>(true, "Find by user id is successfully", resultProfiles);
        }
        return new ApiResponse<>(false, "Profile not found", null);
    }

    @GET
    @Path("/user/findByTitle")
    public ApiResponse<List<ProfileDTO>> findByTitle(@QueryParam("title") String title) {
        List<ProfileDTO> resultProfiles = profileService.findByTitle(title);
        return new ApiResponse<>(true, "Find by title is successfully", resultProfiles);
    }

    @GET
    @Path("/user/checkIdProfile")
    public ApiResponse<String> checkIdProfile(@QueryParam("id") Integer id) {
        return new ApiResponse<>(true, "Check id profile", "true");
    }

    @GET
    @Path("/manager/getProfileByIdPendingJob")
    public ApiResponse<List<ProfileDTO>> getProfileByIdPendingJob(@QueryParam("ids") List<Integer> ids) {
        List<ProfileDTO> resultProfiles = profileService.findListProfileByIdPendingJob(ids);
        return new ApiResponse<>(true, "Profiles retrieved successfully by pending job id", resultProfiles);
    }
}
