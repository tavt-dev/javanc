package com.javanc.profile.interfaces.rest.resource;

import com.javanc.profile.application.exception.ApplicationException;
import com.javanc.profile.application.exception.ErrorCode;
import com.javanc.profile.application.port.ImageStoragePort;
import com.javanc.profile.application.port.UserLookupPort;
import com.javanc.profile.application.security.CurrentUser;
import com.javanc.profile.application.security.ProfileAuthService;
import com.javanc.profile.domain.model.Profile;
import com.javanc.profile.domain.model.ProfileStatus;
import com.javanc.profile.domain.model.TypeProfile;
import com.javanc.profile.domain.repository.ProfileRepository;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Alternative;
import org.jboss.resteasy.reactive.multipart.FileUpload;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;

@QuarkusTest
class ProfileResourceTest {

    @BeforeEach
    void reset() {
        TestProfileRepository.profiles.clear();
        TestProfileRepository.nextId = 100;
        TestImageStoragePort.url = "https://cdn.example/avatar.png";
    }

    @Test
    void protectedEndpointsRequireActiveBearerToken() {
        given()
                .when().get("/profiles/me")
                .then()
                .statusCode(401)
                .body("success", equalTo(false));

        given()
                .header("Authorization", "Bearer inactive-token")
                .when().get("/profiles/me")
                .then()
                .statusCode(401)
                .body("success", equalTo(false));
    }

    @Test
    void createGetAndUpdateCurrentProfile() {
        given()
                .header("Authorization", "Bearer user-token")
                .contentType("application/json")
                .body("{\"title\":\"Java Engineer\",\"typeProfile\":\"java\",\"objective\":\"Build systems\"}")
                .when().post("/profiles/me")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("data.id", equalTo(100))
                .body("data.idUser", equalTo(5))
                .body("data.typeProfile", equalTo("JAVA"))
                .body("data.createdAt", notNullValue());

        given()
                .header("Authorization", "Bearer user-token")
                .when().get("/profiles/me")
                .then()
                .statusCode(200)
                .body("data.title", equalTo("Java Engineer"));

        given()
                .header("Authorization", "Bearer user-token")
                .contentType("application/json")
                .body("{\"title\":\"Senior Java Engineer\"}")
                .when().patch("/profiles/me")
                .then()
                .statusCode(200)
                .body("data.title", equalTo("Senior Java Engineer"));
    }

    @Test
    void duplicateCreateAndInvalidBodyReturnCorrectErrors() {
        TestProfileRepository.seed(profile(44, 5, TypeProfile.JAVA, ProfileStatus.ACTIVE));

        given()
                .header("Authorization", "Bearer user-token")
                .contentType("application/json")
                .body("{\"title\":\"Java Engineer\",\"typeProfile\":\"JAVA\"}")
                .when().post("/profiles/me")
                .then()
                .statusCode(409)
                .body("success", equalTo(false));

        given()
                .header("Authorization", "Bearer admin-token")
                .contentType("application/json")
                .body("{\"title\":\" \",\"typeProfile\":\"JAVA\"}")
                .when().post("/profiles/me")
                .then()
                .statusCode(400)
                .body("success", equalTo(false));
    }

    @Test
    void selfAndAdminCanReadByUserButOtherUsersCannot() {
        TestProfileRepository.seed(profile(44, 5, TypeProfile.JAVA, ProfileStatus.ACTIVE));

        given()
                .header("Authorization", "Bearer user-token")
                .when().get("/profiles/by-user/5")
                .then()
                .statusCode(200)
                .body("data.id", equalTo(44));

        given()
                .header("Authorization", "Bearer other-user-token")
                .when().get("/profiles/by-user/5")
                .then()
                .statusCode(403);

        given()
                .header("Authorization", "Bearer admin-token")
                .when().get("/profiles/by-user/5")
                .then()
                .statusCode(200)
                .body("data.id", equalTo(44));
    }

    @Test
    void searchAndBatchUseNewRoutesAndRoleRules() {
        TestProfileRepository.seed(profile(44, 5, TypeProfile.JAVA, ProfileStatus.ACTIVE));
        TestProfileRepository.seed(profile(45, 6, TypeProfile.PYTHON, ProfileStatus.ACTIVE));

        given()
                .header("Authorization", "Bearer user-token")
                .queryParam("type", "JAVA")
                .queryParam("page", 0)
                .queryParam("size", 20)
                .when().get("/profiles")
                .then()
                .statusCode(200)
                .body("data.size()", equalTo(1))
                .body("data[0].id", equalTo(44));

        given()
                .header("Authorization", "Bearer user-token")
                .queryParam("ids", List.of(44, 45))
                .when().get("/profiles/batch")
                .then()
                .statusCode(403);

        given()
                .header("Authorization", "Bearer manager-token")
                .queryParam("ids", List.of(44, 45))
                .when().get("/profiles/batch")
                .then()
                .statusCode(200)
                .body("data.size()", equalTo(2));
    }

