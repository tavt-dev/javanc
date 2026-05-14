package com.javanc.manager.interfaces.rest.resource;

import com.javanc.manager.application.dto.AuthenticationRequest;
import com.javanc.manager.application.dto.MessageDTO;
import com.javanc.manager.application.dto.ProfileDTO;
import com.javanc.manager.application.dto.RoleRequestDTO;
import com.javanc.manager.application.dto.UserDTO;
import com.javanc.manager.application.port.EmailPort;
import com.javanc.manager.application.port.ImageStoragePort;
import com.javanc.manager.application.port.NotificationPort;
import com.javanc.manager.application.port.ProfileLookupPort;
import com.javanc.manager.application.port.UserAccountPort;
import com.javanc.manager.domain.model.Company;
import com.javanc.manager.domain.model.Job;
import com.javanc.manager.domain.model.TypeJob;
import com.javanc.manager.domain.repository.CompanyRepository;
import com.javanc.manager.domain.repository.JobRepository;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Alternative;
import org.jboss.resteasy.reactive.multipart.FileUpload;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

@QuarkusTest
class ManagerResourceTest {

    @BeforeEach
    void reset() {
        TestCompanyRepository.company = null;
        TestJobRepository.job = null;
        TestNotificationPort.message = null;
        TestEmailPort.message = null;
    }

    @Test
    void createCompanyPreservesSuccessWrapper() {
        given()
                .multiPart("name", "Acme")
                .multiPart("type", "IT")
                .when().post("/manager/admin/company/create")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("message", equalTo("Company created successfully"))
                .body("data.name", equalTo("Acme"));
    }

    @Test
    void createJobPreservesSuccessWrapperAndTypeField() {
        Company company = new Company();
        company.id = 9;
        company.idManager = 1;
        TestCompanyRepository.company = company;

        given()
                .contentType("application/json")
                .body("{\"title\":\"Java Dev\",\"description\":\"Build\",\"typeJob\":\"java\",\"size\":2,\"idCompany\":9}")
                .when().post("/manager/hr/job/create")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("message", equalTo("Job created"))
                .body("data.typeJob", equalTo("java"));
    }

    @Test
    void acceptJobPreservesMessageAndSideEffects() {
        Job job = new Job();
        job.id = 5;
        job.title = "Java Dev";
        job.typeJob = TypeJob.java;
        job.size = 2;
        job.idCompany = 1;
        job.idProfiePending = new ArrayList<>(List.of(11));
        TestJobRepository.job = job;
        Company company = new Company();
        company.id = 1;
        company.idManager = 1;
        TestCompanyRepository.company = company;

        given()
                .when().put("/manager/hr/job/accept?jobDTO=5&idProfile=11")
                .then()
                .statusCode(200)
                .body("success", equalTo(true))
                .body("message", equalTo("Job accepted"))
                .body("data.size", equalTo(1))
                .body("data.idProfile[0]", equalTo(11));

        org.junit.jupiter.api.Assertions.assertEquals("Your application for Java Dev was accepted", TestNotificationPort.message.message);
        org.junit.jupiter.api.Assertions.assertEquals(42, TestEmailPort.message.id);
    }

    @Alternative
    @Priority(1)
    @ApplicationScoped
    public static class TestCompanyRepository implements CompanyRepository {
        private static Company company;

        @Override
        public Company create(Company value) {
            company = value;
            return value;
        }

        @Override
        public Company save(Company value) {
            company = value;
            return value;
        }

        @Override
        public void deleteByCompanyId(Integer id) {
            company = null;
        }

        @Override
        public Optional<Company> findByCompanyId(Integer id) {
            return Optional.ofNullable(company).filter(value -> value.id.equals(id));
        }

        @Override
        public List<Company> findAllLimited() {
            return company == null ? List.of() : List.of(company);
        }

        @Override
        public List<Company> findAllCompanies() {
            return findAllLimited();
        }

        @Override
        public List<Company> findByTypeRegex(String type) {
            return findAllLimited();
        }

        @Override
        public Optional<Company> findByManagerId(Integer idManager) {
            return Optional.ofNullable(company);
        }

