package com.javanc.manager.application.dto;

public class MessageDTO {
    public String message;
    public Integer id;

    public MessageDTO() {
    }

    public MessageDTO(String message, Integer id) {
        this.message = message;
        this.id = id;
    }
}
