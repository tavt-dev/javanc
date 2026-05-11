package com.javanc.profile.application.mapper;

import com.javanc.profile.domain.model.Contact;
import com.javanc.profile.domain.model.Profile;
import com.javanc.profile.domain.model.TypeProfile;
import com.javanc.profile.interfaces.rest.dto.ProfileDTO;
import com.javanc.profile.interfaces.rest.form.ProfileMultipartForm;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ProfileMapper {

    public ProfileDTO toDto(Profile profile) {
        if (profile == null) {
            return null;
        }
        ProfileDTO dto = new ProfileDTO();
        dto.setId(profile.getId());
        dto.setObjective(profile.getObjective());
        dto.setEducation(profile.getEducation());
        dto.setWorkExperience(profile.getWorkExperience());
        dto.setSkills(profile.getSkills());
        dto.setContact(profile.getContact());
        dto.setTypeProfile(profile.getTypeProfile() == null ? null : profile.getTypeProfile().name());
        dto.setIdUser(profile.getIdUser());
        dto.setUrl(profile.getUrl());
        dto.setTitle(profile.getTitle());
        dto.setStatus(profile.getStatus() == null ? null : profile.getStatus().name());
        dto.setCreatedAt(profile.getCreatedAt());
        dto.setUpdatedAt(profile.getUpdatedAt());
        return dto;
    }

    public Profile toModel(ProfileDTO dto) {
        if (dto == null) {
            return null;
        }
        Profile profile = new Profile();
        profile.setId(dto.getId());
        profile.setObjective(dto.getObjective());
        profile.setEducation(dto.getEducation());
        profile.setWorkExperience(dto.getWorkExperience());
        profile.setSkills(dto.getSkills());
        profile.setContact(dto.getContact());
        profile.setTypeProfile(toTypeProfile(dto.getTypeProfile()));
        profile.setIdUser(dto.getIdUser());
        profile.setUrl(dto.getUrl());
        profile.setTitle(dto.getTitle());
        profile.setCreatedAt(dto.getCreatedAt());
        profile.setUpdatedAt(dto.getUpdatedAt());
        return profile;
    }

    public ProfileDTO toDto(ProfileMultipartForm form) {
        if (form == null) {
            return null;
        }
        ProfileDTO dto = new ProfileDTO();
        dto.setId(form.getId());
        dto.setObjective(form.getObjective());
        dto.setEducation(form.getEducation());
        dto.setWorkExperience(form.getWorkExperience());
        dto.setSkills(form.getSkills());
        dto.setTypeProfile(form.getTypeProfile());
        dto.setIdUser(form.getIdUser());
        dto.setUrl(form.getUrl());
        dto.setTitle(form.getTitle());
        dto.setContact(toContact(form));
        return dto;
    }

    public TypeProfile toTypeProfile(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return TypeProfile.valueOf(value.trim().toUpperCase());
    }

    private Contact toContact(ProfileMultipartForm form) {
        if (form.getContactId() == null && isBlank(form.getContactAddress()) && isBlank(form.getContactPhone())
                && isBlank(form.getContactEmail())) {
            return null;
        }
        return new Contact(form.getContactId(), form.getContactAddress(), form.getContactPhone(),
                form.getContactEmail());
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
