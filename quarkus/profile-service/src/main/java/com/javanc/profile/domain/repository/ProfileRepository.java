package com.javanc.profile.domain.repository;

import com.javanc.profile.domain.model.Profile;
import com.javanc.profile.domain.model.TypeProfile;

import java.util.List;
import java.util.Optional;

public interface ProfileRepository {

    void create(Profile profile);

    void replace(Profile profile);

    Optional<Profile> findByProfileId(Integer id);

    List<Profile> findByType(TypeProfile typeProfile);

    List<Profile> findAllLimited();

    List<Profile> findByTitleRegex(String title);

    Profile findByIdUser(Integer idUser);

    List<Profile> findByIdIn(List<Integer> ids);
}
