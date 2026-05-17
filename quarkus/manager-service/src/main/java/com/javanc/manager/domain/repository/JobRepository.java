package com.javanc.manager.domain.repository;

import com.javanc.manager.domain.model.Job;
import com.javanc.common.pagination.PageRequest;
import com.javanc.common.pagination.PageResponse;

import java.util.Optional;

public interface JobRepository {
    Job create(Job job);
    Job save(Job job);
    void delete(Job job);
    Optional<Job> findByJobId(Integer id);
    PageResponse<Job> search(String query, String type, Integer companyId, Boolean openOnly, Integer pendingProfileId,
            Integer acceptedProfileId, Integer excludedProfileId, PageRequest pageRequest);
}