        @Override
        public Optional<Company> findByHrId(Integer idHr) {
            return Optional.ofNullable(company);
        }
    }

    @Alternative
    @Priority(1)
    @ApplicationScoped
    public static class TestJobRepository implements JobRepository {
        private static Job job;

        @Override
        public Job create(Job value) {
            job = value;
            return value;
        }

        @Override
        public Job save(Job value) {
            job = value;
            return value;
        }

        @Override
        public void delete(Job value) {
            job = null;
        }

        @Override
        public Optional<Job> findByJobId(Integer id) {
            return Optional.ofNullable(job).filter(value -> value.id.equals(id));
        }

        @Override
        public List<Job> findAllLimited() {
            return job == null ? List.of() : List.of(job);
        }

        @Override
        public List<Job> findAllJobs() {
            return findAllLimited();
        }

        @Override
        public List<Job> findByCompanyId(Integer idCompany) {
            return findAllLimited();
        }

        @Override
        public List<Job> findByPendingProfileId(Integer idProfile) {
            return findAllLimited();
        }

        @Override
        public List<Job> findByAcceptedProfileId(Integer idProfile) {
            return findAllLimited();
        }

        @Override
        public List<Job> findNewJobsForProfile(Integer idProfile) {
            return findAllLimited();
        }
    }

    @Alternative
    @Priority(1)
    @ApplicationScoped
    public static class TestImageStoragePort implements ImageStoragePort {
        @Override
        public String uploadCompanyImage(FileUpload imageFile) {
            return "http://image.test/company.png";
        }
    }

    @Alternative
    @Priority(1)
    @ApplicationScoped
    public static class TestUserAccountPort implements UserAccountPort {
        @Override
        public Integer createAccount(AuthenticationRequest authenticationRequest) {
            return 99;
        }

        @Override
        public UserDTO changeRole(Integer userId, String role) {
            UserDTO user = new UserDTO();
            user.id = userId;
            user.role = role;
            return user;
        }

        @Override
        public UserDTO currentUser() {
            UserDTO user = new UserDTO();
            user.id = 1;
            user.role = "manager";
            return user;
        }

        @Override
        public List<UserDTO> searchUsers(String query, String role, int page, int size) {
            return List.of();
        }

        @Override
        public RoleRequestDTO requestHrPromotion(Integer targetUserId, Integer companyId, String companyName) {
            RoleRequestDTO request = new RoleRequestDTO();
            request.id = 10;
            request.targetUserId = targetUserId;
            request.companyId = companyId;
            request.companyName = companyName;
            request.status = "PENDING_USER_CONFIRMATION";
            return request;
        }

        @Override
        public RoleRequestDTO acceptHrPromotion(Integer requestId) {
            RoleRequestDTO request = new RoleRequestDTO();
            request.id = requestId;
            request.targetUserId = 99;
            request.companyId = 1;
            request.status = "APPROVED";
            return request;
        }

        @Override
        public UserDTO leaveHr() {
            UserDTO user = new UserDTO();
            user.id = 1;
            user.role = "user";
            return user;
        }
    }

    @Alternative
    @Priority(1)
    @ApplicationScoped
    public static class TestProfileLookupPort implements ProfileLookupPort {
        @Override
        public ProfileDTO findProfileById(Integer id) {
            ProfileDTO profile = new ProfileDTO();
            profile.id = id;
            profile.idUser = 42;
            return profile;
        }

        @Override
        public ProfileDTO myProfile() {
            return findProfileById(11);
        }
    }

    @Alternative
    @Priority(1)
    @ApplicationScoped
    public static class TestNotificationPort implements NotificationPort {
        private static MessageDTO message;

        @Override
        public void create(MessageDTO messageDTO) {
            message = messageDTO;
        }
    }

    @Alternative
    @Priority(1)
    @ApplicationScoped
    public static class TestEmailPort implements EmailPort {
        private static MessageDTO message;

        @Override
        public void send(MessageDTO messageDTO) {
            message = messageDTO;
        }
    }
}
