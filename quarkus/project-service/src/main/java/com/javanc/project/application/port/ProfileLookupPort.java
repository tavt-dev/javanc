package com.javanc.project.application.port;

import com.javanc.project.application.dto.ProfileDTO;
import com.javanc.common.pagination.PageResponse;

public interface ProfileLookupPort {

    PageResponse<ProfileDTO> getAllProfiles(int page, int size, String sort);

    ProfileDTO getMyProfile();
}
