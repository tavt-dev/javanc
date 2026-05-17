package com.javanc.manager.infrastructure.persistence;

import com.javanc.manager.domain.model.Company;
import com.javanc.manager.domain.repository.CompanyRepository;
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
public class CompanyMongoRepository implements CompanyRepository, PanacheMongoRepositoryBase<Company, Integer> {

    @Override
    public Company create(Company company) {
        persist(company);
        return company;
    }

    @Override
    public Company save(Company company) {
        update(company);
        return company;
    }

    @Override
    public void deleteByCompanyId(Integer id) {
        deleteById(id);
    }

    @Override
    public Optional<Company> findByCompanyId(Integer id) {
        return findByIdOptional(id);
    }

    @Override
    public PageResponse<Company> search(String query, String type, String location, PageRequest pageRequest) {
        List<org.bson.conversions.Bson> filters = new ArrayList<>();
        if (query != null && !query.isBlank()) {
            String safe = java.util.regex.Pattern.quote(query.trim());
            filters.add(Filters.or(Filters.regex("name", safe, "i"), Filters.regex("type", safe, "i"),
                    Filters.regex("description", safe, "i")));
        }
        if (type != null && !type.isBlank()) {
            filters.add(Filters.regex("type", java.util.regex.Pattern.quote(type.trim()), "i"));
        }
        if (location != null && !location.isBlank()) {
            String safe = java.util.regex.Pattern.quote(location.trim());
            filters.add(Filters.or(Filters.regex("city", safe, "i"), Filters.regex("country", safe, "i")));
        }
        org.bson.conversions.Bson filter = filters.isEmpty() ? new org.bson.Document() : Filters.and(filters);
        long total = mongoCollection().countDocuments(filter);
        List<Company> items = mongoCollection().find(filter)
                .sort(sort(pageRequest))
                .skip(pageRequest.page() * pageRequest.size())
                .limit(pageRequest.size())
                .into(new ArrayList<>());
        return PageResponse.of(items, pageRequest, total);
    }

    @Override
    public Optional<Company> findByManagerId(Integer idManager) {
        return Optional.ofNullable(find("idManager", idManager).firstResult());
    }

    @Override
    public Optional<Company> findByHrId(Integer idHr) {
        return Optional.ofNullable(mongoCollection().find(Filters.eq("idHr", idHr)).first());
    }

    private org.bson.conversions.Bson sort(PageRequest request) {
        return request.direction() == com.javanc.common.pagination.SortDirection.ASC
                ? Sorts.ascending(request.sortField())
                : Sorts.descending(request.sortField());
    }
}
