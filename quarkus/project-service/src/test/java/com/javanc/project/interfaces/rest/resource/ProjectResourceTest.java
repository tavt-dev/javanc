package com.javanc.project.interfaces.rest.resource;

import com.javanc.project.application.dto.ImageDTO;
import com.javanc.project.application.dto.ProfileDTO;
import com.javanc.project.application.port.ImageStoragePort;
import com.javanc.project.application.port.ProfileLookupPort;
import com.javanc.project.infrastructure.persistence.ProjectJpaRepository;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@QuarkusTest
class ProjectResourceTest {

    @Inject
    ProjectJpaRepository repository;

    @InjectMock
    ImageStoragePort imageStoragePort;

    @InjectMock
    ProfileLookupPort profileLookupPort;

    @BeforeEach
    @Transactional
    void cleanDatabase() {
        repository.deleteAll();
    }

    @Test
    void saveReturnsCompatibilityWrapper() {
        given()
                .contentType("application/json")
                .body("""
                        {
                          "title": "Portfolio",
                          "description": "Java backend",
                          "url": "https://example.test/project.png",
                          "display": true,
                          "imageId": "ignored",
                          "imageFile": "ignored",
                          "idProfile": 91
                        }
                        """)
                .when()
                .post("/project/user/save")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("message", equalTo("Project saved successfully"))
                .body("data.id", notNullValue())
                .body("data.title", equalTo("Portfolio"))
                .body("data.display", equalTo(true))
                .body("data.idProfile", equalTo(91));
    }

    @Test
    void updateReturnsCompatibilityWrapperAndKeepsCreateAt() {
        Integer id = createProject("Old", 44);
        String originalCreateAt = given()
                .when()
                .get("/project/user/getProject?id=44")
                .then()
                .statusCode(200)
                .extract()
                .path("data[0].createAt");

        given()
                .contentType("application/json")
                .body("""
                        {
                          "id": %d,
                          "title": "Updated",
                          "description": "Updated description",
                          "createAt": "2030-01-01T00:00:00",
                          "display": true,
                          "idProfile": 44
                        }
                        """.formatted(id))
                .when()
                .post("/project/user/update")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("message", equalTo("Project updated successfully"))
                .body("data.id", equalTo(id))
                .body("data.title", equalTo("Updated"))
                .body("data.createAt", equalTo(originalCreateAt));
    }

    @Test
    void getProjectReturnsProjectsByProfileId() {
        createProject("Match A", 70);
        createProject("Match B", 70);
        createProject("Other", 71);

        given()
                .when()
                .get("/project/user/getProject?id=70")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("message", equalTo("Projects fetched successfully"))
                .body("data", hasSize(2))
                .body("data[0].idProfile", equalTo(70));
    }

    @Test
    void getProfileReturnsProfileDataFromConfiguredProfileServiceAdapter() {
        ProfileDTO profile = new ProfileDTO();
        profile.setId(11);
        profile.setObjective("Backend");
        when(profileLookupPort.getAllProfiles()).thenReturn(List.of(profile));

        given()
                .when()
                .get("/project/user/getProfile")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("message", equalTo("Profiles fetched successfully"))
                .body("data", hasSize(1))
                .body("data[0].id", equalTo(11));
    }

    @Test
    void getImageCompatibilityEndpointForwardsMultipartImage() {
        when(imageStoragePort.save(any())).thenReturn(new ImageDTO(81, "https://example.test/image.png"));

        given()
                .multiPart("image", "project.png", "content".getBytes())
                .when()
                .get("/project/user/get")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("message", equalTo("ok"))
                .body("data.id", equalTo(81))
                .body("data.url", equalTo("https://example.test/image.png"));
    }

    @Test
    void get1ReturnsImageServiceCompatibilityData() {
        when(imageStoragePort.getAll()).thenReturn("ok");

        given()
                .when()
                .get("/project/user/get1")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("message", equalTo("ok"))
                .body("data", equalTo("ok"));
    }

    @Test
    void updateMissingProjectReturnsMappedApiResponse() {
        given()
                .contentType("application/json")
                .body("{\"id\":999,\"title\":\"Missing\"}")
                .when()
                .post("/project/user/update")
                .then()
                .statusCode(404)
                .body("success", equalTo(false))
                .body("message", equalTo("Project not found"))
                .body("data", equalTo(""));
    }

    private Integer createProject(String title, Integer profileId) {
        return given()
                .contentType("application/json")
                .body("""
                        {
                          "title": "%s",
                          "description": "Description",
                          "url": "https://example.test/%s",
                          "display": true,
                          "idProfile": %d
                        }
                        """.formatted(title, title.replace(" ", "-"), profileId))
                .when()
                .post("/project/user/save")
                .then()
                .statusCode(200)
                .extract()
                .path("data.id");
    }
}
