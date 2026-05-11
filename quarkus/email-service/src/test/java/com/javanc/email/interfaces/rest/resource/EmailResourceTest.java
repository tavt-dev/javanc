package com.javanc.email.interfaces.rest.resource;

import com.javanc.email.application.port.MailSenderPort;
import com.javanc.email.application.port.UserLookupPort;
import com.javanc.email.domain.model.MailMessage;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Alternative;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

@QuarkusTest
class EmailResourceTest {

    @BeforeEach
    void reset() {
        TestUserLookupPort.requestedId = null;
        TestMailSenderPort.sentMessage = null;
    }

    @Test
    void createPreservesCurrentSuccessResponse() {
        given()
                .contentType("application/json")
                .body("{\"message\":\"accept job successful byjava\",\"id\":8}")
                .when().post("/email/create")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("message", equalTo("Check user id successfully"))
                .body("data", equalTo("true"));
    }

    @Test
    void createUsesMessageIdAsTargetUserId() {
        given()
                .contentType("application/json")
                .body("{\"message\":\"message\",\"id\":44}")
                .when().post("/email/create")
                .then()
                .statusCode(200);

        org.junit.jupiter.api.Assertions.assertEquals(44, TestUserLookupPort.requestedId);
        org.junit.jupiter.api.Assertions.assertEquals("target@example.test", TestMailSenderPort.sentMessage.getMailTo());
        org.junit.jupiter.api.Assertions.assertEquals("message", TestMailSenderPort.sentMessage.getMailSubject());
        org.junit.jupiter.api.Assertions.assertEquals("message", TestMailSenderPort.sentMessage.getMailContent());
    }

    @Test
    void internalVerificationOtpSendsTemplatedMail() {
        given()
                .contentType("application/json")
                .body("{\"to\":\"verify@example.test\",\"name\":\"Verify User\",\"otp\":\"123456\",\"expiresInMinutes\":10}")
                .when().post("/internal/emails/verification-otp")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("message", equalTo("Verification OTP email sent"));

        org.junit.jupiter.api.Assertions.assertEquals("verify@example.test", TestMailSenderPort.sentMessage.getMailTo());
        org.junit.jupiter.api.Assertions.assertEquals("Verify your Javanc account",
                TestMailSenderPort.sentMessage.getMailSubject());
        org.junit.jupiter.api.Assertions.assertEquals("text/html", TestMailSenderPort.sentMessage.getContentType());
        org.junit.jupiter.api.Assertions.assertTrue(TestMailSenderPort.sentMessage.getMailContent().contains("<!doctype html>"));
        org.junit.jupiter.api.Assertions.assertTrue(TestMailSenderPort.sentMessage.getMailContent().contains("Verify your email"));
        org.junit.jupiter.api.Assertions.assertTrue(TestMailSenderPort.sentMessage.getMailContent().contains("123456"));
        org.junit.jupiter.api.Assertions.assertTrue(TestMailSenderPort.sentMessage.getMailContent().contains("10"));
    }

    @Test
    void internalVerificationOtpRejectsInvalidRequest() {
        given()
                .contentType("application/json")
                .body("{\"to\":\"verify@example.test\"}")
                .when().post("/internal/emails/verification-otp")
                .then()
                .statusCode(400)
                .body("success", equalTo(false));
    }

    @Alternative
    @Priority(1)
    @ApplicationScoped
    public static class TestUserLookupPort implements UserLookupPort {

        private static Integer requestedId;

        @Override
        public String findEmailByUserId(Integer id) {
            requestedId = id;
            return "target@example.test";
        }
    }

    @Alternative
    @Priority(1)
    @ApplicationScoped
    public static class TestMailSenderPort implements MailSenderPort {

        private static MailMessage sentMessage;

        @Override
        public void send(MailMessage mailMessage) {
            sentMessage = mailMessage;
        }
    }
}
