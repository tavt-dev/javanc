package com.javanc.manager.application.port;

import com.javanc.manager.application.dto.MessageDTO;

public interface EmailPort {
    void send(MessageDTO messageDTO);
}
