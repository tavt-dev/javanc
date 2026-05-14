package com.javanc.manager.application.service;

import com.javanc.manager.application.dto.JobDTO;
import com.javanc.manager.application.dto.MessageDTO;
import com.javanc.manager.application.dto.ProfileDTO;
import com.javanc.manager.application.dto.UserDTO;
import com.javanc.manager.application.exception.ApplicationException;
import com.javanc.manager.application.exception.ErrorCode;
import com.javanc.manager.application.mapper.JobMapper;
import com.javanc.manager.application.port.EmailPort;
import com.javanc.manager.application.port.NotificationPort;
import com.javanc.manager.application.port.ProfileLookupPort;
import com.javanc.manager.application.port.UserAccountPort;
import com.javanc.manager.domain.model.Company;
import com.javanc.manager.domain.model.Job;
import com.javanc.manager.domain.repository.CompanyRepository;
import com.javanc.manager.domain.repository.JobRepository;
import com.javanc.manager.domain.service.ManagerIdGenerator;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class JobApplicationService {

    private final JobRepository jobRepository;
    private final JobMapper jobMapper;
    private final ManagerIdGenerator idGenerator;
    private final ProfileLookupPort profileLookupPort;
    private final UserAccountPort userAccountPort;
    private final NotificationPort notificationPort;
    private final EmailPort emailPort;
    private final CompanyRepository companyRepository;

    @Inject
    public JobApplicationService(JobRepository jobRepository, JobMapper jobMapper, ManagerIdGenerator idGenerator,
            ProfileLookupPort profileLookupPort, UserAccountPort userAccountPort, NotificationPort notificationPort,
            EmailPort emailPort, CompanyRepository companyRepository) {
        this.jobRepository = jobRepository;
        this.jobMapper = jobMapper;
        this.idGenerator = idGenerator;
        this.profileLookupPort = profileLookupPort;
        this.userAccountPort = userAccountPort;
        this.notificationPort = notificationPort;
        this.emailPort = emailPort;
        this.companyRepository = companyRepository;
    }

    public JobDTO create(JobDTO jobDTO) {
        Company company = requireJobCompany(jobDTO.idCompany);
        requireCanWriteJob(company);
        Job job = jobMapper.toDomain(jobDTO);
        job.id = idGenerator.nextId();
        return jobMapper.toDto(jobRepository.create(job));
    }

    public JobDTO update(JobDTO jobDTO) {
        Company company = requireJobCompany(jobDTO.idCompany);
        requireCanWriteJob(company);
        return saveJob(jobDTO);
    }

    public JobDTO delete(Integer id) {
        Job job = jobRepository.findByJobId(id)
                .orElseThrow(() -> new ApplicationException(ErrorCode.JOB_NOT_FOUND));
        Company company = requireJobCompany(job.idCompany);
        requireCanWriteJob(company);
        jobRepository.delete(job);
        return jobMapper.toDto(job);
    }

    public JobDTO findById(Integer id) {
        return jobMapper.toDto(jobRepository.findByJobId(id)
                .orElseThrow(() -> new ApplicationException(ErrorCode.JOB_NOT_FOUND)));
    }

    public List<JobDTO> getAllJobs() {
        return jobRepository.findAllLimited().stream().map(jobMapper::toDto).toList();
    }

    public List<JobDTO> getJobByCompany(Integer id) {
        return jobRepository.findByCompanyId(id).stream().map(jobMapper::toDto).toList();
    }

    public List<JobDTO> getJobByPrfilePending(Integer id) {
        return jobRepository.findByPendingProfileId(id).stream().map(jobMapper::toDto).toList();
    }

    public List<JobDTO> getJobByProfileAccepted(Integer id) {
        return jobRepository.findByAcceptedProfileId(id).stream().map(jobMapper::toDto).toList();
    }

    public List<JobDTO> getNewJob(Integer id) {
        return jobRepository.findNewJobsForProfile(id).stream().map(jobMapper::toDto).toList();
    }

    public JobDTO applyJob(Integer idJob, Integer idProfile) {
        JobDTO jobDTO = findById(idJob);
        if (jobDTO.idProfiePending == null) {
            jobDTO.idProfiePending = new ArrayList<>();
        }
        UserDTO currentUser = userAccountPort.currentUser();
        if (!"user".equalsIgnoreCase(currentUser.role)) {
            throw new ApplicationException(ErrorCode.FORBIDDEN);
        }
        ProfileDTO profile = profileLookupPort.findProfileById(idProfile);
        if (profile == null || !currentUser.id.equals(profile.idUser)) {
            throw new ApplicationException(ErrorCode.FORBIDDEN);
        }
        if ((jobDTO.idProfile != null && jobDTO.idProfile.contains(idProfile))
                || jobDTO.idProfiePending.contains(idProfile)) {
            throw new ApplicationException(ErrorCode.CONFLICT, "You already applied for this job");
        }
        jobDTO.idProfiePending.add(idProfile);
        JobDTO appliedJob = saveJob(jobDTO);
        notifyCompanyManager(appliedJob, profile);
        return appliedJob;
    }

    public JobDTO applyCurrentUser(Integer idJob) {
        ProfileDTO profile = requireCurrentUserProfile();
        return applyJob(idJob, profile.id);
    }

    public String applicationStatus(Integer idJob) {
        ProfileDTO profile = requireCurrentUserProfile();
        JobDTO jobDTO = findById(idJob);
        if (jobDTO.idProfile != null && jobDTO.idProfile.contains(profile.id)) {
            return "ACCEPTED";
        }
        if (jobDTO.idProfiePending != null && jobDTO.idProfiePending.contains(profile.id)) {
            return "PENDING";
        }
        return "NONE";
    }

    public JobDTO leaveCurrentUser(Integer idJob) {
        ProfileDTO profile = requireCurrentUserProfile();
        JobDTO jobDTO = findById(idJob);
        boolean changed = false;
        if (jobDTO.idProfiePending != null) {
            changed = jobDTO.idProfiePending.remove(profile.id);
        }
        if (jobDTO.idProfile != null) {
            changed = jobDTO.idProfile.remove(profile.id) || changed;
        }
        if (!changed) {
            throw new ApplicationException(ErrorCode.CONFLICT, "No active application found for this job");
        }
        return saveJob(jobDTO);
    }

    public JobDTO acceptProfile(Integer idJob, Integer idProfile) {
        JobDTO jobDTO = findById(idJob);
        requireCanWriteJob(requireJobCompany(jobDTO.idCompany));
        if (jobDTO.idProfiePending == null || !jobDTO.idProfiePending.remove(idProfile)) {
            throw new ApplicationException(ErrorCode.CONFLICT, "This application was already reviewed");
        }
        if (jobDTO.idProfile == null) {
            jobDTO.idProfile = new ArrayList<>();
        }
        if (!jobDTO.idProfile.contains(idProfile)) {
            jobDTO.idProfile.add(idProfile);
        }
        jobDTO.size = Math.max(0, (jobDTO.size == null ? 0 : jobDTO.size) - 1);
        saveJob(jobDTO);
        ProfileDTO profileDTO = profileLookupPort.findProfileById(idProfile);
        MessageDTO messageDTO = new MessageDTO("Your application for " + jobTitle(jobDTO) + " was accepted",
                profileDTO.idUser);
        JobDTO acceptedJob = saveJob(jobDTO);
        notificationPort.create(messageDTO);
        emailPort.send(messageDTO);
        return acceptedJob;
    }

    public JobDTO rejectProfile(Integer idJob, Integer idProfile) {
        JobDTO jobDTO = findById(idJob);
        requireCanWriteJob(requireJobCompany(jobDTO.idCompany));
        if (jobDTO.idProfiePending == null || !jobDTO.idProfiePending.remove(idProfile)) {
            throw new ApplicationException(ErrorCode.CONFLICT, "This application was already reviewed");
        }
        JobDTO rejectedJob = saveJob(jobDTO);
        ProfileDTO profileDTO = profileLookupPort.findProfileById(idProfile);
        MessageDTO messageDTO = new MessageDTO("Your application for " + jobTitle(jobDTO) + " was rejected",
                profileDTO.idUser);
        notificationPort.create(messageDTO);
        emailPort.send(messageDTO);
        return rejectedJob;
    }

    private ProfileDTO requireCurrentUserProfile() {
        UserDTO currentUser = userAccountPort.currentUser();
        if (!"user".equalsIgnoreCase(currentUser.role)) {
            throw new ApplicationException(ErrorCode.FORBIDDEN);
        }
        ProfileDTO profile = profileLookupPort.myProfile();
        if (profile == null || profile.id == null) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST);
        }
        return profile;
    }

    private void notifyCompanyManager(JobDTO jobDTO, ProfileDTO profileDTO) {
        if (jobDTO.idCompany == null) {
            return;
        }
        companyRepository.findByCompanyId(jobDTO.idCompany)
                .map(company -> company.idManager)
                .filter(managerId -> managerId != null)
                .ifPresent(managerId -> notificationPort.create(new MessageDTO(
                        applicantName(profileDTO) + " applied for " + jobTitle(jobDTO), managerId)));
    }

    private String jobTitle(JobDTO jobDTO) {
        return jobDTO.title == null || jobDTO.title.isBlank() ? "this job" : jobDTO.title;
    }

    private String applicantName(ProfileDTO profileDTO) {
        if (profileDTO == null) {
            return "A user";
        }
        if (profileDTO.title != null && !profileDTO.title.isBlank()) {
            return profileDTO.title;
        }
        return profileDTO.id == null ? "A user" : "Profile #" + profileDTO.id;
    }

    private Company requireJobCompany(Integer companyId) {
        if (companyId == null || companyId <= 0) {
            throw new ApplicationException(ErrorCode.COMPANY_NOT_FOUND);
        }
        return companyRepository.findByCompanyId(companyId)
                .orElseThrow(() -> new ApplicationException(ErrorCode.COMPANY_NOT_FOUND));
    }

    private void requireCanWriteJob(Company company) {
        UserDTO currentUser = userAccountPort.currentUser();
        if ("admin".equalsIgnoreCase(currentUser.role) || "manager".equalsIgnoreCase(currentUser.role)) {
            return;
        }
        if ("hr".equalsIgnoreCase(currentUser.role) && company.idHr != null && company.idHr.contains(currentUser.id)) {
            return;
        }
        throw new ApplicationException(ErrorCode.FORBIDDEN);
    }

    private JobDTO saveJob(JobDTO jobDTO) {
        return jobMapper.toDto(jobRepository.save(jobMapper.toDomain(jobDTO)));
    }
}
