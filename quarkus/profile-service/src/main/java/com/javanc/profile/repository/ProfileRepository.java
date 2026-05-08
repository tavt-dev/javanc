package com.javanc.profile.repository;

import com.javanc.profile.model.Profile;
import com.javanc.profile.model.TypeProfile;
import com.mongodb.client.model.Filters;
import io.quarkus.mongodb.panache.PanacheMongoRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class ProfileRepository implements PanacheMongoRepositoryBase<Profile, Integer> {

    private static final int DEFAULT_LIMIT = 20;

    public List<Profile> findByType(TypeProfile typeProfile) {
        return find("typeProfile", typeProfile).page(0, DEFAULT_LIMIT).list();
    }

    public List<Profile> findAllLimited() {
        return findAll().page(0, DEFAULT_LIMIT).list();
    }

    public List<Profile> findByTitleRegex(String title) {
        return mongoCollection().find(Filters.regex("title", title)).limit(DEFAULT_LIMIT)
                .into(new ArrayList<>());
    }

    public Profile findByIdUser(Integer idUser) {
        return find("idUser", idUser).firstResult();
    }

    public List<Profile> findByIdIn(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return mongoCollection().find(Filters.in("_id", ids)).into(new ArrayList<>());
    }
}
