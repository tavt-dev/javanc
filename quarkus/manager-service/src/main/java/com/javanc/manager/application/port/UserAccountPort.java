package com.javanc.manager.application.port;

import com.javanc.manager.application.dto.AuthenticationRequest;

public interface UserAccountPort {
    Integer createAccount(AuthenticationRequest authenticationRequest);
}
