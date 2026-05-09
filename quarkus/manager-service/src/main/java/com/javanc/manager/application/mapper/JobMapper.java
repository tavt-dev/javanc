package com.javanc.manager.application.mapper;

import com.javanc.manager.application.dto.JobDTO;
import com.javanc.manager.domain.model.Job;
import com.javanc.manager.domain.model.TypeJob;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class JobMapper {

    public Job toDomain(JobDTO dto) {
        Job job = new Job();
        if (dto == null) {
            return job;
        }
        job.id = dto.id;
        job.title = dto.title;
        job.description = dto.description;
        job.typeJob = dto.typeJob == null ? null : TypeJob.valueOf(dto.typeJob);
        job.size = dto.size;
        job.idProfiePending = dto.idProfiePending;
        job.idProfile = dto.idProfile;
        job.idCompany = dto.idCompany;
        return job;
    }

    public JobDTO toDto(Job job) {
        if (job == null) {
            return null;
        }
        JobDTO dto = new JobDTO();
        dto.id = job.id;
        dto.title = job.title;
        dto.description = job.description;
        dto.typeJob = job.typeJob == null ? null : job.typeJob.name();
        dto.size = job.size;
        dto.idProfiePending = job.idProfiePending;
        dto.idProfile = job.idProfile;
        dto.idCompany = job.idCompany;
        return dto;
    }
}
