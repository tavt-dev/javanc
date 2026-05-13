package com.javanc.manager.application.port;

import com.javanc.manager.application.dto.ProfileDTO;

public interface ProfileLookupPort {
    ProfileDTO findProfileById(Integer id);

    ProfileDTO myProfile();
}
