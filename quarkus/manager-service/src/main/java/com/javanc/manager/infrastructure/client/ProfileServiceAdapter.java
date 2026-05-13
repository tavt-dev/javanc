package com.javanc.manager.infrastructure.client;

import com.javanc.manager.application.dto.ApiResponse;
import com.javanc.manager.application.dto.ProfileDTO;
import com.javanc.manager.application.port.ProfileLookupPort;
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
    public ProfileDTO findProfileById(Integer id) {
        ApiResponse<ProfileDTO> response = profileClient.getProfileById(id);
        return response == null ? null : response.data;
    }

    @Override
    public ProfileDTO myProfile() {
        ApiResponse<ProfileDTO> response = profileClient.getMyProfile();
        return response == null ? null : response.data;
    }
}
