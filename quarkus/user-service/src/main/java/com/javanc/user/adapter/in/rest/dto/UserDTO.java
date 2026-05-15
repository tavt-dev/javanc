package com.javanc.user.adapter.in.rest.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserDTO {

    private Integer id;
    private String name;
    private String email;
    private String password;
    private String idEmployee;
    private String role;
    private String status;
    private String avatarUrl;
    private String provider;

    @JsonProperty("active")
    @JsonAlias("isActive")
    private boolean active;

    public UserDTO() {
    }

    public UserDTO(Integer id, String name, String email, String password, String idEmployee, String role,
            boolean active, String status) {
        this(id, name, email, password, idEmployee, role, active, status, null, null);
    }

    public UserDTO(Integer id, String name, String email, String password, String idEmployee, String role,
            boolean active, String status, String avatarUrl, String provider) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.idEmployee = idEmployee;
        this.role = role;
        this.active = active;
        this.status = status;
        this.avatarUrl = avatarUrl;
        this.provider = provider;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getIdEmployee() {
        return idEmployee;
    }

    public void setIdEmployee(String idEmployee) {
        this.idEmployee = idEmployee;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }
}
