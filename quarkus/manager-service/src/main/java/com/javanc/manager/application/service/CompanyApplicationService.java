package com.javanc.manager.application.service;

import com.javanc.manager.application.dto.AuthenticationRequest;
import com.javanc.manager.application.dto.CompanyDTO;
import com.javanc.manager.application.dto.RoleRequestDTO;
import com.javanc.manager.application.dto.UserDTO;
import com.javanc.manager.application.exception.ApplicationException;
import com.javanc.manager.application.exception.ErrorCode;
import com.javanc.manager.application.mapper.CompanyMapper;
import com.javanc.manager.application.port.ImageStoragePort;
import com.javanc.manager.application.port.UserAccountPort;
import com.javanc.manager.domain.model.Company;
import com.javanc.manager.domain.repository.CompanyRepository;
import com.javanc.manager.domain.service.ManagerIdGenerator;
import com.javanc.common.pagination.PageRequest;
import com.javanc.common.pagination.PageResponse;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@ApplicationScoped
public class CompanyApplicationService {
    private static final Set<String> COMPANY_SORT_FIELDS = Set.of("id", "name", "type", "city", "country");
    private static final Set<String> USER_SORT_FIELDS = Set.of("id", "name", "email", "role", "status", "createdAt",
            "updatedAt");

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
        company.idManager = companyDTO.idManager;
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

    public PageResponse<CompanyDTO> searchCompanies(String query, String type, String location, Integer page,
            Integer size, String sort) {
        return mapCompanies(companyRepository.search(query, type, location, pageRequest(page, size, sort)));
    }

    public CompanyDTO setHRToCompany(AuthenticationRequest request, Integer idCompany) {
        Integer hrId = userAccountPort.createAccount(accountRequest(request, "hr"));
        return appendHrToCompany(idCompany, hrId);
    }

    public CompanyDTO promoteUserToHR(Integer userId, Integer idCompany) {
        if (userId == null || userId <= 0) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST);
        }
        CompanyDTO companyDTO = findById(idCompany);
        userAccountPort.requestHrPromotion(userId, companyDTO.id, companyDTO.name);
        return companyDTO;
    }

    public CompanyDTO getMyManagedCompany() {
        UserDTO currentUser = userAccountPort.currentUser();
        if (!"manager".equalsIgnoreCase(currentUser.role)) {
            throw new ApplicationException(ErrorCode.FORBIDDEN);
        }
        return companyMapper.toDto(companyRepository.findByManagerId(currentUser.id)
                .orElseThrow(() -> new ApplicationException(ErrorCode.COMPANY_NOT_FOUND,
                        "Create or assign a company before inviting HR")));
    }

    public PageResponse<UserDTO> searchHrCandidates(String query, Integer page, Integer size, String sort) {
        CompanyDTO company = getMyManagedCompany();
        List<Integer> existingHr = company.idHR == null ? List.of() : company.idHR;
        PageRequest request = userPageRequest(page, size, sort);
        PageResponse<UserDTO> users = userAccountPort.searchUsers(query, "user", request.page(), request.size(),
                sortExpression(request));
        return new PageResponse<>(
                users.items().stream().filter(user -> user.id != null && !existingHr.contains(user.id)).toList(),
                users.page(),
                users.size(),
                users.totalElements(),
                users.totalPages(),
                users.hasNext(),
                users.hasPrevious());
    }

    public RoleRequestDTO requestHrPromotion(Integer targetUserId) {
        CompanyDTO company = getMyManagedCompany();
        return userAccountPort.requestHrPromotion(targetUserId, company.id, company.name);
    }

    public CompanyDTO acceptHrPromotion(Integer requestId) {
        RoleRequestDTO request = userAccountPort.acceptHrPromotion(requestId);
        if (!"APPROVED".equalsIgnoreCase(request.status) || request.companyId == null || request.targetUserId == null) {
            throw new ApplicationException(ErrorCode.CONFLICT);
        }
        return appendHrToCompany(request.companyId, request.targetUserId);
    }

    public CompanyDTO leaveHr() {
        UserDTO currentUser = userAccountPort.currentUser();
        if (!"hr".equalsIgnoreCase(currentUser.role)) {
            throw new ApplicationException(ErrorCode.FORBIDDEN);
        }
        CompanyDTO companyDTO = findByIdHr(currentUser.id);
        if (companyDTO.idHR != null) {
            companyDTO.idHR.remove(currentUser.id);
        }
        CompanyDTO updated = update(companyDTO);
        userAccountPort.leaveHr();
        return updated;
    }

    public CompanyDTO setManagerToCompany(AuthenticationRequest request, Integer idCompany) {
        Integer managerId = userAccountPort.createAccount(accountRequest(request, "manager"));
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

    private AuthenticationRequest accountRequest(AuthenticationRequest source, String role) {
        AuthenticationRequest request = new AuthenticationRequest();
        request.name = source.name;
        request.email = source.email;
        request.password = source.password;
        request.employeeId = source.employeeId;
        request.role = role;
        return request;
    }

    private CompanyDTO appendHrToCompany(Integer idCompany, Integer hrId) {
        CompanyDTO companyDTO = findById(idCompany);
        if (companyDTO.idHR == null) {
            companyDTO.idHR = new ArrayList<>();
        }
        if (!companyDTO.idHR.contains(hrId)) {
            companyDTO.idHR.add(hrId);
        }
        return update(companyDTO);
    }

    private PageRequest pageRequest(Integer page, Integer size, String sort) {
        try {
            return PageRequest.resolve(page, size, sort, "id,desc", COMPANY_SORT_FIELDS);
        } catch (IllegalArgumentException exception) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, exception.getMessage());
        }
    }

    private PageRequest userPageRequest(Integer page, Integer size, String sort) {
        try {
            return PageRequest.resolve(page, size, sort, "id,desc", USER_SORT_FIELDS);
        } catch (IllegalArgumentException exception) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, exception.getMessage());
        }
    }

    private String sortExpression(PageRequest request) {
        return request.sortField() + "," + request.direction().name().toLowerCase();
    }

    private PageResponse<CompanyDTO> mapCompanies(PageResponse<Company> response) {
        return new PageResponse<>(
                response.items().stream().map(companyMapper::toDto).toList(),
                response.page(),
                response.size(),
                response.totalElements(),
                response.totalPages(),
                response.hasNext(),
                response.hasPrevious());
    }
}
