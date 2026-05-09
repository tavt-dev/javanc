package com.javanc.image.domain.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class ImageIdGeneratorTest {

    @Test
    void nextIdReturnsIntegerCompatibleWithCurrentContract() {
        assertNotNull(new ImageIdGenerator().nextId());
    }
}
