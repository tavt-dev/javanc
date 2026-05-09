package com.javanc.project.application.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

public class ProfileDTO {

    private Integer id;
    private String objective;
    private String education;
    private String workExperience;
    private String skills;
    private String typeProfile;
    private Integer userId;
    private String url;
    private Object imageFile;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getObjective() {
        return objective;
    }

    public void setObjective(String objective) {
        this.objective = objective;
    }

    public String getEducation() {
        return education;
    }

    public void setEducation(String education) {
        this.education = education;
    }

    public String getWorkExperience() {
        return workExperience;
    }

    public void setWorkExperience(String workExperience) {
        this.workExperience = workExperience;
    }

    public String getSkills() {
        return skills;
    }

    public void setSkills(String skills) {
        this.skills = skills;
    }

    public String getTypeProfile() {
        return typeProfile;
    }

    public void setTypeProfile(String typeProfile) {
        this.typeProfile = typeProfile;
    }

    @JsonProperty("userId")
    public Integer getUserId() {
        return userId;
    }

    @JsonProperty("userId")
    @JsonAlias("idUser")
    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public Object getImageFile() {
        return imageFile;
    }

    public void setImageFile(Object imageFile) {
        this.imageFile = imageFile;
    }
}
