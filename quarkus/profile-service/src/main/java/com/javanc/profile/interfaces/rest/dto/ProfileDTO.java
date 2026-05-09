package com.javanc.profile.interfaces.rest.dto;

import com.javanc.profile.domain.model.Contact;

public class ProfileDTO {

    private Integer id;
    private String objective;
    private String education;
    private String workExperience;
    private String skills;
    private Contact contact;
    private String typeProfile;
    private Integer idUser;
    private String url;
    private String title;

    public ProfileDTO() {
    }

    public ProfileDTO(Integer id, String objective, String education, String workExperience, String skills,
            Contact contact, String typeProfile, Integer idUser, String url, String title) {
        this.id = id;
        this.objective = objective;
        this.education = education;
        this.workExperience = workExperience;
        this.skills = skills;
        this.contact = contact;
        this.typeProfile = typeProfile;
        this.idUser = idUser;
        this.url = url;
        this.title = title;
    }

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

    public Contact getContact() {
        return contact;
    }

    public void setContact(Contact contact) {
        this.contact = contact;
    }

    public String getTypeProfile() {
        return typeProfile;
    }

    public void setTypeProfile(String typeProfile) {
        this.typeProfile = typeProfile;
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }
}
