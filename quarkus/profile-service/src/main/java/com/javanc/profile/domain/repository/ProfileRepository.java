package com.javanc.profile.domain.repository;

import com.javanc.profile.domain.model.Profile;
import com.javanc.profile.domain.model.TypeProfile;
import com.javanc.common.pagination.PageRequest;
import com.javanc.common.pagination.PageResponse;

import java.util.List;
import java.util.Optional;

public interface ProfileRepository {

    void create(Profile profile);

    void replace(Profile profile);

    void delete(Profile profile);

    Integer nextProfileId();

    Optional<Profile> findByProfileId(Integer id);

    Optional<Profile> findByUserId(Integer idUser);

    List<Profile> findAllByUserId(Integer idUser);

    List<Profile> findAnyByUserId(Integer idUser);

    boolean existsByUserId(Integer idUser);

    List<Profile> findByType(TypeProfile typeProfile);

    List<Profile> findAllLimited();

    List<Profile> findByTitleRegex(String title);

    PageResponse<Profile> search(TypeProfile typeProfile, String title, PageRequest pageRequest);

    Profile findByIdUser(Integer idUser);

    List<Profile> findByIdIn(List<Integer> ids);
}
