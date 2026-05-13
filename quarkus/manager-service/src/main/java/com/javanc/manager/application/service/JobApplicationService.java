package com.javanc.manager.application.service;

import com.javanc.manager.application.dto.JobDTO;
import com.javanc.manager.application.dto.MessageDTO;
import com.javanc.manager.application.dto.ProfileDTO;
import com.javanc.manager.application.exception.ApplicationException;
import com.javanc.manager.application.exception.ErrorCode;
import com.javanc.manager.application.mapper.JobMapper;
import com.javanc.manager.application.port.EmailPort;
import com.javanc.manager.application.port.NotificationPort;
import com.javanc.manager.application.port.ProfileLookupPort;
import com.javanc.manager.domain.model.Job;
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
    private final NotificationPort notificationPort;
    private final EmailPort emailPort;

    @Inject
    public JobApplicationService(JobRepository jobRepository, JobMapper jobMapper, ManagerIdGenerator idGenerator,
            ProfileLookupPort profileLookupPort, NotificationPort notificationPort, EmailPort emailPort) {
        this.jobRepository = jobRepository;
        this.jobMapper = jobMapper;
        this.idGenerator = idGenerator;
        this.profileLookupPort = profileLookupPort;
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
        profileLookupPort.findProfileById(idProfile);
        jobDTO.idProfiePending.add(idProfile);
        return update(jobDTO);
    }

    public JobDTO acceptProfile(Integer idJob, Integer idProfile) {
        JobDTO jobDTO = findById(idJob);
        if (jobDTO.idProfiePending != null) {
            jobDTO.idProfiePending.remove(idProfile);
        }
        if (jobDTO.idProfile == null) {
            jobDTO.idProfile = new ArrayList<>();
        }
        jobDTO.size = jobDTO.size - 1;
        jobDTO.idProfile.add(idProfile);
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
        jobDTO.idProfiePending.remove(idProfile);
        return update(jobDTO);
    }
}
