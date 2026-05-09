package com.javanc.user.domain.port;

import com.javanc.user.domain.model.UserId;

public interface IdGenerator {

    UserId nextUserId();
}
