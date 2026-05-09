package com.javanc.notification.interfaces.rest.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

public class NotificationDTO {

    private Integer id;
    private String message;
    private LocalDateTime createAt;
    private String url;
    private boolean read;
    private Integer idUser;

    public NotificationDTO() {
    }

    public NotificationDTO(Integer id, String message, LocalDateTime createAt, String url, boolean read,
            Integer idUser) {
        this.id = id;
        this.message = message;
        this.createAt = createAt;
        this.url = url;
        this.read = read;
        this.idUser = idUser;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getCreateAt() {
        return createAt;
    }

    public void setCreateAt(LocalDateTime createAt) {
        this.createAt = createAt;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    @JsonProperty("read")
    public boolean isRead() {
        return read;
    }

    @JsonProperty("read")
    @JsonAlias("isRead")
    public void setRead(boolean read) {
        this.read = read;
    }

    public Integer getIdUser() {
        return idUser;
    }

    public void setIdUser(Integer idUser) {
        this.idUser = idUser;
    }
}
