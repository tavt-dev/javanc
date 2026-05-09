package com.javanc.image.domain.repository;

import com.javanc.image.domain.model.Image;

import java.util.Optional;

public interface ImageRepository {

    Image save(Image image);

    Optional<Image> findByImageId(Integer id);
}
