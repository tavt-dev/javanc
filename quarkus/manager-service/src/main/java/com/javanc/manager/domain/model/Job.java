package com.javanc.manager.domain.model;

import io.quarkus.mongodb.panache.common.MongoEntity;
import org.bson.codecs.pojo.annotations.BsonId;

import java.util.List;

@MongoEntity(collection = "job")
public class Job {
    @BsonId
    public Integer id;
    public String title;
    public String description;
    public TypeJob typeJob;
    public Integer size;
    public List<Integer> idProfiePending;
    public List<Integer> idProfile;
    public Integer idCompany;
}
