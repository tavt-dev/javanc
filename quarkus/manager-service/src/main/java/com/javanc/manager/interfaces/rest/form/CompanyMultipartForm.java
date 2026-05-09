package com.javanc.manager.interfaces.rest.form;

import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.util.List;

public class CompanyMultipartForm {
    @RestForm("id")
    public Integer id;
    @RestForm("name")
    public String name;
    @RestForm("type")
    public String type;
    @RestForm("description")
    public String description;
    @RestForm("street")
    public String street;
    @RestForm("email")
    public String email;
    @RestForm("phone")
    public String phone;
    @RestForm("city")
    public String city;
    @RestForm("country")
    public String country;
    @RestForm("idManager")
    public Integer idManager;
    @RestForm("idHR")
    public List<Integer> idHR;
    @RestForm("idJobs")
    public List<Integer> idJobs;
    @RestForm("image")
    public FileUpload image;
}
