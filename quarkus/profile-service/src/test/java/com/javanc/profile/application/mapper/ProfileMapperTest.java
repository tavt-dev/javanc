package com.javanc.profile.application.mapper;

import com.javanc.profile.domain.model.Contact;
import com.javanc.profile.domain.model.Profile;
import com.javanc.profile.domain.model.TypeProfile;
import com.javanc.profile.interfaces.rest.dto.ProfileDTO;
import com.javanc.profile.interfaces.rest.form.ProfileMultipartForm;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ProfileMapperTest {

    private final ProfileMapper mapper = new ProfileMapper();

    @Test
    void mapsProfileToDtoWithEnumName() {
        Profile profile = new Profile();
        profile.setId(1);
        profile.setTypeProfile(TypeProfile.JAVA);
        profile.setContact(new Contact(2, "address", "phone", "email"));

        ProfileDTO dto = mapper.toDto(profile);

        assertEquals(1, dto.getId());
        assertEquals("JAVA", dto.getTypeProfile());
        assertEquals("address", dto.getContact().getAddress());
    }

    @Test
    void mapsDtoToProfileWithEnumValueOfCompatibility() {
        ProfileDTO dto = new ProfileDTO();
        dto.setTypeProfile("PYTHON");

        Profile profile = mapper.toModel(dto);

        assertEquals(TypeProfile.PYTHON, profile.getTypeProfile());
    }

    @Test
    void mapsNullOrBlankTypeProfileToNull() {
        assertNull(mapper.toTypeProfile(null));
        assertNull(mapper.toTypeProfile(" "));
    }

    @Test
    void mapsTypeProfileCaseInsensitive() {
        assertEquals(TypeProfile.JAVA, mapper.toTypeProfile("java"));
    }

    @Test
    void mapsMultipartContactDotFields() {
        ProfileMultipartForm form = new ProfileMultipartForm();
        form.setContactId(5);
        form.setContactAddress("A");
        form.setContactPhone("P");
        form.setContactEmail("E");

        ProfileDTO dto = mapper.toDto(form);

        assertEquals(5, dto.getContact().getId());
        assertEquals("A", dto.getContact().getAddress());
        assertEquals("P", dto.getContact().getPhone());
        assertEquals("E", dto.getContact().getEmail());
    }
}
