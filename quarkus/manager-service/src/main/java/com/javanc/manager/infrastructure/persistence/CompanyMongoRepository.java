package com.javanc.manager.infrastructure.persistence;

import com.javanc.manager.domain.model.Company;
import com.javanc.manager.domain.repository.CompanyRepository;
import com.mongodb.client.model.Filters;
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
    public List<Company> findAllLimited() {
        return findAll().page(0, 50).list();
    }

    @Override
    public List<Company> findByTypeRegex(String type) {
        return mongoCollection().find(Filters.regex("type", type)).limit(20).into(new ArrayList<>());
    }

    @Override
    public Optional<Company> findByManagerId(Integer idManager) {
        return Optional.ofNullable(find("idManager", idManager).firstResult());
    }

    @Override
    public Optional<Company> findByHrId(Integer idHr) {
        return Optional.ofNullable(mongoCollection().find(Filters.eq("idHr", idHr)).first());
    }
}
