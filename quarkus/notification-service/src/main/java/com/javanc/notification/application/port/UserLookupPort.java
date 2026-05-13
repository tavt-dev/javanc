package com.javanc.notification.application.port;

import com.javanc.notification.interfaces.rest.dto.UserDTO;

public interface UserLookupPort {

    boolean checkUserId(Integer id);

    UserDTO getCurrentUser();
}
