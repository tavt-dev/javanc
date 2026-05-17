package com.javanc.project.infrastructure.client;

import com.javanc.project.application.dto.ApiResponse;
import com.javanc.project.application.dto.ProfileDTO;
import com.javanc.project.application.port.ProfileLookupPort;
import com.javanc.common.pagination.PageResponse;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.rest.client.inject.RestClient;

@ApplicationScoped
public class ProfileServiceAdapter implements ProfileLookupPort {

    private final ProfileClient profileClient;

    @Inject
    public ProfileServiceAdapter(@RestClient ProfileClient profileClient) {
        this.profileClient = profileClient;
    }

    @Override
    public PageResponse<ProfileDTO> getAllProfiles(int page, int size, String sort) {
        ApiResponse<PageResponse<ProfileDTO>> response = profileClient.getAll(page, size, sort);
        return response.getData();
    }

    @Override
    public ProfileDTO getMyProfile() {
        ApiResponse<ProfileDTO> response = profileClient.me();
        return response.getData();
    }
}
