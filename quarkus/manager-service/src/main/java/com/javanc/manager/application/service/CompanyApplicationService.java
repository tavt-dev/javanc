package com.javanc.manager.application.service;

import com.javanc.manager.application.dto.AuthenticationRequest;
import com.javanc.manager.application.dto.CompanyDTO;
import com.javanc.manager.application.exception.ApplicationException;
import com.javanc.manager.application.exception.ErrorCode;
import com.javanc.manager.application.mapper.CompanyMapper;
import com.javanc.manager.application.port.ImageStoragePort;
import com.javanc.manager.application.port.UserAccountPort;
import com.javanc.manager.domain.model.Company;
import com.javanc.manager.domain.repository.CompanyRepository;
import com.javanc.manager.domain.service.ManagerIdGenerator;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class CompanyApplicationService {

    private final CompanyRepository companyRepository;
    private final CompanyMapper companyMapper;
    private final ManagerIdGenerator idGenerator;
    private final ImageStoragePort imageStoragePort;
    private final UserAccountPort userAccountPort;

    @Inject
    public CompanyApplicationService(CompanyRepository companyRepository, CompanyMapper companyMapper,
            ManagerIdGenerator idGenerator, ImageStoragePort imageStoragePort, UserAccountPort userAccountPort) {
        this.companyRepository = companyRepository;
        this.companyMapper = companyMapper;
        this.idGenerator = idGenerator;
        this.imageStoragePort = imageStoragePort;
        this.userAccountPort = userAccountPort;
    }

    public CompanyDTO create(CompanyDTO companyDTO, FileUpload image) {
        Company company = new Company();
        company.id = idGenerator.nextId();
        company.name = companyDTO.name;
        company.type = companyDTO.type;
        company.description = companyDTO.description;
        company.street = companyDTO.street;
        company.city = companyDTO.city;
        company.phone = companyDTO.phone;
        company.email = companyDTO.email;
        company.country = companyDTO.country;
        company.url = image == null ? "" : imageStoragePort.uploadCompanyImage(image);
        return companyMapper.toDto(companyRepository.create(company));
    }

    public CompanyDTO update(CompanyDTO companyDTO) {
        return companyMapper.toDto(companyRepository.save(companyMapper.toDomain(companyDTO)));
    }

    public void deleteById(Integer id) {
        companyRepository.deleteByCompanyId(id);
    }

    public CompanyDTO findById(Integer id) {
        return companyMapper.toDto(companyRepository.findByCompanyId(id)
                .orElseThrow(() -> new ApplicationException(ErrorCode.COMPANY_NOT_FOUND)));
    }

    public List<CompanyDTO> getCompanyDTOs() {
        return companyRepository.findAllLimited().stream().map(companyMapper::toDto).toList();
    }

    public List<CompanyDTO> getCompanyByType(String type) {
        return companyRepository.findByTypeRegex(type).stream().map(companyMapper::toDto).toList();
    }

    public CompanyDTO setHRToCompany(AuthenticationRequest request, Integer idCompany) {
        request.role = "hr";
        Integer hrId = userAccountPort.signUp(request);
        CompanyDTO companyDTO = findById(idCompany);
        if (companyDTO.idHR == null) {
            companyDTO.idHR = new ArrayList<>();
        }
        companyDTO.idHR.add(hrId);
        return update(companyDTO);
    }

    public CompanyDTO setManagerToCompany(AuthenticationRequest request, Integer idCompany) {
        request.role = "manager";
        Integer managerId = userAccountPort.signUp(request);
        CompanyDTO companyDTO = findById(idCompany);
        companyDTO.idManager = managerId;
        return update(companyDTO);
    }

    public CompanyDTO getCompanyByIdManager(Integer id) {
        return companyMapper.toDto(companyRepository.findByManagerId(id)
                .orElseThrow(() -> new ApplicationException(ErrorCode.COMPANY_NOT_FOUND)));
    }

    public CompanyDTO findByIdHr(Integer id) {
        return companyMapper.toDto(companyRepository.findByHrId(id)
                .orElseThrow(() -> new ApplicationException(ErrorCode.COMPANY_NOT_FOUND)));
    }
}
