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
import com.javanc.manager.domain.model.Job;
import com.javanc.manager.domain.repository.JobRepository;
import com.javanc.manager.domain.service.ManagerIdGenerator;
import com.javanc.common.pagination.PageRequest;
import com.javanc.common.pagination.PageResponse;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@ApplicationScoped
public class JobApplicationService {
    private static final Set<String> JOB_SORT_FIELDS = Set.of("id", "title", "typeJob", "size", "idCompany");

    private final JobRepository jobRepository;
    private final JobMapper jobMapper;
    private final ManagerIdGenerator idGenerator;
    private final ProfileLookupPort profileLookupPort;
    private final UserAccountPort userAccountPort;
    private final NotificationPort notificationPort;
    private final EmailPort emailPort;

    @Inject
    public JobApplicationService(JobRepository jobRepository, JobMapper jobMapper, ManagerIdGenerator idGenerator,
            ProfileLookupPort profileLookupPort, UserAccountPort userAccountPort, NotificationPort notificationPort,
            EmailPort emailPort) {
        this.jobRepository = jobRepository;
        this.jobMapper = jobMapper;
        this.idGenerator = idGenerator;
        this.profileLookupPort = profileLookupPort;
        this.userAccountPort = userAccountPort;
        this.notificationPort = notificationPort;
        this.emailPort = emailPort;
    }

    public JobDTO create(JobDTO jobDTO) {
        Job job = jobMapper.toDomain(jobDTO);
        job.id = idGenerator.nextId();
        return jobMapper.toDto(jobRepository.create(job));
    }

    public JobDTO update(JobDTO jobDTO) {
        return jobMapper.toDto(jobRepository.save(jobMapper.toDomain(jobDTO)));
    }

    public JobDTO delete(Integer id) {
        Job job = jobRepository.findByJobId(id)
                .orElseThrow(() -> new ApplicationException(ErrorCode.JOB_NOT_FOUND));
        jobRepository.delete(job);
        return jobMapper.toDto(job);
    }

    public JobDTO findById(Integer id) {
        return jobMapper.toDto(jobRepository.findByJobId(id)
                .orElseThrow(() -> new ApplicationException(ErrorCode.JOB_NOT_FOUND)));
    }

    public PageResponse<JobDTO> searchJobs(String query, String type, Integer companyId, Boolean openOnly,
            Integer page, Integer size, String sort) {
        return mapJobs(jobRepository.search(query, type, companyId, openOnly, null, null, null,
                pageRequest(page, size, sort)));
    }

    public PageResponse<JobDTO> getJobByCompany(Integer id, Integer page, Integer size, String sort) {
        return mapJobs(jobRepository.search(null, null, id, null, null, null, null, pageRequest(page, size, sort)));
    }

    public PageResponse<JobDTO> getJobByPrfilePending(Integer id, Integer page, Integer size, String sort) {
        return mapJobs(jobRepository.search(null, null, null, null, id, null, null, pageRequest(page, size, sort)));
    }

    public PageResponse<JobDTO> getJobByProfileAccepted(Integer id, Integer page, Integer size, String sort) {
        return mapJobs(jobRepository.search(null, null, null, null, null, id, null, pageRequest(page, size, sort)));
    }

    public PageResponse<JobDTO> getNewJob(Integer id, String query, String type, Integer companyId, Boolean openOnly,
            Integer page, Integer size, String sort) {
        return mapJobs(jobRepository.search(query, type, companyId, openOnly, null, null, id,
                pageRequest(page, size, sort)));
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
            throw new ApplicationException(ErrorCode.CONFLICT);
        }
        jobDTO.idProfiePending.add(idProfile);
        return update(jobDTO);
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
            throw new ApplicationException(ErrorCode.CONFLICT);
        }
        return update(jobDTO);
    }

    public JobDTO acceptProfile(Integer idJob, Integer idProfile) {
        JobDTO jobDTO = findById(idJob);
        if (jobDTO.idProfiePending == null || !jobDTO.idProfiePending.remove(idProfile)) {
            throw new ApplicationException(ErrorCode.CONFLICT);
        }
        if (jobDTO.idProfile == null) {
            jobDTO.idProfile = new ArrayList<>();
        }
        if (!jobDTO.idProfile.contains(idProfile)) {
            jobDTO.idProfile.add(idProfile);
        }
        jobDTO.size = Math.max(0, (jobDTO.size == null ? 0 : jobDTO.size) - 1);
        update(jobDTO);
        ProfileDTO profileDTO = profileLookupPort.findProfileById(idProfile);
        MessageDTO messageDTO = new MessageDTO("accept job successful by" + jobDTO.typeJob, profileDTO.idUser);
        JobDTO acceptedJob = update(jobDTO);
        notificationPort.create(messageDTO);
        emailPort.send(messageDTO);
        return acceptedJob;
    }

    public JobDTO rejectProfile(Integer idJob, Integer idProfile) {
        JobDTO jobDTO = findById(idJob);
        if (jobDTO.idProfiePending == null || !jobDTO.idProfiePending.remove(idProfile)) {
            throw new ApplicationException(ErrorCode.CONFLICT);
        }
        return update(jobDTO);
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

    private PageRequest pageRequest(Integer page, Integer size, String sort) {
        try {
            return PageRequest.resolve(page, size, sort, "id,desc", JOB_SORT_FIELDS);
        } catch (IllegalArgumentException exception) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, exception.getMessage());
        }
    }

    private PageResponse<JobDTO> mapJobs(PageResponse<Job> response) {
        return new PageResponse<>(
                response.items().stream().map(jobMapper::toDto).toList(),
                response.page(),
                response.size(),
                response.totalElements(),
                response.totalPages(),
                response.hasNext(),
                response.hasPrevious());
    }
}
