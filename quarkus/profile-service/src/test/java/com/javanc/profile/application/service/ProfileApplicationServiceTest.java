package com.javanc.profile.application.service;

import com.javanc.profile.application.mapper.ProfileMapper;
import com.javanc.profile.application.port.ImageStoragePort;
import com.javanc.profile.application.port.UserLookupPort;
import com.javanc.profile.domain.model.Profile;
import com.javanc.profile.domain.model.TypeProfile;
import com.javanc.profile.domain.repository.ProfileRepository;
import com.javanc.profile.interfaces.rest.dto.ProfileDTO;
import org.jboss.resteasy.reactive.multipart.FileUpload;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProfileApplicationServiceTest {

    @Test
    void saveProfileWithoutImageCreatesManualIdAndEmptyUrl() {
        FakeProfileRepository repository = new FakeProfileRepository();
        ProfileApplicationService service = newService(repository);
        ProfileDTO request = request("JAVA");

        ProfileDTO result = service.saveProfile(request, null);

        assertNotNull(result.getId());
        assertEquals("", result.getUrl());
        assertEquals(TypeProfile.JAVA, repository.saved.getTypeProfile());
    }

    @Test
    void updateProfileWithoutImageKeepsCurrentEmptyUrlCompatibility() {
        FakeProfileRepository repository = new FakeProfileRepository();
        ProfileApplicationService service = newService(repository);
        ProfileDTO request = request("PYTHON");
        request.setId(44);

        ProfileDTO result = service.updateProfile(request, null);

        assertEquals(44, result.getId());
        assertEquals("", result.getUrl());
        assertEquals(TypeProfile.PYTHON, repository.saved.getTypeProfile());
    }

    @Test
    void findByUserIdReturnsNullWhenMissing() {
        FakeProfileRepository repository = new FakeProfileRepository();
        ProfileApplicationService service = newService(repository);

        assertNull(service.findByIdUser(123));
    }

    @Test
    void checkIdProfileUsesRepositoryExistence() {
        FakeProfileRepository repository = new FakeProfileRepository();
        Profile profile = new Profile();
        profile.setId(7);
        repository.saved = profile;

        ProfileApplicationService service = newService(repository);

        assertTrue(service.checkIdProfile(7).isCheck());
        assertFalse(service.checkIdProfile(8).isCheck());
    }

    private ProfileApplicationService newService(FakeProfileRepository repository) {
        return new ProfileApplicationService(repository, new ProfileMapper(), new FakeImageStoragePort(),
                new FakeUserLookupPort());
    }

    private ProfileDTO request(String typeProfile) {
        ProfileDTO request = new ProfileDTO();
        request.setObjective("objective");
        request.setEducation("education");
        request.setWorkExperience("work");
        request.setSkills("skills");
        request.setTypeProfile(typeProfile);
        request.setIdUser(5);
        request.setTitle("title");
        return request;
    }

    private static class FakeProfileRepository implements ProfileRepository {

        private Profile saved;

        @Override
        public void create(Profile entity) {
            saved = entity;
        }

        @Override
        public void replace(Profile entity) {
            saved = entity;
        }

        @Override
        public Optional<Profile> findByProfileId(Integer id) {
            if (saved != null && saved.getId().equals(id)) {
                return Optional.of(saved);
            }
            return Optional.empty();
        }

        @Override
        public Profile findByIdUser(Integer idUser) {
            if (saved != null && saved.getIdUser().equals(idUser)) {
                return saved;
            }
            return null;
        }

        @Override
        public List<Profile> findByType(TypeProfile typeProfile) {
            if (saved != null && saved.getTypeProfile() == typeProfile) {
                return List.of(saved);
            }
            return List.of();
        }

        @Override
        public List<Profile> findAllLimited() {
            return saved == null ? List.of() : List.of(saved);
        }

        @Override
        public List<Profile> findByTitleRegex(String title) {
            if (saved != null && saved.getTitle() != null && saved.getTitle().contains(title)) {
                return List.of(saved);
            }
            return List.of();
        }

        @Override
        public List<Profile> findByIdIn(List<Integer> ids) {
            List<Profile> profiles = new ArrayList<>();
            if (saved != null && ids.contains(saved.getId())) {
                profiles.add(saved);
            }
            return profiles;
        }
    }

    private static class FakeImageStoragePort implements ImageStoragePort {

        @Override
        public String uploadForSave(FileUpload imageFile) {
            return imageFile == null ? "" : "uploaded-url";
        }

        @Override
        public String uploadForUpdate(FileUpload imageFile) {
            return imageFile == null ? "" : "uploaded-url";
        }
    }

    private static class FakeUserLookupPort implements UserLookupPort {

        @Override
        public boolean checkUserId(Integer id) {
            return true;
        }
    }
}
