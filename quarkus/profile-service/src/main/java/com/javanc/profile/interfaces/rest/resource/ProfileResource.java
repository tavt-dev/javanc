package com.javanc.profile.interfaces.rest.resource;

import com.javanc.profile.application.security.CurrentUser;
import com.javanc.profile.application.security.ProfileAuthService;
import com.javanc.profile.application.service.ProfileApplicationService;
import com.javanc.profile.interfaces.rest.dto.ApiResponse;
import com.javanc.profile.interfaces.rest.dto.ProfileDTO;
import com.javanc.profile.interfaces.rest.form.ProfileMultipartForm;
import jakarta.inject.Inject;
import jakarta.ws.rs.BeanParam;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/profiles")
@Produces(MediaType.APPLICATION_JSON)
public class ProfileResource {

    private final ProfileApplicationService profileService;
    private final ProfileAuthService authService;

    @Inject
    public ProfileResource(ProfileApplicationService profileService, ProfileAuthService authService) {
        this.profileService = profileService;
        this.authService = authService;
    }

    @GET
    @Path("/me")
    public ApiResponse<ProfileDTO> me(@HeaderParam(HttpHeaders.AUTHORIZATION) String authorizationHeader) {
        CurrentUser actor = authService.authenticate(authorizationHeader);
        return new ApiResponse<>(true, "Current profile retrieved successfully", profileService.getMyProfile(actor));
    }

    @POST
    @Path("/me")
    @Consumes(MediaType.APPLICATION_JSON)
    public ApiResponse<ProfileDTO> createMe(@HeaderParam(HttpHeaders.AUTHORIZATION) String authorizationHeader,
            ProfileDTO request) {
        CurrentUser actor = authService.authenticate(authorizationHeader);
        return new ApiResponse<>(true, "Profile created successfully", profileService.createProfile(actor, request));
    }

    @PATCH
    @Path("/me")
    @Consumes(MediaType.APPLICATION_JSON)
    public ApiResponse<ProfileDTO> updateMe(@HeaderParam(HttpHeaders.AUTHORIZATION) String authorizationHeader,
            ProfileDTO request) {
        CurrentUser actor = authService.authenticate(authorizationHeader);
        return new ApiResponse<>(true, "Profile updated successfully", profileService.updateMyProfile(actor, request));
    }

    @POST
    @Path("/me/avatar")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public ApiResponse<ProfileDTO> updateAvatar(@HeaderParam(HttpHeaders.AUTHORIZATION) String authorizationHeader,
            @BeanParam ProfileMultipartForm form) {
        CurrentUser actor = authService.authenticate(authorizationHeader);
        return new ApiResponse<>(true, "Profile avatar updated successfully",
                profileService.updateMyAvatar(actor, form == null ? null : form.getImage()));
    }

    @DELETE
    @Path("/me")
    public ApiResponse<Void> deleteMe(@HeaderParam(HttpHeaders.AUTHORIZATION) String authorizationHeader) {
        CurrentUser actor = authService.authenticate(authorizationHeader);
        profileService.deleteMyProfile(actor);
        return new ApiResponse<>(true, "Profile deleted successfully", null);
    }

    @GET
    public ApiResponse<List<ProfileDTO>> search(@QueryParam("type") String type, @QueryParam("title") String title,
            @QueryParam("page") Integer page,
            @QueryParam("size") Integer size,
            @QueryParam("sort") String sort) {
        return new ApiResponse<>(true, "Profiles retrieved successfully",
                profileService.search(type, title, page, size, sort));
    }

    @GET
    @Path("/by-user/{userId}")
    public ApiResponse<ProfileDTO> findByUserId(@PathParam("userId") Integer userId) {
        return new ApiResponse<>(true, "Profile retrieved successfully", profileService.findByUserId(userId));
    }

    @GET
    @Path("/batch")
    public ApiResponse<List<ProfileDTO>> batch(@HeaderParam(HttpHeaders.AUTHORIZATION) String authorizationHeader,
            @QueryParam("ids") List<Integer> ids) {
        CurrentUser actor = authService.authenticate(authorizationHeader);
        return new ApiResponse<>(true, "Profiles retrieved successfully", profileService.findByIds(actor, ids));
    }

    @GET
    @Path("/{id}")
    public ApiResponse<ProfileDTO> findById(@PathParam("id") Integer id) {
        return new ApiResponse<>(true, "Profile retrieved successfully", profileService.findById(id));
    }
}
