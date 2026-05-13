package com.javanc.manager.application.service;

import com.javanc.manager.application.dto.AuthenticationRequest;
import com.javanc.manager.application.dto.CompanyDTO;
import com.javanc.manager.application.dto.JobDTO;
import com.javanc.manager.application.dto.MessageDTO;
import com.javanc.manager.application.dto.ProfileDTO;
import com.javanc.manager.application.dto.RoleRequestDTO;
import com.javanc.manager.application.dto.UserDTO;
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
        CompanyApplicationService service = newCompanyService(repository, imageFile -> "uploaded-url",
                new CapturingUserAccountPort(99));
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
    void promoteExistingUserToHrCreatesPendingRequestWithoutLinkingCompany() {
        FakeCompanyRepository repository = new FakeCompanyRepository();
        Company company = new Company();
        company.id = 1;
        repository.saved = company;
        CapturingUserAccountPort userAccount = new CapturingUserAccountPort(77);
        CompanyApplicationService service = newCompanyService(repository, imageFile -> "", userAccount);

        CompanyDTO result = service.promoteUserToHR(42, 1);

        assertEquals(42, userAccount.changedUserId);
        assertEquals(1, result.id);
        assertNull(result.idHR);
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
        JobApplicationService service = newJobService(repository, new ProfileLookupPort() {
            @Override
            public ProfileDTO findProfileById(Integer id) {
                ProfileDTO profile = new ProfileDTO();
                profile.idUser = 33;
                return profile;
            }

            @Override
            public ProfileDTO myProfile() {
                return findProfileById(10);
            }
        }, notification, email);

        JobDTO result = service.acceptProfile(5, 10);

        assertEquals(1, result.size);
        assertEquals(List.of(10), result.idProfile);
        assertEquals("accept job successful byjava", notification.message.message);
        assertEquals(33, notification.message.id);
        assertEquals("accept job successful byjava", email.message.message);
    }

    @Test
    void updateCompanyMapsUrl() {
        CompanyDTO dto = new CompanyDTO();
        dto.id = 1;
        dto.url = "https://image.test/logo.png";
        Company domain = new CompanyMapper().toDomain(dto);

        assertEquals("https://image.test/logo.png", domain.url);
    }

    @Test
    void currentUserApplyUsesCurrentProfile() {
        FakeJobRepository repository = new FakeJobRepository();
        Job job = new Job();
        job.id = 5;
        repository.saved = job;
        JobApplicationService service = newJobService(repository, new ProfileLookupPort() {
            @Override
            public ProfileDTO findProfileById(Integer id) {
                ProfileDTO profile = new ProfileDTO();
                profile.id = id;
                profile.idUser = 33;
                return profile;
            }

            @Override
            public ProfileDTO myProfile() {
                ProfileDTO profile = new ProfileDTO();
                profile.id = 10;
                profile.idUser = 33;
                return profile;
            }
        }, new CapturingNotificationPort(), new CapturingEmailPort());

        JobDTO result = service.applyCurrentUser(5);

        assertEquals(List.of(10), result.idProfiePending);
    }

    @Test
    void leaveHrRemovesHrFromCompanyBeforeDemotingUser() {
        FakeCompanyRepository repository = new FakeCompanyRepository();
        Company company = new Company();
        company.id = 1;
        company.idHr = new ArrayList<>(List.of(9));
        repository.saved = company;
        CapturingUserAccountPort userAccount = new CapturingUserAccountPort(9);
        userAccount.currentRole = "hr";
        CompanyApplicationService service = newCompanyService(repository, imageFile -> "", userAccount);

        CompanyDTO result = service.leaveHr();

        assertEquals(List.of(), result.idHR);
        assertEquals("user", userAccount.changedRole);
    }

    private CompanyApplicationService newCompanyService(CompanyRepository repository, ImageStoragePort imageStoragePort,
            UserAccountPort userAccountPort) {
        return new CompanyApplicationService(repository, new CompanyMapper(), new FixedIdGenerator(123), imageStoragePort,
                userAccountPort);
    }

    private JobApplicationService newJobService(JobRepository repository, ProfileLookupPort profileLookupPort,
            NotificationPort notificationPort, EmailPort emailPort) {
        return new JobApplicationService(repository, new JobMapper(), new FixedIdGenerator(123), profileLookupPort,
                new CapturingUserAccountPort(33), notificationPort, emailPort);
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
        private Integer changedUserId;
        private String changedRole;
        private String currentRole = "user";

        private CapturingUserAccountPort(Integer id) {
            this.id = id;
        }

        @Override
        public Integer createAccount(AuthenticationRequest authenticationRequest) {
            request = authenticationRequest;
            return id;
        }

        @Override
        public UserDTO changeRole(Integer userId, String role) {
            changedUserId = userId;
            changedRole = role;
            UserDTO user = new UserDTO();
            user.id = userId;
            user.role = role;
            return user;
        }

        @Override
        public UserDTO currentUser() {
            UserDTO user = new UserDTO();
            user.id = id;
            user.role = currentRole;
            return user;
        }

        @Override
        public List<UserDTO> searchUsers(String query, String role, int page, int size) {
            return List.of();
        }

        @Override
        public RoleRequestDTO requestHrPromotion(Integer targetUserId, Integer companyId, String companyName) {
            changedUserId = targetUserId;
            RoleRequestDTO request = new RoleRequestDTO();
            request.id = 7;
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
            request.targetUserId = 42;
            request.companyId = 1;
            request.status = "APPROVED";
            return request;
        }

        @Override
        public UserDTO leaveHr() {
            changedRole = "user";
            UserDTO user = new UserDTO();
            user.id = id;
            user.role = "user";
            return user;
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
