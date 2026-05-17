package com.javanc.manager.domain.repository;

import com.javanc.manager.domain.model.Company;
import com.javanc.common.pagination.PageRequest;
import com.javanc.common.pagination.PageResponse;

import java.util.Optional;

public interface CompanyRepository {
    Company create(Company company);
    Company save(Company company);
    void deleteByCompanyId(Integer id);
    Optional<Company> findByCompanyId(Integer id);
    PageResponse<Company> search(String query, String type, String location, PageRequest pageRequest);
    Optional<Company> findByManagerId(Integer idManager);
    Optional<Company> findByHrId(Integer idHr);
}
