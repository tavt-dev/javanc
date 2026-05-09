package com.javanc.profile.infrastructure.persistence;

import com.javanc.profile.domain.model.Profile;
import com.javanc.profile.domain.model.TypeProfile;
import com.javanc.profile.domain.repository.ProfileRepository;
import com.mongodb.client.model.Filters;
import io.quarkus.mongodb.panache.PanacheMongoRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class ProfileMongoRepository implements ProfileRepository, PanacheMongoRepositoryBase<Profile, Integer> {

    private static final int DEFAULT_LIMIT = 20;

    @Override
    public void create(Profile profile) {
        persist(profile);
    }

    @Override
    public void replace(Profile profile) {
        update(profile);
    }

    @Override
    public Optional<Profile> findByProfileId(Integer id) {
        return findByIdOptional(id);
    }

    @Override
    public List<Profile> findByType(TypeProfile typeProfile) {
        return find("typeProfile", typeProfile).page(0, DEFAULT_LIMIT).list();
    }

    @Override
    public List<Profile> findAllLimited() {
        return findAll().page(0, DEFAULT_LIMIT).list();
    }

    @Override
    public List<Profile> findByTitleRegex(String title) {
        return mongoCollection().find(Filters.regex("title", title)).limit(DEFAULT_LIMIT)
                .into(new ArrayList<>());
    }

    @Override
    public Profile findByIdUser(Integer idUser) {
        return find("idUser", idUser).firstResult();
    }

    @Override
    public List<Profile> findByIdIn(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return mongoCollection().find(Filters.in("_id", ids)).into(new ArrayList<>());
    }
}
