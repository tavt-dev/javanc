package com.javanc.notification.interfaces.rest.resource;

import com.javanc.notification.application.exception.ErrorCode;
import com.javanc.notification.application.port.UserLookupPort;
import com.javanc.notification.infrastructure.persistence.NotificationJpaRepository;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.Mockito.when;

@QuarkusTest
class NotificationResourceTest {

    @Inject
    NotificationJpaRepository repository;

    @InjectMock
    UserLookupPort userLookupPort;

    @BeforeEach
    @Transactional
    void cleanDatabase() {
        repository.deleteAll();
    }

    @Test
    void createReturnsCompatibilityWrapper() {
        given()
                .contentType("application/json")
                .body("""
                        {
                          "message": "Application accepted",
                          "id": 41
                        }
                        """)
                .when()
                .post("/notification/create")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("message", equalTo("Create is success"))
                .body("data", equalTo("true"));
    }

    @Test
    void updateReturnsUpdatedNotification() {
        given()
                .contentType("application/json")
                .body("""
                        {
                          "id": 501,
                          "message": "Read",
                          "url": "https://example.test",
                          "read": true,
                          "idUser": 41
                        }
                        """)
                .when()
                .post("/notification/update")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("message", equalTo("Update is success"))
                .body("data.id", equalTo(501))
                .body("data.message", equalTo("Read"))
                .body("data.read", equalTo(true))
                .body("data.idUser", equalTo(41));
    }

    @Test
    void findByUserReturnsNotificationsAfterUserValidation() {
        given()
                .contentType("application/json")
                .body("{\"message\":\"One\",\"id\":42}")
                .post("/notification/create")
                .then()
                .statusCode(200);
        given()
                .contentType("application/json")
                .body("{\"message\":\"Two\",\"id\":42}")
                .post("/notification/create")
                .then()
                .statusCode(200);
        when(userLookupPort.checkUserId(42)).thenReturn(true);

        given()
                .when()
                .get("/notification/user/findByUser?userId=42")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("message", equalTo("Find is success"))
                .body("data.items", hasSize(2))
                .body("data.items[0].idUser", equalTo(42))
                .body("data.items[0].read", equalTo(false));
    }

    @Test
    void getAllReturnsOkCompatibilityResponse() {
        given()
                .when()
                .get("/notification/getAll")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("message", equalTo("Find is success"))
                .body("data", equalTo("ok"));
    }

    @Test
    void invalidUserCheckReturnsMappedApiResponse() {
        when(userLookupPort.checkUserId(999)).thenReturn(false);

        given()
                .when()
                .get("/notification/user/findByUser?userId=999")
                .then()
                .statusCode(500)
                .body("success", equalTo(false))
                .body("message", equalTo(ErrorCode.DATABASE_ACCESS_ERROR.getMessage()))
                .body("data", equalTo(""));
    }
}
