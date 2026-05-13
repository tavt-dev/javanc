package com.javanc.project.infrastructure.client;

import com.javanc.project.application.dto.ApiResponse;
import com.javanc.project.application.dto.ProfileDTO;
import com.javanc.project.application.port.ProfileLookupPort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.rest.client.inject.RestClient;

import java.util.List;

@ApplicationScoped
public class ProfileServiceAdapter implements ProfileLookupPort {

    private final ProfileClient profileClient;

    @Inject
    public ProfileServiceAdapter(@RestClient ProfileClient profileClient) {
        this.profileClient = profileClient;
    }

    @Override
    public List<ProfileDTO> getAllProfiles() {
        ApiResponse<List<ProfileDTO>> response = profileClient.getAll();
        return response.getData();
    }

    @Override
    public ProfileDTO getMyProfile() {
        ApiResponse<ProfileDTO> response = profileClient.me();
        return response.getData();
    }
}
