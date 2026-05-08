package com.javanc.profile.mapper;

import com.javanc.profile.dto.ProfileDTO;
import com.javanc.profile.form.ProfileMultipartForm;
import com.javanc.profile.model.Contact;
import com.javanc.profile.model.Profile;
import com.javanc.profile.model.TypeProfile;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

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
    void rejectsLowercaseTypeProfileLikeSpringValueOf() {
        assertThrows(IllegalArgumentException.class, () -> mapper.toTypeProfile("java"));
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
