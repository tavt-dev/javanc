package com.javanc.project.application.port;

import com.javanc.project.application.dto.ProfileDTO;

import java.util.List;

public interface ProfileLookupPort {

    List<ProfileDTO> getAllProfiles();
}
