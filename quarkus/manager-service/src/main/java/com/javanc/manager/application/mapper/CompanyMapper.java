package com.javanc.manager.application.mapper;

import com.javanc.manager.application.dto.CompanyDTO;
import com.javanc.manager.domain.model.Company;
import com.javanc.manager.interfaces.rest.form.CompanyMultipartForm;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class CompanyMapper {

    public Company toDomain(CompanyDTO dto) {
        Company company = new Company();
        if (dto == null) {
            return company;
        }
        company.id = dto.id;
        company.name = dto.name;
        company.type = dto.type;
        company.description = dto.description;
        company.street = dto.street;
        company.email = dto.email;
        company.phone = dto.phone;
        company.city = dto.city;
        company.country = dto.country;
        company.idManager = dto.idManager;
        company.idHr = dto.idHR;
        company.idJobs = dto.idJobs;
        return company;
    }

    public CompanyDTO toDto(Company company) {
        if (company == null) {
            return null;
        }
        CompanyDTO dto = new CompanyDTO();
        dto.id = company.id;
        dto.name = company.name;
        dto.type = company.type;
        dto.description = company.description;
        dto.street = company.street;
        dto.email = company.email;
        dto.phone = company.phone;
        dto.city = company.city;
        dto.country = company.country;
        dto.idManager = company.idManager;
        dto.idHR = company.idHr;
        dto.idJobs = company.idJobs;
        return dto;
    }

    public CompanyDTO toDto(CompanyMultipartForm form) {
        CompanyDTO dto = new CompanyDTO();
        dto.id = form.id;
        dto.name = form.name;
        dto.type = form.type;
        dto.description = form.description;
        dto.street = form.street;
        dto.email = form.email;
        dto.phone = form.phone;
        dto.city = form.city;
        dto.country = form.country;
        dto.idManager = form.idManager;
        dto.idHR = form.idHR;
        dto.idJobs = form.idJobs;
        return dto;
    }
}
