package com.javanc.manager.application.service;

import com.javanc.manager.application.dto.AuthenticationRequest;
import com.javanc.manager.application.dto.CompanyDTO;
import com.javanc.manager.application.dto.JobDTO;
import com.javanc.manager.application.dto.MessageDTO;
import com.javanc.manager.application.dto.ProfileDTO;
import com.javanc.manager.application.mapper.CompanyMapper;
import com.javanc.manager.application.mapper.JobMapper;
import com.javanc.manager.application.port.EmailPort;
import com.javanc.manager.application.port.ImageStoragePort;
import com.javanc.manager.application.port.NotificationPort;
import com.javanc.manager.application.port.ProfileLookupPort;
import com.javanc.manager.application.port.UserAccountPort;
import com.javanc.manager.domain.model.Company;
import com.javanc.manager.domain.model.Job;
import com.javanc.manager.domain.repository.CompanyRepository;
import com.javanc.manager.domain.repository.JobRepository;
import com.javanc.manager.domain.service.ManagerIdGenerator;
import org.jboss.resteasy.reactive.multipart.FileUpload;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ManagerApplicationServiceTest {

    @Test
    void createCompanyWithoutImageStoresEmptyUrlAndManualId() {
        FakeCompanyRepository repository = new FakeCompanyRepository();
        CompanyApplicationService service = newCompanyService(repository, imageFile -> "uploaded-url", request -> 99);
        CompanyDTO request = new CompanyDTO();
        request.name = "Company";

        CompanyDTO result = service.create(request, null);

        assertEquals(123, result.id);
        assertEquals("", repository.saved.url);
    }

    @Test
    void setHrForcesRoleAndAppendsReturnedUserId() {
        FakeCompanyRepository repository = new FakeCompanyRepository();
        Company company = new Company();
        company.id = 1;
        repository.saved = company;
        AuthenticationRequest request = new AuthenticationRequest();
        CapturingUserAccountPort userAccount = new CapturingUserAccountPort(77);
        CompanyApplicationService service = newCompanyService(repository, imageFile -> "", userAccount);

        CompanyDTO result = service.setHRToCompany(request, 1);

        assertEquals("hr", userAccount.request.role);
        assertEquals(List.of(77), result.idHR);
    }

    @Test
    void acceptProfileMovesProfileAndSendsNotificationThenEmail() {
        FakeJobRepository repository = new FakeJobRepository();
        Job job = new Job();
        job.id = 5;
        job.title = "Developer";
        job.typeJob = com.javanc.manager.domain.model.TypeJob.java;
        job.size = 2;
        job.idProfiePending = new ArrayList<>(List.of(10));
        repository.saved = job;
        CapturingNotificationPort notification = new CapturingNotificationPort();
        CapturingEmailPort email = new CapturingEmailPort();
        JobApplicationService service = newJobService(repository, id -> {
            ProfileDTO profile = new ProfileDTO();
            profile.idUser = 33;
            return profile;
        }, notification, email);

        JobDTO result = service.acceptProfile(5, 10);

        assertEquals(1, result.size);
        assertEquals(List.of(10), result.idProfile);
        assertEquals("accept job successful byjava", notification.message.message);
        assertEquals(33, notification.message.id);
        assertEquals("accept job successful byjava", email.message.message);
    }

    @Test
    void updateCompanyKeepsCurrentDtoCompatibilityByNotMappingUrl() {
        CompanyDTO dto = new CompanyDTO();
        dto.id = 1;
        Company domain = new CompanyMapper().toDomain(dto);

        assertNull(domain.url);
    }

    private CompanyApplicationService newCompanyService(CompanyRepository repository, ImageStoragePort imageStoragePort,
            UserAccountPort userAccountPort) {
        return new CompanyApplicationService(repository, new CompanyMapper(), new FixedIdGenerator(123), imageStoragePort,
                userAccountPort);
    }

    private JobApplicationService newJobService(JobRepository repository, ProfileLookupPort profileLookupPort,
            NotificationPort notificationPort, EmailPort emailPort) {
        return new JobApplicationService(repository, new JobMapper(), new FixedIdGenerator(123), profileLookupPort,
                notificationPort, emailPort);
    }

    private static class FixedIdGenerator extends ManagerIdGenerator {
        private final Integer id;

        private FixedIdGenerator(Integer id) {
            this.id = id;
        }

        @Override
        public Integer nextId() {
            return id;
        }
    }

    private static class FakeCompanyRepository implements CompanyRepository {
        private Company saved;

        @Override
        public Company create(Company company) {
            saved = company;
            return company;
        }

        @Override
        public Company save(Company company) {
            saved = company;
            return company;
        }

        @Override
        public void deleteByCompanyId(Integer id) {
        }

        @Override
        public Optional<Company> findByCompanyId(Integer id) {
            return Optional.ofNullable(saved).filter(company -> company.id.equals(id));
        }

        @Override
        public List<Company> findAllLimited() {
            return saved == null ? List.of() : List.of(saved);
        }

        @Override
        public List<Company> findByTypeRegex(String type) {
            return findAllLimited();
        }

        @Override
        public Optional<Company> findByManagerId(Integer idManager) {
            return findAllLimited().stream().findFirst();
        }

        @Override
        public Optional<Company> findByHrId(Integer idHr) {
            return findAllLimited().stream().findFirst();
        }
    }

    private static class FakeJobRepository implements JobRepository {
        private Job saved;

        @Override
        public Job create(Job job) {
            saved = job;
            return job;
        }

        @Override
        public Job save(Job job) {
            saved = job;
            return job;
        }

        @Override
        public void delete(Job job) {
        }

        @Override
        public Optional<Job> findByJobId(Integer id) {
            return Optional.ofNullable(saved).filter(job -> job.id.equals(id));
        }

        @Override
        public List<Job> findAllLimited() {
            return saved == null ? List.of() : List.of(saved);
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

    private static class CapturingUserAccountPort implements UserAccountPort {
        private final Integer id;
        private AuthenticationRequest request;

        private CapturingUserAccountPort(Integer id) {
            this.id = id;
        }

        @Override
        public Integer createAccount(AuthenticationRequest authenticationRequest) {
            request = authenticationRequest;
            return id;
        }
    }

    private static class CapturingNotificationPort implements NotificationPort {
        private MessageDTO message;

        @Override
        public void create(MessageDTO messageDTO) {
            message = messageDTO;
        }
    }

    private static class CapturingEmailPort implements EmailPort {
        private MessageDTO message;

        @Override
        public void send(MessageDTO messageDTO) {
            message = messageDTO;
        }
    }
}
