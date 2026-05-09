package com.javanc.notification.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @Column(name = "id")
    private Integer id;

    @Column(name = "message")
    private String message;

    @Column(name = "create_at")
    private LocalDateTime createAt;

    @Column(name = "id_user")
    private Integer idUser;

    @Column(name = "url")
    private String url;

    @Column(name = "is_read")
    private boolean read;

    public Notification() {
    }

    public Notification(Integer id, String message, LocalDateTime createAt, Integer idUser, String url, boolean read) {
        this.id = id;
        this.message = message;
        this.createAt = createAt;
        this.idUser = idUser;
        this.url = url;
        this.read = read;
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

    public Integer getIdUser() {
        return idUser;
    }

    public void setIdUser(Integer idUser) {
        this.idUser = idUser;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }

    public void markRead() {
        this.read = true;
    }
}