    @Test
    void avatarUploadStoresImageUrl() throws Exception {
        TestProfileRepository.seed(profile(44, 5, TypeProfile.JAVA, ProfileStatus.ACTIVE));
        File image = File.createTempFile("avatar", ".png");
        Files.writeString(image.toPath(), "image");

        given()
                .header("Authorization", "Bearer user-token")
                .multiPart("image", image, "image/png")
                .when().post("/profiles/me/avatar")
                .then()
                .statusCode(200)
                .body("data.url", equalTo("https://cdn.example/avatar.png"));
    }

    @Test
    void legacyRoutesAreRemoved() {
        given().header("Authorization", "Bearer user-token").when().get("/profile/user/getAll").then().statusCode(404);
        given().header("Authorization", "Bearer user-token").when().post("/profile/user/save").then().statusCode(404);
    }

    private static Profile profile(int id, int userId, TypeProfile type, ProfileStatus status) {
        Profile profile = new Profile();
        profile.setId(id);
        profile.setIdUser(userId);
        profile.setTitle("Profile " + id);
        profile.setTypeProfile(type);
        profile.setStatus(status);
        return profile;
    }

    @Alternative
    @Priority(1)
    @ApplicationScoped
    public static class TestProfileAuthService extends ProfileAuthService {
        public TestProfileAuthService() {
            super(null);
        }

        @Override
        public CurrentUser authenticate(String authorizationHeader) {
            if (authorizationHeader == null || authorizationHeader.isBlank()) {
                throw new ApplicationException(ErrorCode.UNAUTHORIZED);
            }
            return switch (authorizationHeader.replace("Bearer ", "")) {
                case "user-token" -> new CurrentUser(5, "user@example.test", "user");
                case "other-user-token" -> new CurrentUser(9, "other@example.test", "user");
                case "admin-token" -> new CurrentUser(1, "admin@example.test", "admin");
                case "manager-token" -> new CurrentUser(2, "manager@example.test", "manager");
                default -> throw new ApplicationException(ErrorCode.UNAUTHORIZED);
            };
        }
    }

    @Alternative
    @Priority(1)
    @ApplicationScoped
    public static class TestProfileRepository implements ProfileRepository {
        private static final List<Profile> profiles = new ArrayList<>();
        private static int nextId = 100;

        static void seed(Profile profile) {
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
            return profiles.stream().filter(profile -> profile.getId().equals(id)
                    && profile.getStatus() != ProfileStatus.DELETED).findFirst();
        }

        @Override
        public Optional<Profile> findByUserId(Integer idUser) {
            return findAllByUserId(idUser).stream().findFirst();
        }

        @Override
        public List<Profile> findAllByUserId(Integer idUser) {
            return profiles.stream().filter(profile -> profile.getIdUser().equals(idUser)
                    && profile.getStatus() != ProfileStatus.DELETED).toList();
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
            return search(typeProfile, null, 0, 20);
        }

        @Override
        public List<Profile> findAllLimited() {
            return search(null, null, 0, 20);
        }

        @Override
        public List<Profile> findByTitleRegex(String title) {
            return search(null, title, 0, 20);
        }

        @Override
        public List<Profile> search(TypeProfile typeProfile, String title, int page, int size) {
            return profiles.stream()
                    .filter(profile -> profile.getStatus() != ProfileStatus.DELETED)
                    .filter(profile -> typeProfile == null || profile.getTypeProfile() == typeProfile)
                    .filter(profile -> title == null || profile.getTitle().contains(title))
                    .skip((long) page * size)
                    .limit(size)
                    .toList();
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

    @Alternative
    @Priority(1)
    @ApplicationScoped
    public static class TestImageStoragePort implements ImageStoragePort {
        private static String url;

        @Override
        public String uploadForSave(FileUpload imageFile) {
            return url;
        }

        @Override
        public String uploadForUpdate(FileUpload imageFile) {
            return url;
        }
    }

    @Alternative
    @Priority(1)
    @ApplicationScoped
    public static class TestUserLookupPort implements UserLookupPort {
        @Override
        public boolean checkUserId(Integer id) {
            return true;
        }
    }
}
