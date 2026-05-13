package com.javanc.manager.application.dto;

import java.util.List;

public class CompanyDTO {
    public Integer id;
    public String name;
    public String type;
    public String description;
    public String street;
    public String email;
    public String phone;
    public String city;
    public String country;
    public String url;
    public Integer idManager;
    public List<Integer> idHR;
    public List<Integer> idJobs;
}
