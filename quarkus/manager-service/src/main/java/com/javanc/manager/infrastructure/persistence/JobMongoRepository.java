package com.javanc.manager.infrastructure.persistence;

import com.javanc.manager.domain.model.Job;
import com.javanc.manager.domain.repository.JobRepository;
import com.mongodb.client.model.Filters;
import io.quarkus.mongodb.panache.PanacheMongoRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class JobMongoRepository implements JobRepository, PanacheMongoRepositoryBase<Job, Integer> {

    @Override
    public Job create(Job job) {
        persist(job);
        return job;
    }

    @Override
    public Job save(Job job) {
        update(job);
        return job;
    }

    @Override
    public void delete(Job job) {
        if (job != null) {
            deleteById(job.id);
        }
    }

    @Override
    public Optional<Job> findByJobId(Integer id) {
        return findByIdOptional(id);
    }

    @Override
    public List<Job> findAllLimited() {
        return findAll().page(0, 20).list();
    }

    @Override
    public List<Job> findByCompanyId(Integer idCompany) {
        return find("idCompany", idCompany).list();
    }

    @Override
    public List<Job> findByPendingProfileId(Integer idProfile) {
        return mongoCollection().find(Filters.eq("idProfiePending", idProfile)).into(new ArrayList<>());
    }

    @Override
    public List<Job> findByAcceptedProfileId(Integer idProfile) {
        return mongoCollection().find(Filters.eq("idProfile", idProfile)).into(new ArrayList<>());
    }

    @Override
    public List<Job> findNewJobsForProfile(Integer idProfile) {
        return mongoCollection().find(Filters.and(
                Filters.nin("idProfiePending", idProfile),
                Filters.nin("idProfile", idProfile)))
                .into(new ArrayList<>());
    }
}
