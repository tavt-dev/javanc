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
        UserDTO currentUser = userAccountPort.currentUser();
        if (!"manager".equalsIgnoreCase(currentUser.role) && !"admin".equalsIgnoreCase(currentUser.role)) {
            throw new ApplicationException(ErrorCode.FORBIDDEN);
        }
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
        company.idManager = companyDTO.idManager == null && "manager".equalsIgnoreCase(currentUser.role)
                ? currentUser.id
                : companyDTO.idManager;
        company.url = image == null ? "" : imageStoragePort.uploadCompanyImage(image);
        return companyMapper.toDto(companyRepository.create(company));
    }

    public CompanyDTO update(CompanyDTO companyDTO) {
        requireCanManageCompany(companyDTO.id);
        return companyMapper.toDto(companyRepository.save(companyMapper.toDomain(companyDTO)));
    }

    public void deleteById(Integer id) {
        UserDTO currentUser = userAccountPort.currentUser();
        if (!"admin".equalsIgnoreCase(currentUser.role)) {
            throw new ApplicationException(ErrorCode.FORBIDDEN);
        }
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
        requireManagerCompany(idCompany);
        Integer hrId = userAccountPort.createAccount(accountRequest(request, "hr"));
        return appendHrToCompany(idCompany, hrId);
    }

    public CompanyDTO promoteUserToHR(Integer userId, Integer idCompany) {
        if (userId == null || userId <= 0) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST);
        }
        requireManagerCompany(idCompany);
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

    public List<UserDTO> searchHrCandidates(String query, Integer page, Integer size) {
        CompanyDTO company = getMyManagedCompany();
        int resolvedPage = page == null ? 0 : page;
        int resolvedSize = size == null ? 10 : size;
        List<Integer> existingHr = company.idHR == null ? List.of() : company.idHR;
        return userAccountPort.searchUsers(query, "user", resolvedPage, resolvedSize).stream()
                .filter(user -> user.id != null && !existingHr.contains(user.id))
                .toList();
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
        CompanyDTO updated = saveCompany(companyDTO);
        userAccountPort.leaveHr();
        return updated;
    }

    public CompanyDTO setManagerToCompany(AuthenticationRequest request, Integer idCompany) {
        UserDTO currentUser = userAccountPort.currentUser();
        if (!"admin".equalsIgnoreCase(currentUser.role)) {
            throw new ApplicationException(ErrorCode.FORBIDDEN);
        }
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
        return saveCompany(companyDTO);
    }

    private CompanyDTO saveCompany(CompanyDTO companyDTO) {
        return companyMapper.toDto(companyRepository.save(companyMapper.toDomain(companyDTO)));
    }

    private void requireCanManageCompany(Integer companyId) {
        UserDTO currentUser = userAccountPort.currentUser();
        if ("admin".equalsIgnoreCase(currentUser.role)) {
            return;
        }
        if ("manager".equalsIgnoreCase(currentUser.role)) {
            CompanyDTO company = findById(companyId);
            if (currentUser.id != null && currentUser.id.equals(company.idManager)) {
                return;
            }
        }
        throw new ApplicationException(ErrorCode.FORBIDDEN);
    }

    private void requireManagerCompany(Integer companyId) {
        UserDTO currentUser = userAccountPort.currentUser();
        if (!"manager".equalsIgnoreCase(currentUser.role)) {
            throw new ApplicationException(ErrorCode.FORBIDDEN);
        }
        CompanyDTO company = findById(companyId);
        if (currentUser.id == null || !currentUser.id.equals(company.idManager)) {
            throw new ApplicationException(ErrorCode.FORBIDDEN);
        }
    }
}
