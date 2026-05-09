package com.javanc.manager.application.port;

import com.javanc.manager.application.dto.MessageDTO;

public interface NotificationPort {
    void create(MessageDTO messageDTO);
}
