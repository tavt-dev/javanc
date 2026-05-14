package com.javanc.manager.domain.repository;

import com.javanc.manager.domain.model.Company;

import java.util.List;
import java.util.Optional;

public interface CompanyRepository {
    Company create(Company company);
    Company save(Company company);
    void deleteByCompanyId(Integer id);
    Optional<Company> findByCompanyId(Integer id);
    List<Company> findAllLimited();
    List<Company> findAllCompanies();
    List<Company> findByTypeRegex(String type);
    Optional<Company> findByManagerId(Integer idManager);
    Optional<Company> findByHrId(Integer idHr);
}
