package com.javanc.manager.domain.model;

import io.quarkus.mongodb.panache.common.MongoEntity;
import org.bson.codecs.pojo.annotations.BsonId;

import java.util.List;

@MongoEntity(collection = "company")
public class Company {
    @BsonId
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
    public List<Integer> idHr;
    public List<Integer> idJobs;
}
