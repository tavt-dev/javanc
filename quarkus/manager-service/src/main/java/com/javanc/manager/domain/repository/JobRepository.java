package com.javanc.manager.domain.repository;

import com.javanc.manager.domain.model.Job;

import java.util.List;
import java.util.Optional;

public interface JobRepository {
    Job create(Job job);
    Job save(Job job);
    void delete(Job job);
    Optional<Job> findByJobId(Integer id);
    List<Job> findAllLimited();
    List<Job> findAllJobs();
    List<Job> findByCompanyId(Integer idCompany);
    List<Job> findByPendingProfileId(Integer idProfile);
    List<Job> findByAcceptedProfileId(Integer idProfile);
    List<Job> findNewJobsForProfile(Integer idProfile);
}
