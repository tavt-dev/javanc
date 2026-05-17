package com.javanc.profile.application.service;

import com.javanc.common.pagination.PageRequest;
import com.javanc.common.pagination.PageResponse;
import com.javanc.profile.application.exception.ApplicationException;
import com.javanc.profile.application.exception.ErrorCode;
import com.javanc.profile.application.mapper.ProfileMapper;
import com.javanc.profile.application.port.ImageStoragePort;
import com.javanc.profile.application.port.UserLookupPort;
import com.javanc.profile.application.security.CurrentUser;
import com.javanc.profile.domain.model.Contact;
import com.javanc.profile.domain.model.Profile;
import com.javanc.profile.domain.model.ProfileStatus;
import com.javanc.profile.domain.model.TypeProfile;
import com.javanc.profile.domain.repository.ProfileRepository;
import com.javanc.profile.interfaces.rest.dto.ProfileDTO;
import org.jboss.resteasy.reactive.multipart.FileUpload;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProfileApplicationServiceTest {

    private static final CurrentUser USER = new CurrentUser(5, "user@example.test", "user");
    private static final CurrentUser ADMIN = new CurrentUser(1, "admin@example.test", "admin");
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-05-11T00:00:00Z"), ZoneOffset.UTC);

    @Test
    void createProfileUsesCurrentUserAndGeneratedId() {
        FakeProfileRepository repository = new FakeProfileRepository();
        ProfileApplicationService service = newService(repository);

        ProfileDTO result = service.createProfile(USER, request("JAVA"));

        assertEquals(100, result.getId());
        assertEquals(5, result.getIdUser());
        assertEquals("ACTIVE", result.getStatus());
        assertEquals(Instant.parse("2026-05-11T00:00:00Z"), result.getCreatedAt());
    }

    @Test
    void createProfileRejectsDuplicateCurrentUserProfile() {
        FakeProfileRepository repository = new FakeProfileRepository();
        repository.seed(profile(10, 5, TypeProfile.JAVA, ProfileStatus.ACTIVE));
        ProfileApplicationService service = newService(repository);

        ApplicationException exception = assertThrows(ApplicationException.class,
                () -> service.createProfile(USER, request("JAVA")));

        assertEquals(ErrorCode.PROFILE_OWNER_CONFLICT, exception.getErrorCode());
    }

    @Test
    void updateProfileRejectsMissingCurrentUserProfile() {
        ProfileApplicationService service = newService(new FakeProfileRepository());

        ApplicationException exception = assertThrows(ApplicationException.class,
                () -> service.updateMyProfile(USER, request("JAVA")));

        assertEquals(ErrorCode.PROFILE_NOT_FOUND, exception.getErrorCode());
    }

    @Test
    void adminCanReadProfileByUserIdButUserCannotReadAnotherUserProfile() {
        FakeProfileRepository repository = new FakeProfileRepository();
        repository.seed(profile(10, 9, TypeProfile.JAVA, ProfileStatus.ACTIVE));
        ProfileApplicationService service = newService(repository);

        assertEquals(10, service.findByUserId(ADMIN, 9).getId());

        ApplicationException exception = assertThrows(ApplicationException.class,
                () -> service.findByUserId(USER, 9));
        assertEquals(ErrorCode.FORBIDDEN, exception.getErrorCode());
    }

    @Test
    void validatesTypeTitleContactEmailAndPhone() {
        ProfileApplicationService service = newService(new FakeProfileRepository());

        assertEquals(ErrorCode.BAD_REQUEST, assertThrows(ApplicationException.class,
                () -> service.createProfile(USER, request("unknown"))).getErrorCode());

        ProfileDTO missingTitle = request("JAVA");
        missingTitle.setTitle(" ");
        assertEquals(ErrorCode.BAD_REQUEST, assertThrows(ApplicationException.class,
                () -> service.createProfile(USER, missingTitle)).getErrorCode());

        ProfileDTO invalidContact = request("JAVA");
        invalidContact.setContact(new Contact(null, "Address", "abc", "bad-email"));
        assertEquals(ErrorCode.BAD_REQUEST, assertThrows(ApplicationException.class,
                () -> service.createProfile(USER, invalidContact)).getErrorCode());
    }

    @Test
    void avatarUploadStoresReturnedUrl() {
        FakeProfileRepository repository = new FakeProfileRepository();
        repository.seed(profile(10, 5, TypeProfile.JAVA, ProfileStatus.ACTIVE));
        FakeImageStoragePort imageStoragePort = new FakeImageStoragePort();
        imageStoragePort.url = "https://cdn.example/avatar.png";
        ProfileApplicationService service = new ProfileApplicationService(repository, new ProfileMapper(),
                imageStoragePort, new FakeUserLookupPort(), CLOCK);

        ProfileDTO result = service.updateMyAvatar(USER, new FakeFileUpload());

        assertEquals("https://cdn.example/avatar.png", result.getUrl());
    }

    @Test
    void duplicateLegacyProfilesForUserReturnConflict() {
        FakeProfileRepository repository = new FakeProfileRepository();
        repository.seed(profile(10, 5, TypeProfile.JAVA, ProfileStatus.ACTIVE));
        repository.seed(profile(11, 5, TypeProfile.PYTHON, ProfileStatus.ACTIVE));
        ProfileApplicationService service = newService(repository);

        ApplicationException exception = assertThrows(ApplicationException.class, () -> service.getMyProfile(USER));

        assertEquals(ErrorCode.PROFILE_OWNER_CONFLICT, exception.getErrorCode());
    }

    private ProfileApplicationService newService(FakeProfileRepository repository) {
        return new ProfileApplicationService(repository, new ProfileMapper(), new FakeImageStoragePort(),
                new FakeUserLookupPort(), CLOCK);
    }

    private ProfileDTO request(String typeProfile) {
        ProfileDTO request = new ProfileDTO();
        request.setObjective("objective");
        request.setEducation("education");
        request.setWorkExperience("work");
        request.setSkills("skills");
        request.setTypeProfile(typeProfile);
        request.setIdUser(999);
        request.setTitle("title");
        request.setContact(new Contact(null, "Address", "+84 123456789", "user@example.test"));
        return request;
    }

    private Profile profile(int id, int idUser, TypeProfile typeProfile, ProfileStatus status) {
        Profile profile = new Profile();
        profile.setId(id);
        profile.setIdUser(idUser);
        profile.setTitle("title-" + id);
        profile.setTypeProfile(typeProfile);
        profile.setStatus(status);
        return profile;
    }

    private static class FakeProfileRepository implements ProfileRepository {

        private final List<Profile> profiles = new ArrayList<>();
        private int nextId = 100;

        void seed(Profile profile) {
            profiles.add(profile);
        }

        @Override
        public void create(Profile profile) {
            profiles.add(profile);
        }

        @Override
        public void replace(Profile profile) {
            profiles.removeIf(existing -> existing.getId().equals(profile.getId()));
            profiles.add(profile);
        }

        @Override
        public void delete(Profile profile) {
            profile.setStatus(ProfileStatus.DELETED);
        }

        @Override
        public Integer nextProfileId() {
            return nextId++;
        }

        @Override
        public Optional<Profile> findByProfileId(Integer id) {
            return profiles.stream()
                    .filter(profile -> profile.getId().equals(id) && profile.getStatus() != ProfileStatus.DELETED)
                    .findFirst();
        }

        @Override
        public Optional<Profile> findByUserId(Integer idUser) {
            return findAllByUserId(idUser).stream().findFirst();
        }

        @Override
        public List<Profile> findAllByUserId(Integer idUser) {
            return profiles.stream()
                    .filter(profile -> profile.getIdUser().equals(idUser) && profile.getStatus() != ProfileStatus.DELETED)
                    .toList();
        }

        @Override
        public List<Profile> findAnyByUserId(Integer idUser) {
            return profiles.stream().filter(profile -> profile.getIdUser().equals(idUser)).toList();
        }

        @Override
        public boolean existsByUserId(Integer idUser) {
            return !findAllByUserId(idUser).isEmpty();
        }

        @Override
        public List<Profile> findByType(TypeProfile typeProfile) {
            return profiles.stream().filter(profile -> profile.getTypeProfile() == typeProfile).toList();
        }

        @Override
        public List<Profile> findAllLimited() {
            return List.copyOf(profiles);
        }

        @Override
        public List<Profile> findByTitleRegex(String title) {
            return profiles.stream().filter(profile -> profile.getTitle().contains(title)).toList();
        }

        @Override
        public PageResponse<Profile> search(TypeProfile typeProfile, String title, PageRequest pageRequest) {
            List<Profile> filtered = profiles.stream()
                    .filter(profile -> profile.getStatus() != ProfileStatus.DELETED)
                    .filter(profile -> typeProfile == null || profile.getTypeProfile() == typeProfile)
                    .filter(profile -> title == null || profile.getTitle().contains(title))
                    .toList();
            return PageResponse.of(filtered, pageRequest, filtered.size());
        }

        @Override
        public Profile findByIdUser(Integer idUser) {
            return findByUserId(idUser).orElse(null);
        }

        @Override
        public List<Profile> findByIdIn(List<Integer> ids) {
            return profiles.stream().filter(profile -> ids.contains(profile.getId())).toList();
        }
    }

    private static class FakeImageStoragePort implements ImageStoragePort {

        private String url = "uploaded-url";

        @Override
        public String uploadForSave(FileUpload imageFile) {
            return url;
        }

        @Override
        public String uploadForUpdate(FileUpload imageFile) {
            return url;
        }
    }

    private static class FakeUserLookupPort implements UserLookupPort {

        @Override
        public boolean checkUserId(Integer id) {
            return true;
        }
    }

    private static class FakeFileUpload implements FileUpload {
        @Override
        public String name() {
            return "image";
        }

        @Override
        public java.nio.file.Path uploadedFile() {
            return java.nio.file.Path.of("target/test-avatar.png");
        }

        @Override
        public java.nio.file.Path filePath() {
            return uploadedFile();
        }

        @Override
        public String fileName() {
            return "avatar.png";
        }

        @Override
        public long size() {
            return 1;
        }

        @Override
        public String contentType() {
            return "image/png";
        }

        @Override
        public String charSet() {
            return null;
        }

        @Override
        public jakarta.ws.rs.core.MultivaluedMap<String, String> getHeaders() {
            return new jakarta.ws.rs.core.MultivaluedHashMap<>();
        }
    }
}
