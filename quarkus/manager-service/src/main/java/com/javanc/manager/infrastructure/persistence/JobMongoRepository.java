package com.javanc.manager.infrastructure.persistence;

import com.javanc.manager.domain.model.Job;
import com.javanc.manager.domain.repository.JobRepository;
import com.javanc.common.pagination.PageRequest;
import com.javanc.common.pagination.PageResponse;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;
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
    public PageResponse<Job> search(String query, String type, Integer companyId, Boolean openOnly,
            Integer pendingProfileId, Integer acceptedProfileId, Integer excludedProfileId, PageRequest pageRequest) {
        List<org.bson.conversions.Bson> filters = new ArrayList<>();
        if (query != null && !query.isBlank()) {
            String safe = java.util.regex.Pattern.quote(query.trim());
            filters.add(Filters.or(Filters.regex("title", safe, "i"), Filters.regex("description", safe, "i")));
        }
        if (type != null && !type.isBlank()) {
            filters.add(Filters.eq("typeJob", type.trim().toLowerCase()));
        }
        if (companyId != null) {
            filters.add(Filters.eq("idCompany", companyId));
        }
        if (Boolean.TRUE.equals(openOnly)) {
            filters.add(Filters.gt("size", 0));
        }
        if (pendingProfileId != null) {
            filters.add(Filters.eq("idProfiePending", pendingProfileId));
        }
        if (acceptedProfileId != null) {
            filters.add(Filters.eq("idProfile", acceptedProfileId));
        }
        if (excludedProfileId != null) {
            filters.add(Filters.nin("idProfiePending", excludedProfileId));
            filters.add(Filters.nin("idProfile", excludedProfileId));
        }
        org.bson.conversions.Bson filter = filters.isEmpty() ? new org.bson.Document() : Filters.and(filters);
        long total = mongoCollection().countDocuments(filter);
        List<Job> items = mongoCollection().find(filter)
                .sort(sort(pageRequest))
                .skip(pageRequest.page() * pageRequest.size())
                .limit(pageRequest.size())
                .into(new ArrayList<>());
        return PageResponse.of(items, pageRequest, total);
    }

    private org.bson.conversions.Bson sort(PageRequest request) {
        return request.direction() == com.javanc.common.pagination.SortDirection.ASC
                ? Sorts.ascending(request.sortField())
                : Sorts.descending(request.sortField());
    }
}
