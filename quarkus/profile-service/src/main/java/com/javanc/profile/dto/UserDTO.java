package com.javanc.profile.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

public class UserDTO {

    private Integer id;
    private String name;
    private String email;
    private String password;
    private String idEmployee;
    private String role;

    @JsonProperty("active")
    @JsonAlias("isActive")
    private boolean active;

    public UserDTO() {
    }

    public UserDTO(Integer id, String name, String email, String password, String idEmployee, String role,
            boolean active) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.idEmployee = idEmployee;
        this.role = role;
        this.active = active;
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

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
