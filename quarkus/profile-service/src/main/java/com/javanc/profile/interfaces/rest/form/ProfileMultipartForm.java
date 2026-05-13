package com.javanc.profile.interfaces.rest.form;

import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

public class ProfileMultipartForm {

    @RestForm("id")
    private Integer id;

    @RestForm("objective")
    private String objective;

    @RestForm("education")
    private String education;

    @RestForm("workExperience")
    private String workExperience;

    @RestForm("skills")
    private String skills;

    @RestForm("name")
    private String name;

    @RestForm("typeProfile")
    private String typeProfile;

    @RestForm("idUser")
    private Integer idUser;

    @RestForm("url")
    private String url;

    @RestForm("title")
    private String title;

    @RestForm("contact.id")
    private Integer contactId;

    @RestForm("contact.address")
    private String contactAddress;

    @RestForm("contact.phone")
    private String contactPhone;

    @RestForm("contact.email")
    private String contactEmail;

    @RestForm("image")
    private FileUpload image;

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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

    public Integer getContactId() {
        return contactId;
    }

    public void setContactId(Integer contactId) {
        this.contactId = contactId;
    }

    public String getContactAddress() {
        return contactAddress;
    }

    public void setContactAddress(String contactAddress) {
        this.contactAddress = contactAddress;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public FileUpload getImage() {
        return image;
    }

    public void setImage(FileUpload image) {
        this.image = image;
    }
}
